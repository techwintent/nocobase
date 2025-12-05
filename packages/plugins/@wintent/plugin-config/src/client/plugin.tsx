/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import models from './models';

export class PluginConfigClient extends Plugin {
  async load() {
    this.flowEngine.registerModels(models);

    // 注入 Wintent 自定义 CSS 样式
    this.injectCustomStyles();

    // 更新 Favicon
    this.updateFavicon();
  }

  private injectCustomStyles() {
    const style = document.createElement('style');
    style.setAttribute('data-wintent-custom', 'true');
    style.setAttribute('id', 'wintent-custom-styles');
    style.textContent = `
      /* Wintent 自定义样式 */
      .ant-layout-sider-children {
        margin-inline-end: 0 !important;
      }

      /* Header 底部边框样式 - 使用更高优先级 */
      .ant-layout.ant-layout-has-sider > .ant-layout > .ant-layout-header.ant-pro-layout-header,
      .ant-layout-header.ant-pro-layout-header {
        border-block-end: 1px solid rgba(5, 5, 5, 0.06) !important;
        border-bottom: 1px solid rgba(5, 5, 5, 0.06) !important;
      }

      /* 固定菜单中图标和标题的距离，防止当切换到紧凑模式后，图标和标题之间的距离过近 */
      .ant-menu-title-content .ant-pro-base-menu-inline-item-title,
      .ant-menu-title-content .ant-pro-base-menu-horizontal-item-title {
        gap: 8px !important;
      }

      /* 修复紧凑模式下且菜单收起时，菜单的高度不够的问题 */
      .ant-pro-base-menu-vertical-collapsed .ant-pro-base-menu-vertical-menu-item {
        height: auto !important;
      }
    `;
    document.head.appendChild(style);

    console.log('[Wintent] Custom CSS styles injected successfully');
    console.log('[Wintent] Header border style applied');
  }

  private async updateFavicon() {
    try {
      // 从附件表获取 Wintent favicon
      const response = await this.app.apiClient.request({
        url: 'attachments:list',
        params: {
          filter: {
            title: 'wintent-favicon',
          },
          pageSize: 1,
        },
      });

      const faviconUrl = response?.data?.data?.[0]?.url;

      if (faviconUrl) {
        // 更新 favicon
        let faviconLink: HTMLLinkElement = document.querySelector('link[rel*="icon"]');

        if (!faviconLink) {
          faviconLink = document.createElement('link');
          faviconLink.rel = 'shortcut icon';
          document.head.appendChild(faviconLink);
        }

        faviconLink.href = faviconUrl;
        console.log('[Wintent] Favicon updated:', faviconUrl);
      } else {
        console.log('[Wintent] Wintent favicon not found in attachments');
      }
    } catch (error) {
      console.error('[Wintent] Failed to update favicon:', error);
    }
  }
}

export default PluginConfigClient;
