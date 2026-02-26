/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Rule-based insight engine for clothing import.
 * Generates business insights from change data.
 */

import type { ImportType } from './xlsx-parser';
import type { DetailedChange, Insight } from '../../shared/types';

const INVENTORY_LOW_THRESHOLD = 5;
const PRICE_CHANGE_THRESHOLD = 0.1;
const BIG_ORDER_AMOUNT = 1000;
const TYPE_LABELS: Record<string, string> = {
  products: '商品',
  inventory: '库存',
  customers: '客户',
  sales_orders: '销售单',
};

export interface Maps {
  stores: Record<string, any>;
  products: Record<string, any>;
  skus: Record<string, any>;
  customers: Record<string, any>;
  [key: string]: Record<string, any>;
}

export function generateInsights(type: ImportType, changes: DetailedChange[], _maps?: Maps): Insight[] {
  const insights: Insight[] = [];

  if (!changes?.length) return insights;

  const inserts = changes.filter((c) => c.action === 'insert');
  const updates = changes.filter((c) => c.action === 'update');

  if (type === 'inventory') {
    for (const c of changes) {
      const qty = c.after?.quantity ?? c.after?.available_qty;
      if (typeof qty === 'number' && qty < INVENTORY_LOW_THRESHOLD && qty >= 0) {
        insights.push({
          level: 'warning',
          category: 'inventory',
          title: '库存预警',
          description: `${c.label} 当前库存仅 ${qty}，建议及时补货`,
          relatedKeys: [c.uniqueKey],
        });
      }
    }
    if (inserts.length > 0) {
      insights.push({
        level: 'info',
        category: 'inventory',
        title: '库存新增',
        description: `本次新增 ${inserts.length} 条库存记录`,
        relatedKeys: inserts.map((c) => c.uniqueKey),
      });
    }
  }

  if (type === 'products') {
    for (const c of updates) {
      if (!c.changedFields?.length || !c.before || !c.after) continue;
      const priceFields = ['price_1', 'price_2', 'price_3', 'cost_price'];
      for (const f of priceFields) {
        if (!c.changedFields.includes(f)) continue;
        const oldVal = c.before[f];
        const newVal = c.after[f];
        if (typeof oldVal === 'number' && typeof newVal === 'number' && oldVal > 0) {
          const pct = Math.abs(newVal - oldVal) / oldVal;
          if (pct >= PRICE_CHANGE_THRESHOLD) {
            insights.push({
              level: 'warning',
              category: 'price',
              title: '价格异动',
              description: `${c.label} 的 ${f} 从 ${oldVal} 变为 ${newVal}，变动幅度 ${(pct * 100).toFixed(1)}%`,
              relatedKeys: [c.uniqueKey],
            });
          }
        }
      }
    }
    if (inserts.length > 0) {
      insights.push({
        level: 'info',
        category: 'price',
        title: '商品新增',
        description: `本次新增 ${inserts.length} 个商品`,
        relatedKeys: inserts.map((c) => c.uniqueKey),
      });
    }
  }

  if (type === 'customers') {
    for (const c of updates) {
      if (!c.changedFields?.includes('status')) continue;
      const oldStatus = c.before?.status;
      const newStatus = c.after?.status;
      if (oldStatus === 'active' && (newStatus === 'inactive' || newStatus === '沉睡' || newStatus === '流失')) {
        insights.push({
          level: 'danger',
          category: 'customer',
          title: '客户流失',
          description: `${c.label} 状态从活跃变为 ${newStatus}，建议跟进挽留`,
          relatedKeys: [c.uniqueKey],
        });
      }
    }
    if (inserts.length > 0) {
      insights.push({
        level: 'info',
        category: 'customer',
        title: '客户新增',
        description: `本次新增 ${inserts.length} 位客户`,
        relatedKeys: inserts.map((c) => c.uniqueKey),
      });
    }
  }

  if (type === 'sales_orders') {
    for (const c of changes) {
      const amount = c.after?.sale_amount ?? c.after?.receivable;
      if (typeof amount === 'number' && amount >= BIG_ORDER_AMOUNT) {
        insights.push({
          level: 'info',
          category: 'sales',
          title: '大单提醒',
          description: `${c.label} 销售额 ${amount} 元`,
          relatedKeys: [c.uniqueKey],
        });
      }
    }
    if (inserts.length > 0) {
      insights.push({
        level: 'info',
        category: 'sales',
        title: '销售单新增',
        description: `本次新增 ${inserts.length} 笔销售单`,
        relatedKeys: inserts.map((c) => c.uniqueKey),
      });
    }
  }

  return insights;
}
