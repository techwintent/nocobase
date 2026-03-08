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
import { createClothingStoreTools } from './tools/clothing-store-tools';

export class PluginClothingStoreServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Register AI tools for clothing store
    try {
      console.log('[plugin-clothing-store] this.ai:', !!this.ai);
      console.log('[plugin-clothing-store] this.ai?.toolsManager:', !!this.ai?.toolsManager);
      const toolsManager = this.ai?.toolsManager;
      if (toolsManager) {
        const tools = createClothingStoreTools();
        console.log('[plugin-clothing-store] Registering', tools.length, 'AI tools:', tools.map((t) => t.definition.name));
        toolsManager.registerTools(tools);
        // Verify registration
        const registered = await toolsManager.listTools();
        console.log('[plugin-clothing-store] Total registered tools:', registered.length, registered.map((t) => `${t.definition.name}(${t.scope})`));
      } else {
        console.warn('[plugin-clothing-store] toolsManager not available, skipping AI tools registration');
      }
    } catch (e) {
      console.error('[plugin-clothing-store] AI tools registration FAILED:', e);
    }
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
