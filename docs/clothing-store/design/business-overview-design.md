# 经营概览设计（AI 中心首页）

> Phase 2.1 输出 | AI 中心作为首页核心模块

---

## 1. 定位与目标

- **定位**：AI 中心首页的核心区块，一眼看清经营关键指标。
- **目标**：商品与客户统计 + 简单趋势，为 AI 建议提供数据基础，不做复杂报表。

---

## 2. 商品统计

### 2.1 指标定义

| 指标 | 含义 | 数据来源与规则 |
|------|------|----------------|
| **商品总数** | 在售款数（SPU） | `products` 表，`status = 'active'`，未软删 |
| **断码** | 有 SKU 缺码或单码库存极少 | 按款号聚合 `inventory`：同一 `product_id` 下若存在 `quantity < 5` 的 SKU 或尺码不齐，则该款计为断码 |
| **新品** | 近期上架款 | `products.listed_at` 在最近 **7 天**内（可配置「新品期」） |
| **滞销** | 库存积压或长期未动销 | 规则之一：总库存 > 0 且近 30 天无销售（通过 `sales_items` 关联 `products` 统计）；或 `total_sold = 0` 且 `listed_at` 早于 30 天 |

### 2.2 数据来源

- **商品总数**：`products` 表 count，过滤 `deletedAt`、`status = 'active'`。
- **断码**：按 `product_id` 聚合 `inventory`，检查每款下各 SKU 的 `quantity`；若任 SKU `< 库存阈值（默认 5）` 或尺码不全，计 1 个断码款。
- **新品**：`products.listed_at >= now() - 7 天`（7 天可配置）。
- **滞销**：可选 A：该款在 `sales_items` 中近 30 天无记录且 `inventory` 总数量 > 0；或 B：`total_sold = 0` 且 `listed_at < now() - 30 天`。优先实现 A，无销售明细时用 B。

### 2.3 展示形式

- 四个数字卡片：**商品总数** | **断码** | **新品** | **滞销**。
- 可选：断码/新品/滞销为可点击筛选，点击后跳转库存模块并带筛选条件。

---

## 3. 客户统计

### 3.1 指标定义

| 指标 | 含义 | 数据来源与规则 |
|------|------|----------------|
| **客户总数** | 有档案的客户数 | `customers` 表 count，未软删 |
| **活跃** | 近期有消费 | `days_since_last <= 30` 或 `last_order_at` 在 30 天内 |
| **沉睡** | 超过 30 天未消费 | `days_since_last > 30` 且 `days_since_last <= 60`（或仅 `> 30`，与流失用 60 天切分） |
| **流失** | 超过 60 天未消费 | `days_since_last > 60` |

### 3.2 数据来源

- **客户总数**：`customers` 表 count，过滤 `deletedAt`。
- **活跃**：`days_since_last <= 30`（或 `last_order_at >= now() - 30d`）。
- **沉睡**：`days_since_last > 30 && days_since_last <= 60`（可配置「沉睡天数」30）。
- **流失**：`days_since_last > 60`（可配置「流失天数」60）。

若表中无 `days_since_last`，可用 `last_order_at` 计算：`DATEDIFF(NOW(), last_order_at)`。

### 3.3 展示形式

- 四个数字卡片：**客户总数** | **活跃** | **沉睡** | **流失**。
- 可选：活跃/沉睡/流失可点击，跳转客户模块并带状态筛选。

---

## 4. 趋势图展示

### 4.1 指标

- **销售件数**：按日汇总 `sales_items.quantity`（或 `sales_orders` 上的汇总字段），最近 7/30 天。
- **客户触达**：按日去重 `sales_orders` 的 `customer_id` 数量，或「有下单客户数」，最近 7/30 天。

### 4.2 数据来源

- 销售件数：`sales_items` 按 `order_id` 关联 `sales_orders.order_date`，按日 sum(quantity)。
- 客户触达：`sales_orders` 按 `order_date` 分组，count(distinct customer_id)。

### 4.3 展示形式

- 简单折线图或柱状图：横轴日期，纵轴件数/客户数。
- 时间范围：近 7 天（默认）、近 30 天可切换。
- 若数据量小，可用 Ant Design Charts 或 ECharts 在数据工作台/经营概览区块内嵌入。

---

## 5. 与 AI 建议的衔接

- 经营概览与 AI 建议共用同一套「配置参数」：库存阈值（如 5 件）、沉睡天数（30）、流失天数（60）、新品期（7 天）。
- 概览中的「断码 / 滞销 / 沉睡 / 流失」数量，与 AI 建议条数可对应（例如断码款数 ≈ 部分「促销类」建议数量）。
- 前端：经营概览区块置于数据工作台或 AI 中心首页上方，AI 建议卡片置于其下，点击建议可跳转库存/客户模块并带参数。

---

## 6. 技术实现要点

- **接口**：服务端提供 `GET /api/wintent/overview/stats`（或通过 NocoBase 自定义 resource），返回 `{ product: { total, outOfSize, new, slow }, customer: { total, active, sleeping, churn }, trend: { salesByDay, customersByDay } }`。
- **性能**：统计可做轻量聚合，避免全表扫描；必要时用缓存（如 5 分钟）或定时预计算。
- **配置**：库存阈值、沉睡/流失天数、新品期从配置或环境读取，便于 2.2 AI 建议系统复用。

---

## 7. 配置参数（与 2.2 一致）

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 库存阈值（件） | 5 | 低于此值视为低库存/断码参考 |
| 沉睡天数 | 30 | 超过 N 天未消费为沉睡 |
| 流失天数 | 60 | 超过 N 天未消费为流失 |
| 新品期（天） | 7 | 上架 N 天内视为新品 |
