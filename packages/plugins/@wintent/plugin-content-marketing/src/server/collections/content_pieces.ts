import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-content-marketing',
  dumpRules: { group: 'content-marketing' },
  uiManageable: true,
  name: 'content_pieces',
  title: '内容作品',
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
      name: 'body',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '正文', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'channel',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '渠道',
        'x-component': 'Select',
        enum: [
          { value: 'xiaohongshu', label: '小红书' },
          { value: 'douyin', label: '抖音' },
          { value: 'weixin', label: '微信公众号 / 朋友圈' },
          { value: 'blog', label: 'Blog / 长文' },
          { value: 'video', label: '视频号 / Bilibili' },
          { value: 'other', label: '其他' },
        ],
      },
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'draft',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'draft', label: 'Draft' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' },
        ],
      },
    },
    { name: 'topic_id', type: 'bigInt', index: true },
    {
      name: 'published_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '发布时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'created_at',
      type: 'date',
      interface: 'createdAt',
      uiSchema: { type: 'datetime', title: '创建时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'updated_at',
      type: 'date',
      interface: 'updatedAt',
      uiSchema: { type: 'datetime', title: '更新时间', 'x-component': 'DatePicker' },
    },
  ],
});
