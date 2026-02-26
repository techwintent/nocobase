/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 经营概览统计 API
 * GET wintentOverview:stats
 */

import type { Context, Next } from '@nocobase/actions';
import { getOverviewStats } from '../services/overview-service';

export async function wintentOverviewStats(ctx: Context, next: Next) {
  const db = ctx.db;
  if (!db) {
    return ctx.throw(500, 'Database not available');
  }
  try {
    const stats = await getOverviewStats(db);
    ctx.body = stats;
  } catch (e: any) {
    ctx.throw(500, e?.message || 'Failed to get overview stats');
  }
  await next();
}
