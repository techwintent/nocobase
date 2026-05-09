import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-scheduling',
  dumpRules: { group: 'scheduling' },
  uiManageable: true,
  name: 'schedule_conflicts',
  title: '撞课记录',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属教练 user_id' },
    { name: 'slot_id_1', type: 'bigInt', index: true, comment: 'FK → schedule_slots.id (the candidate slot)' },
    { name: 'slot_id_2', type: 'bigInt', index: true, comment: 'FK → schedule_slots.id (the existing slot it conflicts with)' },
    {
      name: 'detected_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '检测时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'resolved_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '解决时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'resolution_action',
      type: 'text',
      interface: 'textarea',
      comment: '用户处理动作 (free-text, e.g. "改 slot_2 时间到 14:00" / "通知 student 取消")',
      uiSchema: { type: 'string', title: '解决动作', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'overlap_minutes',
      type: 'integer',
      interface: 'integer',
      comment: '重叠时长（分钟），便于排序优先级',
      uiSchema: {
        type: 'number',
        title: '重叠分钟数',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0 },
      },
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
