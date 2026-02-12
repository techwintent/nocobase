# 设计文档

本目录包含 Wintent 服装店 AI 决策助手的完整设计文档。

## 文件列表

- [`architecture.md`](architecture.md) - 系统架构设计（待创建，从 design.md 提取）
- [`data-model-v0.1.md`](data-model-v0.1.md) - 数据模型 v0.1（14 表）
- [`ui-design.md`](ui-design.md) - 界面设计（待创建，从 design.md 提取）
- [`ai-engine.md`](ai-engine.md) - AI 引擎设计（待创建，从 design.md 提取）
- [`pages.md`](pages.md) - 页面菜单结构
- [`competitor-analysis/`](competitor-analysis/) - 竞品分析

## 设计概览

### 系统架构

采用 **"数据层 + AI 决策层 + 极简界面"** 三层架构：

- **数据层**: 简化版进销存，保证数据质量
- **AI 决策层**: 智能分析引擎，生成业务建议
- **界面层**: 主动推送，一步到位

### 数据模型

基于南瓜导出的商陆花/笑铺日记真实表头设计：

**核心业务表（7张）**:
- `stores` - 门店表
- `products` - 商品表（款号/SPU维度）
- `skus` - SKU表（颜色+尺码维度）
- `inventory` - 库存表（门店+SKU维度）
- `customers` - 客户表
- `sales_orders` - 销售单表（单头）
- `sales_items` - 销售单明细（单身）

**辅助表（5张）**:
- `suppliers`, `categories`, `brands`, `employees`, `vip_levels`

**AI 扩展表（2张）**:
- `matches` - 搭配表
- `ai_suggestions` - AI建议记录表

### 界面架构

移动端 3 栏导航：

```
┌─────────────┬─────────────┬─────────────┐
│   📦 库存    │  🤖 AI中心   │   👥 客户    │
└─────────────┴─────────────┴─────────────┘
```

### AI 引擎

- **规则引擎 + LLM 混合架构**
- **4种建议类型**: 促销、推荐、回访、补货
- **触发机制**: 定时任务 + 数据变更事件

### 技术选型

- **NocoBase** - 开源低代码平台
- **PostgreSQL** - 数据库
- **React** - 前端框架
- **Ollama** - 本地 LLM（可选）
- **Docker** - 容器化部署

## 设计原则

1. **宁可冗余，不可重构** - 字段设计宽松
2. **预留扩展字段** - 每表预留 `ext_json`
3. **软删除** - 所有表都有 `deleted_at`
4. **审计字段** - 统一 `created_at`, `updated_at`, `created_by`, `updated_by`
5. **多门店支持** - 所有业务表都有 `store_id`
6. **SPU/SKU 分离** - 符合服装行业习惯

## 竞品分析

与商陆花/笑铺日记的差异化：

| 维度 | 传统进销存 | Wintent |
|-----|-----------|---------|
| 定位 | 记录工具 | 决策助手 |
| 能力 | 数据存储 | 智能分析 |
| 体验 | 功能堆砌 | 场景导向 |
| 价值 | 提升效率 | 提升决策质量 |
