import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-content-marketing',
  dumpRules: { group: 'content-marketing' },
  uiManageable: true,
  name: 'content_topics',
  title: '内容选题',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '标题', 'x-component': 'Input' },
    },
    {
      name: 'outline',
      type: 'text',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '大纲 / 钩子 / 角度',
        'x-component': 'Input.TextArea',
      },
    },
    { name: 'source_aspiration_id', type: 'bigInt', index: true },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'idea',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'idea', label: 'Idea' },
          { value: 'drafting', label: 'Drafting' },
          { value: 'ready', label: 'Ready to publish' },
          { value: 'published', label: 'Published' },
          { value: 'discarded', label: 'Discarded' },
        ],
      },
    },
  ],
});
