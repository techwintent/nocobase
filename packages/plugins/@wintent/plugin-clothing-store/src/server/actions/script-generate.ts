/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 话术生成 API
 * POST wintentScript:generate
 */

import type { Context, Next } from '@nocobase/actions';
import { generateScript, type ScriptGenerateParams } from '../services/script-generator';

export async function wintentScriptGenerate(ctx: Context, next: Next) {
  const db = ctx.db;
  if (!db) {
    return ctx.throw(500, 'Database not available');
  }
  const body = (ctx.request.body || ctx.action?.params?.values || {}) as ScriptGenerateParams;
  const customerId = body.customerId != null ? Number(body.customerId) : undefined;
  if (customerId == null || Number.isNaN(customerId)) {
    return ctx.throw(400, 'customerId is required');
  }
  const campaignType = ['clear', 'match', 'customer'].includes(body.campaignType) ? body.campaignType : 'customer';
  try {
    const result = await generateScript(db, {
      customerId,
      campaignType,
      productId: body.productId != null ? Number(body.productId) : undefined,
      productName: body.productName,
    });
    ctx.body = {
      analysis: result.analysis,
      suggestions: result.suggestions,
      script: result.script,
    };
  } catch (e: any) {
    ctx.throw(500, e?.message || 'Failed to generate script');
  }
  await next();
}
