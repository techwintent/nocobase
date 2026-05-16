import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-scheduling',
  dumpRules: { group: 'scheduling' },
  uiManageable: true,
  name: 'schedule_slots',
  title: '排课槽',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属教练 user_id' },
    { name: 'student_id', type: 'bigInt', index: true, comment: 'FK → students.id' },
    {
      name: 'starts_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '开始时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'ends_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '结束时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'location',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '地点 / 馆', 'x-component': 'Input' },
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'tentative',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'tentative', label: '待定' },
          { value: 'confirmed', label: '已确认' },
          { value: 'cancelled', label: '已取消' },
        ],
      },
    },
    {
      name: 'notes',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '备注', 'x-component': 'Input.TextArea' },
    },
  ],
});
