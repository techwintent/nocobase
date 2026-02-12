/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginClothingStoreServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // TODO: Load collections from collections/ directory
    // TODO: Register AI engine hooks
    // TODO: Register custom actions
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginClothingStoreServer;
