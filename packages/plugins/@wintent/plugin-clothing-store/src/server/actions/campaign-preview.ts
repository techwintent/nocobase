/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 运营活动预览 API
 * POST wintentCampaigns:preview
 */

import type { Context, Next } from '@nocobase/actions';
import { getCampaignPreview, type CampaignPreviewParams } from '../services/campaign-service';

export async function wintentCampaignsPreview(ctx: Context, next: Next) {
  const db = ctx.db;
  if (!db) {
    return ctx.throw(500, 'Database not available');
  }
  const body = (ctx.request.body || ctx.action?.params?.values || {}) as CampaignPreviewParams;
  const params: CampaignPreviewParams = {
    type: body.type ?? 'clear',
    productIds: body.productIds,
    customerSegment: body.customerSegment ?? 'all',
    limit: Math.min(body.limit ?? 10, 1000),
  };
  if (!['clear', 'match', 'customer'].includes(params.type)) {
    return ctx.throw(400, 'Invalid campaign type');
  }
  try {
    const result = await getCampaignPreview(db, params);
    ctx.body = result;
  } catch (e: any) {
    ctx.throw(500, e?.message || 'Failed to get campaign preview');
  }
  await next();
}
