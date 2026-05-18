import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-chat-web-storage',
  dumpRules: { group: 'chat-web' },
  uiManageable: true,
  name: 'user_memories',
  title: '用户长期记忆',
  createdBy: false,
  updatedBy: false,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属用户 user_id' },
    {
      name: 'layer',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '记忆层',
        'x-component': 'Select',
        enum: [
          { value: 'system', label: '系统层' },
          { value: 'user', label: '用户层' },
          { value: 'working', label: '工作层' },
        ],
      },
    },
    {
      name: 'category',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '类别',
        'x-component': 'Select',
        enum: [
          { value: 'profile', label: '画像' },
          { value: 'preferences', label: '偏好' },
          { value: 'business', label: '业务' },
          { value: 'rules', label: '规则' },
          { value: 'focus', label: '焦点' },
          { value: 'insights', label: '洞察' },
        ],
      },
    },
    {
      name: 'key',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '键', 'x-component': 'Input' },
    },
    {
      name: 'content',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '内容', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'source',
      type: 'string',
      defaultValue: 'segment_extract',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '来源',
        'x-component': 'Select',
        enum: [
          { value: 'system_default', label: '系统默认' },
          { value: 'segment_extract', label: '段抽取' },
          { value: 'user_explicit', label: '用户显式' },
        ],
      },
    },
    { name: 'source_segment_id', type: 'bigInt', index: true, comment: 'FK → chat_segments.id (nullable)' },
    { name: 'confidence', type: 'float', defaultValue: 0.5, comment: '0..1 置信度' },
    { name: 'version', type: 'integer', defaultValue: 1 },
    {
      name: 'archived_at',
      type: 'date',
      interface: 'datetime',
      comment: '归档时间（软删除）',
      uiSchema: { type: 'datetime', title: '归档于', 'x-component': 'DatePicker' },
    },
    // Sequelize-auto camelCase createdAt/updatedAt — see chat_sessions NOTE (I5-H6).
  ],
});
