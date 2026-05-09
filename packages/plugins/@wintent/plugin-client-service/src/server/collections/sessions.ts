import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-client-service',
  dumpRules: { group: 'client-service' },
  uiManageable: true,
  name: 'sessions',
  title: '训练课',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属教练 user_id' },
    { name: 'student_id', type: 'bigInt', index: true, comment: 'FK → students.id' },
    {
      name: 'session_date',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '训练日期', 'x-component': 'DatePicker' },
    },
    {
      name: 'training_focus',
      type: 'text',
      interface: 'textarea',
      comment: '部位 / 主题描述（free-text，e.g. "胸、背、体能"）。Excel 形态太自由，不用 enum',
      uiSchema: { type: 'string', title: '训练部位 / 主题', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'duration_minutes',
      type: 'integer',
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '时长（分钟）',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0 },
      },
    },
    {
      name: 'session_summary',
      type: 'text',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '本节小结（AI 生成或手填）',
        'x-component': 'Input.TextArea',
      },
    },
    {
      name: 'row_indices_in_excel',
      type: 'json',
      interface: 'json',
      comment: 'Lineage: 原 Excel 中此 session 对应的 row 索引数组（便于 re-import 与 debug）',
      uiSchema: { type: 'object', title: '原 Excel row 索引', 'x-component': 'Input.JSON' },
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
