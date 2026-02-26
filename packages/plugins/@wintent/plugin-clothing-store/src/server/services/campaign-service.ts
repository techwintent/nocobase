/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 运营活动策划 - 预览匹配客户数
 * 活动类型：clear 促销 / match 推荐 / customer 回访
 */

import type { Database } from '@nocobase/database';
import { WINTENT_CONFIG } from '../config';
import { getProductStatusMap } from './overview-service';

export type CampaignType = 'clear' | 'match' | 'customer';

export interface CampaignPreviewParams {
  type: CampaignType;
  productIds?: number[];
  customerSegment?: 'all' | 'active' | 'sleeping' | 'churn';
  /** 返回的客户 ID 数量上限，默认 10；活动执行页可传 500 */
  limit?: number;
}

export interface MatchedProduct {
  id: number;
  spuCode: string;
  name: string;
  categoryName: string;
  style?: string;
  season?: string;
  price: number;
  totalStock: number;
  matchReasons: string[];
}

export interface ProductCategoryGroup {
  category: string;
  products: MatchedProduct[];
}

export interface CampaignPreviewResult {
  customerCount: number;
  productCount: number;
  sampleCustomerIds: number[];
  /** 与 sampleCustomerIds 相同，最多 limit 个，供活动执行页拉取匹配客户列表 */
  customerIds?: number[];
  /** 按商品分类分组的匹配商品列表，供前端展示匹配原因 */
  productsByCategory?: ProductCategoryGroup[];
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getCampaignPreview(db: Database, params: CampaignPreviewParams): Promise<CampaignPreviewResult> {
  const { type, productIds: inputProductIds, customerSegment = 'all', limit = 10 } = params;
  const { STOCK_THRESHOLD, SLEEP_DAYS, CHURN_DAYS, NEW_PRODUCT_DAYS } = WINTENT_CONFIG;
  const customerRepo = db.getRepository('customers');
  const salesOrdersRepo = db.getRepository('sales_orders');
  const productRepo = db.getRepository('products');
  const newProductSince = daysAgo(NEW_PRODUCT_DAYS);

  let targetProductIds: number[] = [];
  if (inputProductIds?.length) {
    targetProductIds = inputProductIds;
  } else {
    const statusMap = await getProductStatusMap(db);
    if (type === 'clear') {
      targetProductIds = [...statusMap.outOfSize, ...statusMap.slow];
      targetProductIds = [...new Set(targetProductIds)];
    } else if (type === 'match') {
      targetProductIds = statusMap.new;
    }
  }

  const productCount = targetProductIds.length;

  // 商品按分类分组 + 匹配原因
  let productsByCategory: ProductCategoryGroup[] = [];
  if (productCount > 0) {
    const products = await productRepo.find({
      filter: { id: { $in: targetProductIds } },
      fields: [
        'id',
        'spu_code',
        'name',
        'category_name',
        'style',
        'season',
        'price_1',
        'total_stock',
        'total_sold',
        'listed_at',
      ],
      limit: Math.max(5000, productCount),
    });
    const groupMap = new Map<string, MatchedProduct[]>();
    for (const p of products as any[]) {
      const id = Number(p.id);
      if (!id) continue;
      const spuCode = String(p.spu_code || '');
      const name = String(p.name || p.spu_code || '');
      const categoryName = String(p.category_name || '未分类');
      const style = p.style ? String(p.style) : undefined;
      const season = p.season ? String(p.season) : undefined;
      const price = p.price_1 != null ? Number(p.price_1) || 0 : 0;
      const totalStock = p.total_stock != null ? Number(p.total_stock) || 0 : 0;
      const totalSold = p.total_sold != null ? Number(p.total_sold) || 0 : 0;
      const listedAtStr = p.listed_at ? String(p.listed_at).slice(0, 10) : '';

      const reasons: string[] = [];
      if (type === 'clear') {
        if (totalStock > 0 && totalStock < STOCK_THRESHOLD) {
          reasons.push('断码商品');
        }
        if (totalStock > 0 && totalSold === 0) {
          reasons.push('滞销商品');
        }
      } else if (type === 'match') {
        if (listedAtStr && listedAtStr >= newProductSince.toISOString().slice(0, 10)) {
          reasons.push('新品上架');
        }
      }
      if (style) {
        reasons.push(`风格:${style}`);
      }
      if (season) {
        reasons.push(`当季:${season}`);
      }

      const matched: MatchedProduct = {
        id,
        spuCode,
        name,
        categoryName,
        style,
        season,
        price,
        totalStock,
        matchReasons: reasons,
      };
      const key = categoryName || '未分类';
      const list = groupMap.get(key) || [];
      list.push(matched);
      groupMap.set(key, list);
    }
    productsByCategory = Array.from(groupMap.entries()).map(([category, products]) => ({
      category,
      products,
    }));
  }

  // 客户筛选条件
  let customerFilter: Record<string, any> = {};
  if (customerSegment === 'active') {
    customerFilter = { days_since_last: { $lte: SLEEP_DAYS } };
  } else if (customerSegment === 'sleeping') {
    customerFilter = {
      $and: [{ days_since_last: { $gt: SLEEP_DAYS } }, { days_since_last: { $lte: CHURN_DAYS } }],
    };
  } else if (customerSegment === 'churn') {
    customerFilter = { days_since_last: { $gt: CHURN_DAYS } };
  }

  if (type === 'customer') {
    // 回访活动：直接按客户段统计
    const list = await customerRepo.find({
      filter: Object.keys(customerFilter).length ? customerFilter : undefined,
      fields: ['id'],
      limit: Math.max(500, limit),
    });
    const ids = (list as any[]).map((c) => c.id).filter(Boolean);
    const slice = ids.slice(0, limit);
    return {
      customerCount: ids.length,
      productCount: 0,
      sampleCustomerIds: slice,
      customerIds: slice,
      productsByCategory: [],
    };
  }

  // 有目标商品时：取近 90 天有订单的客户，再按 customerSegment 过滤
  const since = daysAgo(90);
  const orders = await salesOrdersRepo.find({
    filter: { order_date: { $gte: since.toISOString().slice(0, 10) } },
    fields: ['customer_id'],
    limit: 5000,
  });
  const customerIdsFromOrders = new Set((orders as any[]).map((o) => o.customer_id).filter(Boolean));
  if (customerIdsFromOrders.size === 0) {
    const list = await customerRepo.find({
      filter: Object.keys(customerFilter).length ? customerFilter : undefined,
      fields: ['id'],
      limit: Math.max(500, limit),
    });
    const ids = (list as any[]).map((c) => c.id).filter(Boolean);
    const slice = ids.slice(0, limit);
    return {
      customerCount: ids.length,
      productCount,
      sampleCustomerIds: slice,
      customerIds: slice,
      productsByCategory,
    };
  }

  const allCandidateIds = Array.from(customerIdsFromOrders);
  let filteredIds = allCandidateIds;
  if (Object.keys(customerFilter).length) {
    const customers = await customerRepo.find({
      filter: {
        $and: [{ id: { $in: allCandidateIds } }, customerFilter],
      },
      fields: ['id'],
      limit: Math.max(1000, limit),
    });
    filteredIds = (customers as any[]).map((c) => c.id).filter(Boolean);
  }

  const slice = filteredIds.slice(0, limit);
  return {
    customerCount: filteredIds.length,
    productCount,
    sampleCustomerIds: slice,
    customerIds: slice,
    productsByCategory,
  };
}
