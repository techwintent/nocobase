/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Diff/upsert engine for clothing import.
 * Finds existing records by unique key, compares values, and determines insert/update/skip.
 */

import { Database } from '@nocobase/database';
import type { ImportType } from './xlsx-parser';

const STATUS_MAP_PRODUCT: Record<string, string> = { 在售: 'active', 停售: 'inactive', 下架: 'inactive' };
const STATUS_MAP_CUSTOMER: Record<string, string> = { 活跃: 'active', 沉睡: 'inactive', 流失: 'inactive' };

export type DiffAction = 'insert' | 'update' | 'skip';

export interface DiffResult {
  action: DiffAction;
  uniqueKey: string;
  values?: Record<string, any>;
  existing?: Record<string, any>;
  changedFields?: string[];
  duplicateIds?: number[];
}

export class DataDiffer {
  constructor(
    private db: Database,
    private maps: {
      stores: Record<string, any>;
      suppliers: Record<string, any>;
      brands: Record<string, any>;
      categories: Record<string, any>;
      products: Record<string, any>;
      skus: Record<string, any>;
      customers: Record<string, any>;
      employees: Record<string, any>;
      vipLevels: Record<string, any>;
    },
  ) {}

  private async findOne(collection: string, filter: Record<string, any>): Promise<Record<string, any> | null> {
    const f =
      Object.keys(filter).length === 1 ? { [Object.keys(filter)[0]]: { $eq: Object.values(filter)[0] } } : filter;
    const repo = this.db.getRepository(collection);
    const list = await repo.find({ filter: f, limit: 1 });
    return list[0]?.toJSON?.() ?? list[0] ?? null;
  }

  private async findMany(collection: string, filter: Record<string, any>): Promise<Record<string, any>[]> {
    const f =
      Object.keys(filter).length === 1 ? { [Object.keys(filter)[0]]: { $eq: Object.values(filter)[0] } } : filter;
    const repo = this.db.getRepository(collection);
    const list = await repo.find({ filter: f });
    return list.map((r: any) => (r?.toJSON ? r.toJSON() : r));
  }

