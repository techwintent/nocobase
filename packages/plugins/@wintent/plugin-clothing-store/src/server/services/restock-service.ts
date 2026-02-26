/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 补货搭配推荐 - 基于库存与 matches 表
 */

import type { Database } from '@nocobase/database';
import { WINTENT_CONFIG } from '../config';

export interface MatchItem {
  matchProductId: number;
  matchProductName: string;
  matchRate: number;
  suggestedQty: number;
}

export interface RestockItem {
  productId: number;
  spuCode: string;
  productName: string;
  currentStock: number;
  suggestedQty: number;
  skuDetails: {
    id: number;
    storeName?: string;
    color?: string;
    size?: string;
    quantity: number;
    suggestedQty: number;
  }[];
  matchProducts: MatchItem[];
}

export async function getRestockRecommendations(
  db: Database,
  options?: { productId?: number; limit?: number },
): Promise<RestockItem[]> {
  const { productId: singleProductId, limit = 50 } = options ?? {};
  const { STOCK_THRESHOLD } = WINTENT_CONFIG;
  const productRepo = db.getRepository('products');
  const inventoryRepo = db.getRepository('inventory');
  const matchesRepo = db.getRepository('matches');

  let productIds: number[] = [];
  if (singleProductId) {
    productIds = [singleProductId];
  } else {
    const lowStock = await inventoryRepo.find({
      filter: { quantity: { $lt: STOCK_THRESHOLD } },
      fields: ['product_id'],
      limit: 200,
    });
    const set = new Set((lowStock as any[]).map((r) => r.product_id).filter(Boolean));
    productIds = [...set];
  }

  if (productIds.length === 0) {
    return [];
  }

  const result: RestockItem[] = [];
  for (const pid of productIds.slice(0, limit)) {
    const product = (await productRepo.findOne({
      filterByTk: pid,
      fields: ['id', 'spu_code', 'name', 'total_stock'],
    })) as any;
    if (!product) continue;

    const invRows = await inventoryRepo.find({
      filter: { product_id: pid },
      fields: ['id', 'store_name', 'color', 'size', 'quantity'],
    });
    const quantities = (invRows as any[]).map((r) => Number(r.quantity) || 0);
    const currentStock = quantities.reduce((sum, q) => sum + q, 0);
    const minQty = quantities.length ? Math.min(...quantities) : 0;
    const baseSuggested = Math.max(0, STOCK_THRESHOLD - minQty) || STOCK_THRESHOLD;

    const skuDetails =
      (invRows as any[]).map((r) => {
        const qty = Number(r.quantity) || 0;
        const skuSuggested = Math.max(0, STOCK_THRESHOLD - qty);
        return {
          id: r.id as number,
          storeName: r.store_name as string | undefined,
          color: r.color as string | undefined,
          size: r.size as string | undefined,
          quantity: qty,
          suggestedQty: skuSuggested,
        };
      }) ?? [];

    const suggestedQty =
      skuDetails.length > 0 ? skuDetails.reduce((sum, s) => sum + (s.suggestedQty || 0), 0) : baseSuggested;

    const matchProducts: MatchItem[] = [];
    try {
      const matches = await matchesRepo.find({
        filter: { main_product_id: pid, scenario: 'restock' },
        sort: ['-match_rate'],
        limit: 5,
      });
      for (const m of matches as any[]) {
        const mp = (await productRepo.findOne({
          filterByTk: m.match_product_id,
          fields: ['name', 'spu_code'],
        })) as any;
        matchProducts.push({
          matchProductId: m.match_product_id,
          matchProductName: mp?.name || mp?.spu_code || `#${m.match_product_id}`,
          matchRate: Number(m.match_rate) || 0,
          suggestedQty: Math.ceil((suggestedQty || 1) * 0.5),
        });
      }
    } catch {
      // matches 表可能不存在或无数据
    }

    result.push({
      productId: product.id,
      spuCode: product.spu_code || '',
      productName: product.name || product.spu_code || '',
      currentStock,
      suggestedQty: suggestedQty || STOCK_THRESHOLD,
      skuDetails,
      matchProducts,
    });
  }

  return result;
}
