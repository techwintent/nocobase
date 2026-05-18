import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-chat-web-storage',
  dumpRules: { group: 'chat-web' },
  uiManageable: true,
  name: 'user_action_stats',
  title: '用户操作频次',
  createdBy: false,
  updatedBy: false,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属用户 user_id' },
    {
      name: 'action_id',
      type: 'string',
      index: true,
      interface: 'input',
      comment: 'quick-actions slot identifier',
      uiSchema: { type: 'string', title: '操作 ID', 'x-component': 'Input' },
    },
    {
      name: 'action_label',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '操作标签', 'x-component': 'Input' },
    },
    {
      name: 'action_prompt',
      type: 'text',
      interface: 'textarea',
      comment: '触发该 action 时下发给 chat 的 prompt 模板',
      uiSchema: { type: 'string', title: 'Prompt', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'action_icon',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '图标', 'x-component': 'Input' },
    },
    {
      name: 'count',
      type: 'integer',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '次数', 'x-component': 'InputNumber' },
    },
    {
      name: 'last_used_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '最近触发时间', 'x-component': 'DatePicker' },
    },
    // Sequelize-auto camelCase createdAt/updatedAt — see chat_sessions NOTE (I5-H6).
  ],
});
