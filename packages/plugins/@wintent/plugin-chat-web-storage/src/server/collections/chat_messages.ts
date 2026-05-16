import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-chat-web-storage',
  dumpRules: { group: 'chat-web' },
  uiManageable: true,
  name: 'chat_messages',
  title: '聊天消息',
  createdBy: false,
  updatedBy: false,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'session_id', type: 'bigInt', index: true, comment: 'FK → chat_sessions.id' },
    {
      name: 'role',
      type: 'string',
      defaultValue: 'user',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '角色',
        'x-component': 'Select',
        enum: [
          { value: 'user', label: '用户' },
          { value: 'assistant', label: '助手' },
          { value: 'system', label: '系统' },
          { value: 'tool', label: '工具' },
        ],
      },
    },
    {
      name: 'content',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '内容', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'tool_calls',
      type: 'jsonb',
      interface: 'json',
      comment: 'OpenAI function-calling tool_calls payload (assistant role)',
    },
    { name: 'segment_id', type: 'bigInt', index: true, comment: 'FK → chat_segments.id (nullable)' },
    { name: 'sequence_in_segment', type: 'integer', comment: 'order within segment' },
    {
      name: 'created_at',
      type: 'date',
      interface: 'createdAt',
      uiSchema: { type: 'datetime', title: '创建时间', 'x-component': 'DatePicker' },
    },
  ],
});
