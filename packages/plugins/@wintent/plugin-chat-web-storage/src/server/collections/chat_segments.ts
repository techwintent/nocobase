import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-chat-web-storage',
  dumpRules: { group: 'chat-web' },
  uiManageable: true,
  name: 'chat_segments',
  title: '聊天分段',
  createdBy: false,
  updatedBy: false,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'session_id', type: 'bigInt', index: true, comment: 'FK → chat_sessions.id' },
    { name: 'user_id', type: 'bigInt', index: true, comment: '冗余便于 query' },
    { name: 'segment_number', type: 'integer', comment: '段序号 (1, 2, 3, ...)' },
    { name: 'message_count', type: 'integer', defaultValue: 0 },
    { name: 'round_count', type: 'integer', defaultValue: 0 },
    {
      name: 'summary',
      type: 'text',
      interface: 'textarea',
      comment: 'AI 抽取的段总结（memory_extracted=true 后填充）',
    },
    { name: 'memory_extracted', type: 'boolean', defaultValue: false, comment: '是否已抽取到记忆' },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'open',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'open', label: '进行中' },
          { value: 'closed', label: '已结束' },
        ],
      },
    },
    {
      name: 'opened_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '开始时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'closed_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '结束时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'created_at',
      type: 'date',
      interface: 'createdAt',
      uiSchema: { type: 'datetime', title: '创建时间', 'x-component': 'DatePicker' },
    },
  ],
});
