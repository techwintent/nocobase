# Clothing Store Collections

本目录用于存储服装店业务相关的 NocoBase collection 定义。

## 表结构

按照 `docs/clothing-store/design/data-model-v0.1.md` 设计，共 14 张表：

### 核心业务表
- `stores.ts` - 门店表
- `products.ts` - 商品表（SPU）
- `skus.ts` - SKU表
- `inventory.ts` - 库存表
- `customers.ts` - 客户表
- `sales_orders.ts` - 销售单表（单头）
- `sales_items.ts` - 销售单明细（单身）

### 辅助表
- `suppliers.ts` - 供应商表
- `categories.ts` - 类别表
- `brands.ts` - 品牌表
- `employees.ts` - 员工表
- `vip_levels.ts` - VIP等级表

### AI 扩展表
- `matches.ts` - 搭配表
- `ai_suggestions.ts` - AI建议记录表

## Phase 1 任务

在 Phase 1 阶段，需要将 `docs/clothing-store/scripts/collections.json` 中的表定义转换为 TypeScript collection 文件。
