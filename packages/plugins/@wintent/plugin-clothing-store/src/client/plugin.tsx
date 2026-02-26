/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { DataStudioPage } from './pages/DataStudioPage';
import { ProductListPage } from './pages/ProductListPage';
import { CampaignPlannerPage } from './pages/CampaignPlannerPage';
import { RestockRecommendationPage } from './pages/RestockRecommendationPage';
import { CustomerListPage } from './pages/CustomerListPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { InventoryManagePage } from './pages/InventoryManagePage';
import { ClothingImportMenuProvider } from './ClothingImportMenuProvider';

export class PluginClothingStoreClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.use(ClothingImportMenuProvider);

    this.router.add('admin.data-studio', {
      path: '/admin/data-studio',
      Component: DataStudioPage,
    });
    this.router.add('admin.product-list', {
      path: '/admin/product-list',
      Component: ProductListPage,
    });
    this.router.add('admin.campaign-planner', {
      path: '/admin/campaign-planner',
      Component: CampaignPlannerPage,
    });
    this.router.add('admin.restock-recommendation', {
      path: '/admin/restock-recommendation',
      Component: RestockRecommendationPage,
    });
    this.router.add('admin.inventory-manage', {
      path: '/admin/inventory-manage',
      Component: InventoryManagePage,
    });
    this.router.add('admin.customers', {
      path: '/admin/customers',
      Component: CustomerListPage,
    });
    this.router.add('admin.customer-detail', {
      path: '/admin/customer-detail',
      Component: CustomerDetailPage,
    });
  }
}

export default PluginClothingStoreClient;
