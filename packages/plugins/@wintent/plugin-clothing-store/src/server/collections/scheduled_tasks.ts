/**
 * Scheduled Tasks — Cron job definitions for business automation
 *
 * Stores task metadata created via OpenClaw's `create_scheduled_task` tool.
 * Execution is handled by chat-web's cron runner which reads from this collection.
 *
 * Architecture:
 *   - OpenClaw wintent extension: CRUD tools (create/list/update/delete)
 *   - chat-web cron runner: reads enabled tasks → executes on schedule
 *   - OpenClaw CronService: handles general user scheduled tasks (separate system)
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-clothing-store',
  dumpRules: { group: 'clothing-store' },
  uiManageable: true,
  name: 'scheduled_tasks',
  title: '定时任务',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '任务名称', 'x-component': 'Input', required: true },
    },
    {
      name: 'description',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '任务描述', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'cronExpression',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Cron 表达式', 'x-component': 'Input', required: true },
    },
    {
      name: 'toolName',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '执行工具', 'x-component': 'Input', required: true },
    },
    {
      name: 'toolArgs',
      type: 'text',
      defaultValue: '{}',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '工具参数 (JSON)', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'enabled',
      type: 'boolean',
      defaultValue: true,
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: '启用', 'x-component': 'Checkbox' },
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'active',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'active', label: '活跃' },
          { value: 'paused', label: '暂停' },
          { value: 'error', label: '异常' },
        ],
      },
    },
    {
      name: 'lastRunAt',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '上次执行', 'x-component': 'DatePicker', 'x-component-props': { showTime: true } },
    },
    {
      name: 'nextRunAt',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '下次执行', 'x-component': 'DatePicker', 'x-component-props': { showTime: true } },
    },
  ],
});
