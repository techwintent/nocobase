/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Ensures clothing-store menu items exist in desktopRoutes for proper highlighting.
 * Creates page-type routes so ProLayout can match paths.
 */

import { useAPIClient } from '@nocobase/client';
import { message } from 'antd';
import React, { useEffect, useRef } from 'react';

const ROUTES_TO_ENSURE: { schemaUid: string; title: string; icon: string }[] = [
  { schemaUid: 'data-studio', title: '数据工作台', icon: 'DashboardOutlined' },
  { schemaUid: 'product-list', title: '商品列表', icon: 'AppstoreOutlined' },
  { schemaUid: 'campaign-planner', title: '运营活动策划', icon: 'BulbOutlined' },
  { schemaUid: 'restock-recommendation', title: '补货搭配推荐', icon: 'ShoppingCartOutlined' },
  { schemaUid: 'inventory-manage', title: '库存管理', icon: 'DatabaseOutlined' },
  { schemaUid: 'customers', title: '客户列表', icon: 'TeamOutlined' },
];

function findSchemaUidInRoutes(routes: any[], target: string): boolean {
  if (!routes || !Array.isArray(routes)) return false;
  for (const r of routes) {
    if (r?.schemaUid === target || r?.menuSchemaUid === target) return true;
    if (r?.children?.length && findSchemaUidInRoutes(r.children, target)) return true;
  }
  return false;
}

export function ClothingImportMenuProvider({ children }: { children: React.ReactNode }) {
  const api = useAPIClient();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    if (!window.location.pathname.startsWith('/admin')) return;

    (async () => {
      try {
        const { data } = await api.request({
          url: 'desktopRoutes:listAccessible',
          params: { tree: true, sort: 'sort' },
        });
        const routes = data?.data || [];
        const missing = ROUTES_TO_ENSURE.filter((r) => !findSchemaUidInRoutes(routes, r.schemaUid));
        if (missing.length === 0) {
          doneRef.current = true;
          return;
        }
        for (const item of missing) {
          await api.resource('desktopRoutes').create({
            values: {
              type: 'page',
              title: item.title,
              icon: item.icon,
              schemaUid: item.schemaUid,
              hideInMenu: false,
            },
          });
        }
        doneRef.current = true;
        message.info('菜单已更新，正在刷新页面…');
        setTimeout(() => window.location.reload(), 500);
      } catch (err) {
        console.warn('[ClothingStore] Failed to ensure menu routes:', err);
      }
    })();
  }, [api]);

  return <>{children}</>;
}
