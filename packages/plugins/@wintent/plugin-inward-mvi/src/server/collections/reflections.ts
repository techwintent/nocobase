import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-inward-mvi',
  dumpRules: { group: 'inward-mvi' },
  uiManageable: true,
  name: 'reflections',
  title: '反思记录',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true },
    {
      name: 'trigger_source',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '触发来源',
        'x-component': 'Select',
        enum: [
          { value: 'post-session', label: '课后' },
          { value: 'weekly-review', label: '周复盘' },
          { value: 'ad-hoc', label: '随机' },
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
      name: 'linked_entity_type',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '关联类型', 'x-component': 'Input' },
    },
    { name: 'linked_entity_id', type: 'bigInt' },
  ],
});
