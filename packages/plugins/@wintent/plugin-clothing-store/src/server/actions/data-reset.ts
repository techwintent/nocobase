/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';

interface ResetTableResult {
  name: string;
  deleted: number;
  ok: boolean;
  error?: string;
}

export async function wintentDataReset(ctx: Context, next: Next) {
  const db = ctx.db;
  if (!db) {
    return ctx.throw(500, 'Database not available');
  }

  const tableOrder: string[] = [
    'ai_suggestions',
    'matches',
    'sales_items',
    'inventory',
    'sales_orders',
    'customers',
    'skus',
    'products',
    'employees',
    'vip_levels',
    'categories',
    'brands',
    'suppliers',
    'stores',
  ];

  const results: ResetTableResult[] = [];

  for (const name of tableOrder) {
    try {
      const repo = db.getRepository(name);
      const all = await repo.find();
      const ids = all
        .map((r: any) => (r?.toJSON ? r.toJSON() : r))
        .map((r: any) => r.id)
        .filter((id: any) => id != null);
      if (ids.length > 0) {
        await repo.destroy({
          filter: {
            id: {
              $in: ids,
            },
          },
        });
      }
      results.push({ name, deleted: ids.length, ok: true });
    } catch (e: any) {
      results.push({
        name,
        deleted: 0,
        ok: false,
        error: e?.message || String(e),
      });
    }
  }

  const hasError = results.some((r) => !r.ok);
  ctx.status = 200;
  ctx.body = {
    ok: !hasError,
    tables: results,
  };

  await next();
}
