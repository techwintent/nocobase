/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Wintent 定制配置插件
 * 用于设置 Wintent 品牌的默认配置
 */
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class PluginWintentConfigServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    // 监听 system-settings 插件安装完成事件
    this.app.on('afterInstallPlugin', async (plugin) => {
      // 当系统设置插件安装完成后，立即更新为 Wintent 配置
      if (plugin.name === 'system-settings') {
        this.log.info('System settings plugin installed, applying Wintent configuration...');
        await this.applyWintentSettings();
      }
    });
  }

  async load() {}

  /**
   * 应用 Wintent 品牌设置
   */
  async applyWintentSettings() {
    try {
      const systemSettingsRepo = this.db.getRepository('systemSettings');

      // 获取现有系统设置
      const existingSettings = await systemSettingsRepo.findOne();

      if (!existingSettings) {
        this.log.warn('No system settings found, skipping Wintent configuration');
        return;
      }

      // 获取文件管理器插件
      const fileManagerPlugin = this.pm.get('file-manager') as PluginFileManagerServer;

      // 准备 Logo
      let logo = null;
      const logoPath = resolve(__dirname, './wintent-logo.png');

      // 准备 Favicon
      let favicon = null;
      const faviconPath = resolve(__dirname, './icon_square.ico');

      if (fileManagerPlugin) {
        // 上传 Logo
        try {
          logo = await fileManagerPlugin.createFileRecord({
            filePath: logoPath,
            collectionName: 'attachments',
            values: {
              title: 'wintent-logo',
              extname: '.png',
              mimetype: 'image/png',
            },
          });
          this.log.info('Wintent logo uploaded successfully');
        } catch (error) {
          this.log.warn('Wintent logo file not found, keeping existing logo');
        }

        // 上传 Favicon
        try {
          favicon = await fileManagerPlugin.createFileRecord({
            filePath: faviconPath,
            collectionName: 'attachments',
            values: {
              title: 'wintent-favicon',
              extname: '.ico',
              mimetype: 'image/x-icon',
            },
          });
          this.log.info('Wintent favicon uploaded successfully');
        } catch (error) {
          this.log.warn('Wintent favicon file not found');
        }
      }

      // 准备更新的配置
      const wintentSettings: any = {
        title: 'Wintent',
        appLang: 'zh-CN',
        enabledLanguages: ['zh-CN', 'en-US'],
      };

      // 如果成功上传了 logo，添加到配置中
      if (logo) {
        wintentSettings.logo = logo;
      }

      // 如果成功上传了 favicon，添加到配置中
      if (favicon) {
        wintentSettings.favicon = favicon;
      }

      // 更新系统设置（使用 filterByTk: 1 因为系统设置总是第一条记录）
      await systemSettingsRepo.update({
        filterByTk: 1,
        values: wintentSettings,
      });

      this.log.info('✓ Wintent configuration applied successfully');
    } catch (error) {
      this.log.error('Failed to apply Wintent configuration:', error);
    }
  }

  /**
   * 插件安装时执行
   */
  async install(options?: InstallOptions) {
    this.log.info('Installing Wintent configuration plugin...');

    // 在安装阶段，我们只记录日志
    // 实际的配置更新会在 afterInstallPlugin 事件中进行
    this.log.info('Wintent configuration plugin installed, waiting for system-settings to initialize...');
  }

  /**
   * 插件启用后执行
   * 检查并应用 Wintent 配置（包括 Logo）
   */
  async afterEnable() {
    try {
      const systemSettingsRepo = this.db.getRepository('systemSettings');
      const settings = await systemSettingsRepo.findOne({
        appends: ['logo'],
      });

      if (!settings) {
        this.log.warn('No system settings found');
        return;
      }

      // 检查 Logo 是否已经是 Wintent Logo
      const isWintentLogo = settings.logo?.title === 'wintent-logo';

      if (!isWintentLogo) {
        // 如果 Logo 不是 Wintent Logo，则应用配置
        this.log.info('Wintent Logo not found, applying configuration...');
        await this.applyWintentSettings();
      } else {
        this.log.info('Wintent configuration already applied');
      }
    } catch (error) {
      this.log.warn('Could not check system settings:', error);
    }
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginWintentConfigServer;
