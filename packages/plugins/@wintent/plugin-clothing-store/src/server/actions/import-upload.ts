/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Clothing import upload action.
 * Accepts xlsx file, auto-detects type from headers, runs validation and diff/upsert.
 */

import { Context, Next } from '@nocobase/actions';
import * as fs from 'fs';
import * as path from 'path';
import { parseXlsx, type ImportType } from '../services/xlsx-parser';
import { validateRow } from '../services/validators';
import { DataDiffer, type DiffResult } from '../services/data-differ';
import { generateInsights } from '../services/insight-engine';
import type { DetailedChange } from '../../shared/types';

/** Build name→spu_code lookup from database at runtime */
function buildProductNameMap(maps: { products: Record<string, any> }): Record<string, string> {
  const nameToCode: Record<string, string> = {};
  for (const [spuCode, product] of Object.entries(maps.products)) {
    if (product.name) {
      nameToCode[product.name] = spuCode;
    }
  }
  return nameToCode;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function buildMaps(db: any) {
  const maps = {
    stores: {} as Record<string, any>,
    suppliers: {} as Record<string, any>,
    brands: {} as Record<string, any>,
    categories: {} as Record<string, any>,
    products: {} as Record<string, any>,
    skus: {} as Record<string, any>,
    customers: {} as Record<string, any>,
    employees: {} as Record<string, any>,
    vipLevels: {} as Record<string, any>,
  };

  const colToMap: Record<string, keyof typeof maps> = {
    stores: 'stores',
    suppliers: 'suppliers',
    brands: 'brands',
    categories: 'categories',
    products: 'products',
    customers: 'customers',
    employees: 'employees',
    vip_levels: 'vipLevels',
  };

  const load = async (col: string, keyField: string) => {
    const repo = db.getRepository(col);
    const list = await repo.find();
    const mapKey = colToMap[col] || col;
    const target = maps[mapKey];
    if (!target) return;
    for (const r of list) {
      const rec = r.toJSON ? r.toJSON() : r;
      const key = rec[keyField];
      if (key != null) target[key] = rec;
    }
  };

  await load('stores', 'name');
  await load('suppliers', 'name');
  await load('brands', 'name');
  await load('categories', 'name');
  await load('products', 'spu_code');
  await load('customers', 'name');
  await load('employees', 'name');
  await load('vip_levels', 'name');

  const skuRepo = db.getRepository('skus');
  const skus = await skuRepo.find();
  for (const r of skus) {
    const rec = r.toJSON ? r.toJSON() : r;
    const k = `${rec.spu_code}|${rec.color}|${rec.size}`;
    maps.skus[k] = rec;
  }

  return maps;
}

async function ensureRefAndCreate(
  db: any,
  maps: Record<string, Record<string, any>>,
  type: ImportType,
  rows: Record<string, any>[],
) {
  if (type === 'products') {
    const supplierNames = [...new Set(rows.map((r) => r['供应商']).filter(Boolean))];
    const brandNames = [...new Set(rows.map((r) => r['品牌']).filter(Boolean))];
    const categoryNames = [...new Set(rows.map((r) => r['类别']).filter(Boolean))];
    const storeNames = [...new Set(rows.map((r) => r['门店']).filter(Boolean))];

    for (const n of storeNames) {
      if (!maps.stores[n]) {
        const rec = await db.getRepository('stores').create({ values: { name: n, status: 'active' } });
        maps.stores[n] = rec.toJSON ? rec.toJSON() : rec;
      }
    }
    for (const n of supplierNames) {
      if (!maps.suppliers[n]) {
        const rec = await db.getRepository('suppliers').create({ values: { name: n } });
        maps.suppliers[n] = rec.toJSON ? rec.toJSON() : rec;
      }
    }
    for (const n of brandNames) {
      if (!maps.brands[n]) {
        const rec = await db.getRepository('brands').create({ values: { name: n } });
        maps.brands[n] = rec.toJSON ? rec.toJSON() : rec;
      }
    }
    for (const n of categoryNames) {
      if (!maps.categories[n]) {
        const rec = await db.getRepository('categories').create({ values: { name: n } });
        maps.categories[n] = rec.toJSON ? rec.toJSON() : rec;
      }
    }
  }

  if (type === 'customers') {
    const vipNames = [...new Set(rows.map((r) => r['VIP等级']).filter(Boolean))];
    for (const n of vipNames) {
      if (!maps.vipLevels[n]) {
        const rec = await db.getRepository('vip_levels').create({ values: { name: n } });
        maps.vipLevels[n] = rec.toJSON ? rec.toJSON() : rec;
      }
    }
    if (!maps.stores['总店']) {
      const rec = await db.getRepository('stores').create({ values: { name: '总店', status: 'active' } });
      maps.stores['总店'] = rec.toJSON ? rec.toJSON() : rec;
    }
  }

  if (type === 'sales_orders') {
    const employeeNames = [...new Set(rows.map((r) => r['经办人']).filter(Boolean))];
    const storeNames = [...new Set(rows.map((r) => r['门店']).filter(Boolean))];
    for (const n of storeNames) {
      if (!maps.stores[n]) {
        const rec = await db.getRepository('stores').create({ values: { name: n, status: 'active' } });
        maps.stores[n] = rec.toJSON ? rec.toJSON() : rec;
      }
    }
    const storeId = maps.stores['总店']?.id || maps.stores[storeNames[0]]?.id;
    for (const n of employeeNames) {
      if (!maps.employees[n]) {
        const rec = await db.getRepository('employees').create({ values: { name: n, store_id: storeId } });
        maps.employees[n] = rec.toJSON ? rec.toJSON() : rec;
      }
    }
  }
}

function toDetailedChange(
  type: ImportType,
  diff: DiffResult,
  row: Record<string, any>,
  maps: any,
): DetailedChange | null {
  if (diff.action === 'skip' || !diff.uniqueKey) return null;
  let label = '';
  const values = diff.values || {};
  const existing = diff.existing;

  if (type === 'products') {
    label = `商品 ${diff.uniqueKey} ${row['名称'] || values.name || ''}`;
  } else if (type === 'inventory') {
    const p = maps.products?.[row['款号']];
    const pn = p?.name || row['款号'];
    label = `库存 ${row['门店']} ${row['条码']} ${pn} ${row['颜色']}/${row['尺码']}`;
  } else if (type === 'customers') {
    label = `客户 ${row['客户名称'] || values.name || ''} ${row['手机'] || ''}`;
  } else if (type === 'sales_orders') {
    label = `销售单 ${values.order_no || row['批次']} ${row['客户'] || values.customer_name || ''}`;
  } else {
    label = diff.uniqueKey;
  }

  const change: DetailedChange = {
    action: diff.action as 'insert' | 'update',
    uniqueKey: diff.uniqueKey,
    label,
  };

  if (diff.action === 'update' && diff.changedFields?.length && existing) {
    change.changedFields = diff.changedFields;
    change.before = {};
    change.after = {};
    for (const f of diff.changedFields) {
      change.before[f] = existing[f];
      change.after[f] = values[f];
    }
  } else if (diff.action === 'insert' && values) {
    if (type === 'inventory') {
      change.after = { quantity: values.quantity, available_qty: values.available_qty };
    } else if (type === 'products') {
      change.after = {
        cost_price: values.cost_price,
        price_1: values.price_1,
        price_2: values.price_2,
        price_3: values.price_3,
      };
    } else if (type === 'customers') {
      change.after = { status: values.status, total_amount: values.total_amount };
    } else if (type === 'sales_orders') {
      change.after = { sale_amount: values.sale_amount, receivable: values.receivable };
    }
  }

  return change;
}

async function ensureSkuForInventory(db: any, maps: any, row: Record<string, any>) {
  const spu = row['款号'];
  const color = row['颜色'];
  const size = row['尺码'];
  const key = `${spu}|${color}|${size}`;
  if (maps.skus[key]) return;
  const product = maps.products[spu];
  if (!product) return;
  const rec = await db.getRepository('skus').create({
    values: {
      product_id: product.id,
      spu_code: spu,
      barcode: row['条码'],
      color,
      size,
      cost_price: row['进货价'],
      price_1: row['价格1'],
    },
  });
  maps.skus[key] = rec.toJSON ? rec.toJSON() : rec;
}

export async function clothingImportUpload(ctx: Context, next: Next) {
  if (!ctx.file?.buffer) {
    ctx.throw(400, 'No file uploaded. Please upload an xlsx file.');
  }

  const explicitType = ctx.action?.params?.type as ImportType | undefined;
  const db = ctx.db;
  const storagePath = path.join(process.cwd(), 'storage', 'uploads', 'clothing-import');
  const today = new Date().toISOString().slice(0, 10);
  const archiveDir = path.join(storagePath, today);
  ensureDir(archiveDir);

  let type: ImportType;
  let headers: string[];
  let rows: Record<string, any>[];

  try {
    const parsed = parseXlsx(ctx.file.buffer, explicitType);
    type = parsed.type;
    headers = parsed.headers;
    rows = parsed.rows;
  } catch (e: any) {
    ctx.throw(400, e.message || 'Failed to parse xlsx');
  }

  const maps = await buildMaps(db);
  await ensureRefAndCreate(db, maps, type, rows);

  const differ = new DataDiffer(db, maps);
  const result = {
    type,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as { row: number; message: string; details?: string }[],
    changes: [] as DetailedChange[],
  };

  const productExists = (spu: string) => !!maps.products[spu];
  const customerExists = (name: string) => !!maps.customers[name];

  const spuCodesInFile =
    type === 'inventory' ? new Set(rows.map((r) => String(r['款号'] ?? '').trim()).filter((v) => v)) : null;
  const touchedInventoryIds = type === 'inventory' ? new Set<number>() : null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const validation = validateRow(type, row, rowNum, {
      productExists: type === 'inventory' ? productExists : undefined,
      customerExists: type === 'sales_orders' ? customerExists : undefined,
    });
    if (!validation.valid) {
      result.errors.push({ row: rowNum, message: validation.errors.join('; ') });
      continue;
    }

    if (type === 'inventory') {
      await ensureSkuForInventory(db, maps, row);
    }

    const diff = await differ.diff(type, row);

    if (diff.action === 'skip') {
      result.skipped++;
      continue;
    }

    try {
      if (diff.action === 'insert' && diff.values) {
        const repo = db.getRepository(
          type === 'products'
            ? 'products'
            : type === 'inventory'
              ? 'inventory'
              : type === 'customers'
                ? 'customers'
                : 'sales_orders',
        );
        const { id, ...values } = diff.values;
        const created = await repo.create({ values });
        const rec = created.toJSON ? created.toJSON() : created;

        const dc = toDetailedChange(type, diff, row, maps);
        if (dc) result.changes.push(dc);

        if (type === 'products') {
          maps.products[rec.spu_code] = rec;
          if (diff.duplicateIds?.length) {
            await db.getRepository('products').destroy({
              filter: { id: { $in: diff.duplicateIds } },
            });
          }
        }
        if (type === 'inventory' && touchedInventoryIds) {
          if (rec.id != null) {
            touchedInventoryIds.add(rec.id);
          }
        }
        if (type === 'customers') maps.customers[rec.name] = rec;
        if (type === 'sales_orders') {
          const remark = row['备注'] || '';
          const parts = remark
            .split(/[+＋]/)
            .map((s: string) => s.trim())
            .filter(Boolean);
          const productNames = parts.length > 0 ? parts : [];
          const qtyPerItem = Math.floor((row['实销数'] ?? 1) / productNames.length) || 1;
          const unitPrice = (row['应收'] ?? row['销售额'] ?? 0) / (row['实销数'] || 1) || 0;
          const productNameMap = buildProductNameMap(maps);
          for (const pname of productNames) {
            const spuCode = productNameMap[pname];
            if (!spuCode) continue;
            const product = maps.products[spuCode];
            if (!product) continue;
            const skuKeys = Object.keys(maps.skus).filter((k) => k.startsWith(spuCode + '|'));
            const sku = skuKeys.length > 0 ? maps.skus[skuKeys[0]] : null;
            if (!sku) continue;
            await db.getRepository('sales_items').create({
              values: {
                order_id: rec.id,
                order_no: rec.order_no,
                product_id: product.id,
                sku_id: sku.id,
                spu_code: spuCode,
                product_name: product.name,
                color: sku.color,
                size: sku.size,
                quantity: qtyPerItem,
                sell_price: unitPrice,
                amount: qtyPerItem * unitPrice,
              },
            });
          }
        }
        result.inserted++;
      } else if (diff.action === 'update' && diff.values) {
        const { id, ...values } = diff.values;
        const repo = db.getRepository(
          type === 'products'
            ? 'products'
            : type === 'inventory'
              ? 'inventory'
              : type === 'customers'
                ? 'customers'
                : 'sales_orders',
        );
        await repo.update({
          filter: { id },
          values,
        });

        const dc = toDetailedChange(type, diff, row, maps);
        if (dc) result.changes.push(dc);
        if (type === 'products' && diff.duplicateIds?.length) {
          await db.getRepository('products').destroy({
            filter: { id: { $in: diff.duplicateIds } },
          });
        }
        if (type === 'inventory' && touchedInventoryIds && id != null) {
          touchedInventoryIds.add(id as number);
        }
        result.updated++;
      }
    } catch (e: any) {
      result.errors.push({ row: rowNum, message: e.message || 'Import failed' });
    }
  }

  if (type === 'inventory' && spuCodesInFile && touchedInventoryIds && spuCodesInFile.size > 0) {
    const inventoryRepo = db.getRepository('inventory');
    for (const spu of spuCodesInFile) {
      const existing = await inventoryRepo.find({
        filter: { spu_code: { $eq: spu } },
      });
      const toZero = existing
        .map((r: any) => (r?.toJSON ? r.toJSON() : r))
        .filter((r: any) => !touchedInventoryIds.has(r.id));
      if (toZero.length > 0) {
        await inventoryRepo.update({
          filter: { id: { $in: toZero.map((r: any) => r.id) } },
          values: { quantity: 0, available_qty: 0 },
        });
        result.updated += toZero.length;
      }
    }
  }

  const insights = generateInsights(type, result.changes, maps);

  const ts = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  const safeName = (ctx.file.originalname || 'import.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  const archiveFileName = `${type}_${ts}_${safeName}`;
  const archivePath = path.resolve(archiveDir, archiveFileName);
  // Ensure resolved path stays within the storage directory
  if (!archivePath.startsWith(path.resolve(storagePath))) {
    ctx.throw(400, 'Invalid file path');
  }
  fs.writeFileSync(archivePath, ctx.file.buffer);

  ctx.body = {
    ...result,
    insights,
    fileArchivePath: path.relative(process.cwd(), archivePath),
  };

  await next();
}
