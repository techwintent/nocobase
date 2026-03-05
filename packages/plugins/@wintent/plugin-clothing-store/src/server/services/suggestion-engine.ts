/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * AI 建议生成引擎（规则引擎）
 * 4 种类型：restock 补货 / match 推荐 / customer 回访 / clear 促销
 * 与 tasks 2.2、business-overview-design 配置一致
 */

import type { Database } from '@nocobase/database';
import { WINTENT_CONFIG } from '../config';

const SUGGESTION_TYPES = ['restock', 'match', 'customer', 'clear'] as const;

/** Upper-bound limits for suggestion source queries */
const SUGGESTION_LIMITS = {
  LOW_STOCK: 100,
  SLOW_PRODUCTS: 50,
  SLEEPING_CUSTOMERS: 50,
  NEW_PRODUCTS: 30,
} as const;
export type SuggestionType = (typeof SUGGESTION_TYPES)[number];

export interface SuggestionRecord {
  type: SuggestionType;
  title: string;
  content: string;
  target_id: number;
  target_type: string;
  status: string;
  confidence: number;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 全量生成建议并写入 ai_suggestions（先删 pending，再写入新建议） */
export async function generateSuggestions(db: Database): Promise<{ count: number }> {
  const { STOCK_THRESHOLD, SLEEP_DAYS, CHURN_DAYS, NEW_PRODUCT_DAYS } = WINTENT_CONFIG;
  const repo = db.getRepository('ai_suggestions');
  const records: SuggestionRecord[] = [];

  // 1) 补货 restock：库存 quantity < 阈值的 inventory 对应 product
  const inventoryRepo = db.getRepository('inventory');
  const lowStock = await inventoryRepo.find({
    filter: { quantity: { $lt: STOCK_THRESHOLD } },
    limit: SUGGESTION_LIMITS.LOW_STOCK,
  });
  const productIdsRestock = new Set<number>();
  for (const inv of lowStock as any[]) {
    if (inv.product_id) productIdsRestock.add(inv.product_id);
  }
  const productsRepo = db.getRepository('products');
  for (const pid of productIdsRestock) {
    const p = await productsRepo.findOne({ filterByTk: pid, fields: ['name', 'spu_code'] });
    const name = (p as any)?.name || (p as any)?.spu_code || `#${pid}`;
    records.push({
      type: 'restock',
      title: '库存不足建议补货',
      content: `款号 ${name} 存在 SKU 库存低于 ${STOCK_THRESHOLD} 件，建议补货或调整陈列。`,
      target_id: pid,
      target_type: 'products',
      status: 'pending',
      confidence: 0.85,
    });
  }

  // 2) 促销 clear：断码/滞销款（库存 < 阈值 或 滞销）
  const outOfSizeIds = new Set<number>();
  for (const inv of lowStock as any[]) {
    if (inv.product_id) outOfSizeIds.add(inv.product_id);
  }
  const slowProducts = await productsRepo.find({
    filter: {
      $and: [{ total_stock: { $gt: 0 } }, { total_sold: { $eq: 0 } }],
    },
    limit: SUGGESTION_LIMITS.SLOW_PRODUCTS,
  });
  for (const p of slowProducts as any[]) {
    if (outOfSizeIds.has(p.id)) continue;
    outOfSizeIds.add(p.id);
  }
  for (const pid of outOfSizeIds) {
    const p = await productsRepo.findOne({ filterByTk: pid, fields: ['name', 'spu_code'] });
    const name = (p as any)?.name || (p as any)?.spu_code || `#${pid}`;
    records.push({
      type: 'clear',
      title: '断码/滞销建议促销',
      content: `款号 ${name} 断码或滞销，建议促销清仓。`,
      target_id: pid,
      target_type: 'products',
      status: 'pending',
      confidence: 0.8,
    });
  }

  // 3) 回访 customer：沉睡客户（days_since_last > 30 && <= 60）
  const customerRepo = db.getRepository('customers');
  const sleeping = await customerRepo.find({
    filter: {
      $and: [{ days_since_last: { $gt: SLEEP_DAYS } }, { days_since_last: { $lte: CHURN_DAYS } }],
    },
    limit: SUGGESTION_LIMITS.SLEEPING_CUSTOMERS,
  });
  for (const c of sleeping as any[]) {
    records.push({
      type: 'customer',
      title: '沉睡客户建议回访',
      content: `${c.name || '客户'} 已 ${c.days_since_last ?? 0} 天未消费，建议回访唤醒。`,
      target_id: c.id,
      target_type: 'customers',
      status: 'pending',
      confidence: 0.8,
    });
  }

  // 4) 推荐 match：新品（listed_at 近期）可做“上新推荐”
  const newProductSince = daysAgo(NEW_PRODUCT_DAYS);
  const newProducts = await productsRepo.find({
    filter: { listed_at: { $gte: newProductSince.toISOString().slice(0, 10) } },
    limit: SUGGESTION_LIMITS.NEW_PRODUCTS,
  });
  for (const p of newProducts as any[]) {
    const name = p.name || p.spu_code || `#${p.id}`;
    records.push({
      type: 'match',
      title: '新品可做推荐',
      content: `新品 ${name} 可向老客做上新推荐。`,
      target_id: p.id,
      target_type: 'products',
      status: 'pending',
      confidence: 0.75,
    });
  }

  // Delete all pending suggestions first, then insert fresh ones (idempotent refresh)
  await repo.destroy({ filter: { status: 'pending' } });
  for (const r of records) {
    await repo.create({ values: r });
  }

  return { count: records.length };
}
