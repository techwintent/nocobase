import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-client-service',
  dumpRules: { group: 'client-service' },
  uiManageable: true,
  name: 'students',
  title: '学员',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属教练 user_id' },
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '姓名 / 化名', 'x-component': 'Input' },
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
          { value: 'active', label: '常练' },
          { value: 'inactive', label: '间歇' },
          { value: 'lapsed', label: '已流失' },
        ],
      },
    },
    {
      name: 'first_session_date',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '首次训练', 'x-component': 'DatePicker' },
    },
    {
      name: 'last_session_date',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '最近训练', 'x-component': 'DatePicker' },
    },
    {
      name: 'goal',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '训练目标', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'notes',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '备注（伤病史 / 特点等）', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'raw_excel_sheet_name',
      type: 'string',
      interface: 'input',
      comment: 'Lineage: 原 Excel 中此学员对应的 sheet 名（便于 re-import）',
      uiSchema: { type: 'string', title: '原 Excel sheet 名', 'x-component': 'Input' },
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
