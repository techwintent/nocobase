/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { z } from 'zod';
import { ToolsOptions } from '@nocobase/ai';
import { getOverviewStats, getProductStatusMap } from '../services/overview-service';
import { WINTENT_CONFIG } from '../config';

export function createClothingStoreTools(): ToolsOptions[] {
  return [
    // Tool 1: getBusinessOverview
    {
      scope: 'CUSTOM',
      defaultPermission: 'ALLOW',
      introduction: {
        title: '经营概览',
        about: '获取服装店经营概览数据，包括商品统计、客户统计和销售趋势',
      },
      definition: {
        name: 'getBusinessOverview',
        description:
          '获取服装店经营概览数据，包括商品统计（总数、断码、新品、滞销）、客户统计（总数、活跃、沉睡、流失）和近30天销售趋势',
        schema: z.object({}),
      },
      invoke: async (ctx, _args) => {
        try {
          const stats = await getOverviewStats(ctx.db);
          return {
            status: 'success',
            content: JSON.stringify(stats),
          };
        } catch (error) {
          return {
            status: 'error',
            content: `获取经营概览失败: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      },
    },

    // Tool 2: queryProducts
    {
      scope: 'CUSTOM',
      defaultPermission: 'ALLOW',
      introduction: {
        title: '商品查询',
        about: '查询商品列表，支持按名称、SPU编码、状态筛选',
      },
      definition: {
        name: 'queryProducts',
        description: '查询商品列表，支持按名称、SPU编码、状态筛选',
        schema: z.object({
          keyword: z.string().optional().describe('搜索关键词（名称或SPU编码）'),
          status: z
            .enum(['all', 'outOfSize', 'new', 'slow'])
            .optional()
            .default('all')
            .describe('商品状态筛选'),
          limit: z.number().int().min(1).max(50).optional().default(20).describe('返回数量'),
        }),
      },
      invoke: async (ctx, args) => {
        try {
          const keyword = args?.keyword?.trim() || '';
          const status = args?.status || 'all';
          const limit = Math.min(Math.max(args?.limit || 20, 1), 50);

          const filter: any = {};
          const conditions: any[] = [];

          // Keyword filter
          if (keyword) {
            conditions.push({
              $or: [{ name: { $includes: keyword } }, { spu_code: { $includes: keyword } }],
            });
          }

          // Status filter
          if (status !== 'all') {
            const statusMap = await getProductStatusMap(ctx.db);
            const ids = statusMap[status] || [];
            if (ids.length === 0) {
              return {
                status: 'success',
                content: JSON.stringify({ items: [], total: 0 }),
              };
            }
            conditions.push({ id: { $in: ids } });
          }

          if (conditions.length === 1) {
            Object.assign(filter, conditions[0]);
          } else if (conditions.length > 1) {
            filter.$and = conditions;
          }

          const repo = ctx.db.getRepository('products');
          const items = await repo.find({
            filter,
            fields: [
              'id',
              'name',
              'spu_code',
              'cost_price',
              'price_1',
              'total_stock',
              'total_sold',
              'status',
              'listed_at',
            ],
            limit,
          });

          return {
            status: 'success',
            content: JSON.stringify({ items, total: items.length }),
          };
        } catch (error) {
          return {
            status: 'error',
            content: `查询商品失败: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      },
    },

    // Tool 3: queryCustomers
    {
      scope: 'CUSTOM',
      defaultPermission: 'ALLOW',
      introduction: {
        title: '客户查询',
        about: '查询客户列表，支持按姓名、手机号、VIP等级、状态筛选',
      },
      definition: {
        name: 'queryCustomers',
        description: '查询客户列表，支持按姓名、手机号、VIP等级、状态筛选',
        schema: z.object({
          keyword: z.string().optional().describe('搜索关键词（姓名或手机号）'),
          status: z
            .enum(['all', 'active', 'sleeping', 'churn'])
            .optional()
            .default('all')
            .describe('客户状态'),
          limit: z.number().int().min(1).max(50).optional().default(20).describe('返回数量'),
        }),
      },
      invoke: async (ctx, args) => {
        try {
          const keyword = args?.keyword?.trim() || '';
          const status = args?.status || 'all';
          const limit = Math.min(Math.max(args?.limit || 20, 1), 50);
          const { SLEEP_DAYS, CHURN_DAYS } = WINTENT_CONFIG;

          const filter: any = {};
          const conditions: any[] = [];

          // Keyword filter
          if (keyword) {
            conditions.push({
              $or: [{ name: { $includes: keyword } }, { phone: { $includes: keyword } }],
            });
          }

          // Status filter
          if (status === 'active') {
            conditions.push({ days_since_last: { $lte: SLEEP_DAYS } });
          } else if (status === 'sleeping') {
            conditions.push({
              $and: [{ days_since_last: { $gt: SLEEP_DAYS } }, { days_since_last: { $lte: CHURN_DAYS } }],
            });
          } else if (status === 'churn') {
            conditions.push({ days_since_last: { $gt: CHURN_DAYS } });
          }

          if (conditions.length === 1) {
            Object.assign(filter, conditions[0]);
          } else if (conditions.length > 1) {
            filter.$and = conditions;
          }

          const repo = ctx.db.getRepository('customers');
          const items = await repo.find({
            filter,
            fields: [
              'id',
              'name',
              'phone',
              'vip_level',
              'total_amount',
              'visit_count',
              'last_purchase_date',
              'days_since_last',
            ],
            limit,
          });

          return {
            status: 'success',
            content: JSON.stringify({ items, total: items.length }),
          };
        } catch (error) {
          return {
            status: 'error',
            content: `查询客户失败: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      },
    },
  ];
}
