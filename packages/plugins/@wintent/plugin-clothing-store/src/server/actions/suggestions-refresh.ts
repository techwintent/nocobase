/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * AI 建议全量刷新
 * POST wintentSuggestions:refresh
 */

import type { Context, Next } from '@nocobase/actions';
import { generateSuggestions } from '../services/suggestion-engine';

export async function wintentSuggestionsRefresh(ctx: Context, next: Next) {
  const db = ctx.db;
  if (!db) {
    return ctx.throw(500, 'Database not available');
  }
  try {
    const { count } = await generateSuggestions(db);
    ctx.body = { data: { count } };
  } catch (e: any) {
    ctx.throw(500, e?.message || 'Failed to refresh suggestions');
  }
  await next();
}
