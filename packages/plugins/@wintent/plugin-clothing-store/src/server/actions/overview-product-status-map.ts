/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 商品状态 ID 映射 API（库存模块商品列表打标与筛选）
 * GET wintentOverview:productStatusMap
 */

import type { Context, Next } from '@nocobase/actions';
import { getProductStatusMap } from '../services/overview-service';

export async function wintentOverviewProductStatusMap(ctx: Context, next: Next) {
  const db = ctx.db;
  if (!db) {
    return ctx.throw(500, 'Database not available');
  }
  try {
    const map = await getProductStatusMap(db);
    ctx.body = map;
  } catch (e: any) {
    ctx.throw(500, e?.message || 'Failed to get product status map');
  }
  await next();
}
