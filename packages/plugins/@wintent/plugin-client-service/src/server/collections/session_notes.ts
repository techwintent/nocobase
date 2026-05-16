import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-client-service',
  dumpRules: { group: 'client-service' },
  uiManageable: true,
  name: 'session_notes',
  title: '训练动作记录',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属教练 user_id（冗余便于 query）' },
    { name: 'session_id', type: 'bigInt', index: true, comment: 'FK → sessions.id' },
    {
      name: 'sort_order',
      type: 'integer',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '动作顺序',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0 },
      },
    },
    {
      name: 'exercise_name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '动作名（如 "杠铃卧推"）', 'x-component': 'Input' },
    },
    {
      name: 'weights_kg',
      type: 'json',
      interface: 'json',
      comment: '负重序列 (kg)，e.g. [40, 40, 40, 40]。Excel 中常为中文逗号分隔字符串，导入时拆分',
      uiSchema: { type: 'object', title: '负重序列 (kg)', 'x-component': 'Input.JSON' },
    },
    {
      name: 'reps',
      type: 'json',
      interface: 'json',
      comment: '次数序列，e.g. [10, 12, 11, 11]',
      uiSchema: { type: 'object', title: '次数序列', 'x-component': 'Input.JSON' },
    },
    {
      name: 'rpe',
      type: 'integer',
      interface: 'integer',
      comment: 'RPE 1-10 (Rate of Perceived Exertion)，可选；当前 Excel 不含，nullable',
      uiSchema: {
        type: 'number',
        title: 'RPE 1-10',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1, max: 10 },
      },
    },
    {
      name: 'remark',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '动作备注', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'raw_excel_row',
      type: 'json',
      interface: 'json',
      comment: 'Lineage: 原 Excel 中此条 note 对应的 row（cell array）',
      uiSchema: { type: 'object', title: '原 Excel row', 'x-component': 'Input.JSON' },
    },
  ],
});
