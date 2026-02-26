# 数据模型 v0.1 建表验证日志

- **执行时间**: 2026-02-25T03:20:38.352Z
- **NocoBase URL**: http://localhost:13000
- **建表结果**: 创建 14 / 跳过 0 / 失败 0
- **验证结果**: ✅ 通过（表均存在，实际字段数 ≥ 预期；NocoBase 会添加部分系统字段）

## 建表明细

| 表名 | 标题 | 操作 | 说明 |
|------|------|------|------|
| stores | - | 创建 | - |
| suppliers | - | 创建 | - |
| brands | - | 创建 | - |
| categories | - | 创建 | - |
| employees | - | 创建 | - |
| vip_levels | - | 创建 | - |
| products | - | 创建 | - |
| skus | - | 创建 | - |
| inventory | - | 创建 | - |
| customers | - | 创建 | - |
| sales_orders | - | 创建 | - |
| sales_items | - | 创建 | - |
| matches | - | 创建 | - |
| ai_suggestions | - | 创建 | - |

## 验证明细

| 表名 | 标题 | 预期字段数 | 实际字段数 | 状态 |
|------|------|------------|------------|------|
| stores | 门店 | 20 | 22 | ✅ |
| suppliers | 供应商 | 13 | 13 | ✅ |
| brands | 品牌 | 10 | 10 | ✅ |
| categories | 类别 | 12 | 12 | ✅ |
| employees | 员工 | 11 | 11 | ✅ |
| vip_levels | VIP等级 | 12 | 12 | ✅ |
| products | 商品 | 44 | 46 | ✅ |
| skus | SKU | 21 | 21 | ✅ |
| inventory | 库存 | 20 | 20 | ✅ |
| customers | 客户 | 42 | 44 | ✅ |
| sales_orders | 销售单 | 42 | 44 | ✅ |
| sales_items | 销售明细 | 21 | 21 | ✅ |
| matches | 搭配 | 8 | 13 | ✅ |
| ai_suggestions | AI建议 | 9 | 14 | ✅ |
