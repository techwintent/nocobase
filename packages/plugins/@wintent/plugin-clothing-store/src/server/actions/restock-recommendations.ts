/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 补货搭配推荐 API
 * GET wintentRestock:recommendations?productId=xxx
 */

import type { Context, Next } from '@nocobase/actions';
import { getRestockRecommendations } from '../services/restock-service';

export async function wintentRestockRecommendations(ctx: Context, next: Next) {
  const db = ctx.db;
  if (!db) {
    return ctx.throw(500, 'Database not available');
  }
  const productId = ctx.action?.params?.productId ?? ctx.request.query?.productId;
  const id = productId != null ? Number(productId) : undefined;
  try {
    const items = await getRestockRecommendations(db, {
      productId: id ? (Number.isNaN(id) ? undefined : id) : undefined,
      limit: 50,
    });
    ctx.body = { items };
  } catch (e: any) {
    ctx.throw(500, e?.message || 'Failed to get restock recommendations');
  }
  await next();
}
