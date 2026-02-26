/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 经营概览统计服务（商品/客户/趋势）
 * 与 design/business-overview-design.md 一致
 */

import type { Database } from '@nocobase/database';
import { WINTENT_CONFIG } from '../config';

export interface ProductStats {
  total: number;
  outOfSize: number;
  new: number;
  slow: number;
}

export interface CustomerStats {
  total: number;
  active: number;
  sleeping: number;
  churn: number;
}

export interface TrendPoint {
  date: string;
  salesQty: number;
  customerCount: number;
}

export interface OverviewStats {
  product: ProductStats;
  customer: CustomerStats;
  trend: TrendPoint[];
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

const defaultProduct: ProductStats = { total: 0, outOfSize: 0, new: 0, slow: 0 };
const defaultCustomer: CustomerStats = { total: 0, active: 0, sleeping: 0, churn: 0 };

export async function getOverviewStats(db: Database): Promise<OverviewStats> {
  const { STOCK_THRESHOLD, SLEEP_DAYS, CHURN_DAYS, NEW_PRODUCT_DAYS } = WINTENT_CONFIG;

  const now = new Date();
  const newProductSince = daysAgo(NEW_PRODUCT_DAYS);
  const trendSince = daysAgo(30);

  let product: ProductStats = { ...defaultProduct };
  try {
    const productRepo = db.getRepository('products');
    const inventoryRepo = db.getRepository('inventory');

    const productTotal = await productRepo.count({
      filter: { status: 'active' },
    });
    const lowStockRows = await inventoryRepo.find({
      filter: { quantity: { $lt: STOCK_THRESHOLD } },
      fields: ['product_id'],
      limit: 10000,
    });
    const outOfSizeProductIds = new Set((lowStockRows as any[]).map((r) => r.product_id).filter(Boolean));
    const newCount = await productRepo.count({
      filter: { listed_at: { $gte: newProductSince.toISOString().slice(0, 10) } },
    });
    const slowCount = await productRepo.count({
      filter: { total_stock: { $gt: 0 }, total_sold: { $eq: 0 } },
    });
    product = {
      total: productTotal,
      outOfSize: outOfSizeProductIds.size,
      new: newCount,
      slow: slowCount,
    };
  } catch (e: any) {
    console.error('[wintent overview] product stats failed:', e?.message ?? e);
  }

  let customer: CustomerStats = { ...defaultCustomer };
  try {
    const customerRepo = db.getRepository('customers');
    const customerTotal = await customerRepo.count();
    const activeCount = await customerRepo.count({
      filter: { days_since_last: { $lte: SLEEP_DAYS } },
    });
    const sleepingCount = await customerRepo.count({
      filter: {
        $and: [{ days_since_last: { $gt: SLEEP_DAYS } }, { days_since_last: { $lte: CHURN_DAYS } }],
      },
    });
    const churnCount = await customerRepo.count({
      filter: { days_since_last: { $gt: CHURN_DAYS } },
    });
    customer = {
      total: customerTotal,
      active: activeCount,
      sleeping: sleepingCount,
      churn: churnCount,
    };
  } catch (e: any) {
    console.error('[wintent overview] customer stats failed:', e?.message ?? e);
  }

  let trend: TrendPoint[] = [];
  try {
    const salesOrdersRepo = db.getRepository('sales_orders');
    const salesItemsRepo = db.getRepository('sales_items');
    const orders = await salesOrdersRepo.find({
      filter: { order_date: { $gte: trendSince.toISOString().slice(0, 10) } },
      fields: ['id', 'order_date', 'customer_id'],
      limit: 5000,
    });
    const orderIds = (orders as any[]).map((o) => o.id);
    const byDate: Record<string, { salesQty: number; customerIds: Set<number> }> = {};
    for (let i = 0; i <= 30; i++) {
      const d = daysAgo(30 - i);
      const key = d.toISOString().slice(0, 10);
      byDate[key] = { salesQty: 0, customerIds: new Set() };
    }
    for (const o of orders as any[]) {
      const key = (o.order_date && String(o.order_date).slice(0, 10)) || now.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { salesQty: 0, customerIds: new Set() };
      if (o.customer_id) byDate[key].customerIds.add(o.customer_id);
    }
    if (orderIds.length > 0) {
      const items = await salesItemsRepo.find({
        filter: { order_id: { $in: orderIds } },
        fields: ['order_id', 'quantity'],
        limit: 20000,
      });
      const orderIdToDate: Record<number, string> = {};
      for (const o of orders as any[]) {
        orderIdToDate[o.id] = (o.order_date && String(o.order_date).slice(0, 10)) || '';
      }
      for (const it of items as any[]) {
        const key = orderIdToDate[it.order_id] || now.toISOString().slice(0, 10);
        if (byDate[key]) {
          byDate[key].salesQty += Number(it.quantity) || 0;
        }
      }
    }
    trend = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        salesQty: v.salesQty,
        customerCount: v.customerIds.size,
      }));
  } catch (e: any) {
    console.error('[wintent overview] trend failed:', e?.message ?? e);
  }

  return { product, customer, trend };
}

/** 返回各状态对应的商品 ID 列表，供库存模块商品列表打标与筛选 */
export async function getProductStatusMap(db: Database): Promise<{
  outOfSize: number[];
  new: number[];
  slow: number[];
}> {
  const { STOCK_THRESHOLD, NEW_PRODUCT_DAYS } = WINTENT_CONFIG;
  const newProductSince = daysAgo(NEW_PRODUCT_DAYS);
  const outOfSize: number[] = [];
  const newIds: number[] = [];
  const slowIds: number[] = [];

  try {
    const productRepo = db.getRepository('products');
    const inventoryRepo = db.getRepository('inventory');

    const lowStockRows = await inventoryRepo.find({
      filter: { quantity: { $lt: STOCK_THRESHOLD } },
      fields: ['product_id'],
      limit: 5000,
    });
    const outOfSizeSet = new Set((lowStockRows as any[]).map((r) => r.product_id).filter(Boolean));
    outOfSize.push(...outOfSizeSet);

    const newProducts = await productRepo.find({
      filter: { listed_at: { $gte: newProductSince.toISOString().slice(0, 10) } },
      fields: ['id'],
      limit: 5000,
    });
    newIds.push(...(newProducts as any[]).map((p) => p.id).filter(Boolean));

    const slowProducts = await productRepo.find({
      filter: { total_stock: { $gt: 0 }, total_sold: { $eq: 0 } },
      fields: ['id'],
      limit: 5000,
    });
    slowIds.push(...(slowProducts as any[]).map((p) => p.id).filter(Boolean));
  } catch (e: any) {
    console.error('[wintent overview] productStatusMap failed:', e?.message ?? e);
  }

  return { outOfSize, new: newIds, slow: slowIds };
}