  private objEquals(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    const ka = Object.keys(a || {}).sort();
    const kb = Object.keys(b || {}).sort();
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      const va = a[k];
      const vb = b[k];
      if (typeof va === 'number' && typeof vb === 'number') {
        if (Math.abs(va - vb) > 0.01) return false;
      } else if (JSON.stringify(va) !== JSON.stringify(vb)) {
        return false;
      }
    }
    return true;
  }

  private getChangedFields(existing: Record<string, any>, values: Record<string, any>): string[] {
    const changed: string[] = [];
    for (const [k, v] of Object.entries(values)) {
      const ev = existing[k];
      if (typeof v === 'number' && typeof ev === 'number') {
        if (Math.abs(v - ev) > 0.01) changed.push(k);
      } else if (JSON.stringify(v) !== JSON.stringify(ev)) {
        changed.push(k);
      }
    }
    return changed;
  }

  async diffProducts(row: Record<string, any>): Promise<DiffResult> {
    const spuCode = String(row['款号'] ?? '').trim();
    const uniqueKey = spuCode;
    if (!spuCode) {
      return { action: 'skip', uniqueKey: '' };
    }

    const values = {
      spu_code: spuCode,
      name: row['名称'],
      status: STATUS_MAP_PRODUCT[row['状态']] ?? (row['状态'] === '在售' ? 'active' : 'inactive'),
      cost_price: row['采购价'] != null ? Number(row['采购价']) : null,
      price_1: row['价格1'] != null ? Number(row['价格1']) : null,
      price_2: row['价格2'] != null ? Number(row['价格2']) : null,
      price_3: row['价格3'] != null ? Number(row['价格3']) : null,
      discount: row['产品折扣'] != null ? Number(row['产品折扣']) : 1,
      supplier_id: this.maps.suppliers[row['供应商']]?.id,
      supplier_name: row['供应商'],
      brand_id: this.maps.brands[row['品牌']]?.id,
      brand_name: row['品牌'],
      category_id: this.maps.categories[row['类别']]?.id,
      category_name: row['类别'],
      style: row['风格'],
      season: row['季节'],
      listed_at: row['上架日期'] || null,
    };

    const all = await this.findMany('products', { spu_code: spuCode });
    if (!all.length) {
      return { action: 'insert', uniqueKey, values };
    }
    const sorted = all.sort((a, b) => {
      const ad = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bd = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bd - ad;
    });
    const existing = sorted[0];
    const duplicateIds = sorted
      .slice(1)
      .map((r) => r.id)
      .filter((id) => id != null);
    const toCompare = { ...values };
    delete toCompare['spu_code'];
    const existingCompare = { ...existing };
    delete existingCompare['id'];
    delete existingCompare['createdAt'];
    delete existingCompare['updatedAt'];
    if (this.objEquals(toCompare, existingCompare)) {
      return { action: 'skip', uniqueKey, existing, duplicateIds };
    }
    const changedFields = this.getChangedFields(existing, toCompare);
    return {
      action: 'update',
      uniqueKey,
      values: { ...values, id: existing.id },
      existing,
      changedFields,
      duplicateIds,
    };
  }

  async diffInventory(row: Record<string, any>): Promise<DiffResult> {
    const storeName = String(row['门店'] ?? '').trim();
    const barcode = String(row['条码'] ?? '').trim();
    const uniqueKey = `${storeName}|${barcode}`;
    if (!storeName || !barcode) {
      return { action: 'skip', uniqueKey: '' };
    }

    const store = this.maps.stores[storeName];
    const product = this.maps.products[row['款号']];
    const skuKey = `${row['款号']}|${row['颜色']}|${row['尺码']}`;
    const sku = this.maps.skus[skuKey];
    if (!store || !product || !sku) {
      return { action: 'skip', uniqueKey };
    }

    const qty = Number(row['库存'] ?? 0) || 0;
    const values = {
      store_id: store.id,
      store_name: storeName,
      product_id: product.id,
      sku_id: sku.id,
      spu_code: row['款号'],
      barcode,
      product_name: product.name,
      color: row['颜色'],
      size: row['尺码'],
      quantity: qty,
      available_qty: qty,
    };

    const existing = await this.findOne('inventory', { store_id: store.id, sku_id: sku.id });
    if (!existing) {
      return { action: 'insert', uniqueKey, values };
    }
    const toCompare = { quantity: qty };
    const existingCompare = { quantity: existing.quantity ?? 0 };
    if (this.objEquals(toCompare, existingCompare)) {
      return { action: 'skip', uniqueKey, existing };
    }
    return {
      action: 'update',
      uniqueKey,
      values: { ...values, id: existing.id },
      existing,
      changedFields: ['quantity', 'available_qty'],
    };
  }

  async diffCustomers(row: Record<string, any>): Promise<DiffResult> {
    const phone = String(row['手机'] ?? '').replace(/\D/g, '');
    const uniqueKey = phone;
    if (!phone) {
      return { action: 'skip', uniqueKey: '' };
    }

    const storeId = this.maps.stores['总店']?.id;
    const values = {
      name: row['客户名称'],
      phone: row['手机'],
      gender: row['性别'] || '女',
      birthday: row['生日'] || null,
      status: STATUS_MAP_CUSTOMER[row['状态']] || 'active',
      vip_level_id: this.maps.vipLevels[row['VIP等级']]?.id,
      vip_level_name: row['VIP等级'],
      customer_discount: row['客户折扣'] != null ? Number(row['客户折扣']) : null,
      total_orders: row['购买次数'] != null ? Number(row['购买次数']) : 0,
      total_amount: row['购买金额'] != null ? Number(row['购买金额']) : 0,
      last_order_at: row['上次消费日期'] || null,
      last_order_amount: row['上次消费金额'] != null ? Number(row['上次消费金额']) : null,
      days_since_last: row['未消费天数'] != null ? Number(row['未消费天数']) : null,
      store_id: storeId,
    };

    const existing = await this.findOne('customers', { phone: row['手机'] });
    if (!existing) {
      return { action: 'insert', uniqueKey, values };
    }
    const toCompare = { ...values };
    delete toCompare['phone'];
    const existingCompare = { ...existing };
    delete existingCompare['id'];
    delete existingCompare['phone'];
    delete existingCompare['createdAt'];
    delete existingCompare['updatedAt'];
    if (this.objEquals(toCompare, existingCompare)) {
      return { action: 'skip', uniqueKey, existing };
    }
    const changedFields = this.getChangedFields(existing, values);
    return { action: 'update', uniqueKey, values: { ...values, id: existing.id }, existing, changedFields };
  }

  async diffSalesOrders(row: Record<string, any>): Promise<DiffResult> {
    const batchNo = String(row['批次'] ?? '').trim();
    let orderNo: string;
    if (batchNo) {
      orderNo = batchNo;
    } else {
      // Build deterministic key from row data to prevent duplicates on re-import
      const dateStr = String(row['日期'] ?? '').trim();
      const storeName = String(row['门店'] ?? '').trim();
      const customerName = String(row['客户'] ?? '').trim();
      const employeeName = String(row['经办人'] ?? '').trim();
      const amount = String(row['应收'] ?? row['销售额'] ?? '').trim();
      orderNo = `SO-${dateStr}-${storeName}-${customerName}-${employeeName}-${amount}`;
    }
    const uniqueKey = orderNo;

    const store = this.maps.stores[row['门店']];
    const customer = this.maps.customers[row['客户']];
    const employee = this.maps.employees[row['经办人']];
    if (!store || !customer) {
      return { action: 'skip', uniqueKey };
    }

    const values = {
      order_no: orderNo,
      batch_no: batchNo,
      status: row['状态'] === '已完成' ? 'completed' : 'pending',
      store_id: store.id,
      store_name: row['门店'],
      customer_id: customer.id,
      customer_name: row['客户'],
      customer_phone: customer.phone,
      employee_id: employee?.id,
      employee_name: row['经办人'],
      order_date: row['日期'] || null,
      actual_qty: row['实销数'] ?? row['销售数'] ?? 0,
      sale_amount: row['销售额'] ?? row['应收'] ?? 0,
      receivable: row['应收'] ?? row['销售额'] ?? 0,
      received: row['实收'] ?? row['应收'] ?? 0,
      pay_wechat: row['微信'] ?? row['实收'] ?? 0,
      pay_qrcode: row['扫码收款'] ?? row['实收'] ?? 0,
      remark: row['备注'] || null,
    };

    const existing = await this.findOne('sales_orders', { order_no: orderNo });
    if (!existing) {
      return { action: 'insert', uniqueKey, values };
    }
    const toCompare = { status: values.status, received: values.received };
    const existingCompare = { status: existing.status, received: existing.received };
    if (this.objEquals(toCompare, existingCompare)) {
      return { action: 'skip', uniqueKey, existing };
    }
    return {
      action: 'update',
      uniqueKey,
      values: { ...values, id: existing.id },
      existing,
      changedFields: ['status', 'received'],
    };
  }

  async diff(type: ImportType, row: Record<string, any>): Promise<DiffResult> {
    switch (type) {
      case 'products':
        return this.diffProducts(row);
      case 'inventory':
        return this.diffInventory(row);
      case 'customers':
        return this.diffCustomers(row);
      case 'sales_orders':
        return this.diffSalesOrders(row);
      default:
        return { action: 'skip', uniqueKey: '' };
    }
  }
}
