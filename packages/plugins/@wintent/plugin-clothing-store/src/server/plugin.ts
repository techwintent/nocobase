/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { clothingImportUpload } from './actions/import-upload';
import { wintentOverviewStats } from './actions/overview-stats';
import { wintentOverviewProductStatusMap } from './actions/overview-product-status-map';
import { wintentSuggestionsRefresh } from './actions/suggestions-refresh';
import { wintentCampaignsPreview } from './actions/campaign-preview';
import { wintentRestockRecommendations } from './actions/restock-recommendations';
import { wintentScriptGenerate } from './actions/script-generate';
import { wintentDataReset } from './actions/data-reset';
import { clothingImportUploadMiddleware } from './middleware/upload';

export class PluginClothingStoreServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.use(clothingImportUploadMiddleware);
      dataSource.resourceManager.define({
        name: 'clothingImport',
        only: ['upload'],
        actions: {
          upload: clothingImportUpload,
        },
      });
      dataSource.resourceManager.define({
        name: 'wintentOverview',
        only: ['stats', 'productStatusMap'],
        actions: {
          stats: wintentOverviewStats,
          productStatusMap: wintentOverviewProductStatusMap,
        },
      });
      dataSource.resourceManager.define({
        name: 'wintentSuggestions',
        only: ['refresh'],
        actions: { refresh: wintentSuggestionsRefresh },
      });
      dataSource.resourceManager.define({
        name: 'wintentData',
        only: ['reset'],
        actions: { reset: wintentDataReset },
      });
      dataSource.acl.allow('clothingImport', 'upload', 'loggedIn');
      dataSource.acl.allow('wintentOverview', 'stats', 'loggedIn');
      dataSource.acl.allow('wintentOverview', 'productStatusMap', 'loggedIn');
      dataSource.acl.allow('wintentSuggestions', 'refresh', 'loggedIn');
      dataSource.acl.allow('wintentData', 'reset', 'loggedIn');
      dataSource.resourceManager.define({
        name: 'wintentCampaigns',
        only: ['preview'],
        actions: { preview: wintentCampaignsPreview },
      });
      dataSource.resourceManager.define({
        name: 'wintentRestock',
        only: ['recommendations'],
        actions: { recommendations: wintentRestockRecommendations },
      });
      dataSource.acl.allow('wintentCampaigns', 'preview', 'loggedIn');
      dataSource.acl.allow('wintentRestock', 'recommendations', 'loggedIn');
      dataSource.resourceManager.define({
        name: 'wintentScript',
        only: ['generate'],
        actions: { generate: wintentScriptGenerate },
      });
      dataSource.acl.allow('wintentScript', 'generate', 'loggedIn');
      dataSource.acl.allow('ai_suggestions', 'list', 'loggedIn');
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginClothingStoreServer;
