# Clothing Store 脚本

本目录包含服装店数据模型建表脚本、种子数据和工具。

## 文件说明

| 文件 | 说明 |
|------|------|
| `collections.json` | NocoBase 表定义（14 张表），用于 create-tables.sh |
| `create-tables.sh` | 通过 NocoBase API 批量建表（需自行提供 Token） |
| `run-create-tables-and-validate.js` | **推荐** 自动登录 + 建表 + 验证，输出 validation-log-v0.1.md |
| `seed-api.js` | **通过 REST API 导入种子数据**（推荐，无需 xlsx） |
| `generate-seed-xlsx.js` | 从 seed/*.json 生成 商陆花 格式 xlsx（可选） |
| `seed/` | 种子数据 JSON（商陆花表头格式） |
| `seed-xlsx/` | 生成的 xlsx 文件（运行 generate-seed-xlsx.js 后） |

## Phase 1 使用流程

### 1. 启动 NocoBase

```bash
# 项目根目录
yarn dev
```

### 2. 创建表结构

**推荐**：使用 Node 脚本（自动登录 + 验证 + 生成日志）

```bash
node docs/clothing-store/scripts/run-create-tables-and-validate.js http://localhost:13000
```

输出：14 张表创建结果 + `docs/clothing-store/validation-log-v0.1.md`。

或使用 Shell 脚本（需自行提供 Token）：

```bash
./docs/clothing-store/scripts/create-tables.sh http://localhost:13000 <YOUR_API_TOKEN>
```

> 若无 Token，可登录后台 → 设置 → API 密钥，或从浏览器 cookie 获取。

### 3. 导入种子数据（推荐）

```bash
# 通过 REST API 直接导入，不依赖 xlsx 导入功能
node docs/clothing-store/scripts/seed-api.js http://localhost:13000

# 或手动提供 Token
node docs/clothing-store/scripts/seed-api.js http://localhost:13000 <YOUR_API_TOKEN>
```

脚本会自动登录（admin@wintent.tech / admin123），创建门店、供应商、品牌、类别、员工、VIP 等级、商品、SKU、库存、客户、销售单及明细。

### 4. 可选：生成 xlsx 文件

若需要 商陆花 格式 xlsx（用于外部工具或人工核对）：

```bash
node docs/clothing-store/scripts/generate-seed-xlsx.js
```

输出：`seed-xlsx/商陆花-服装店种子数据.xlsx`

### 5. 按日期生成模拟数据（测试 diff 导入）

在 `docs/clothing-store/example/` 下按日期创建子目录，每个目录包含 4 个 xlsx（商品/库存/客户/销售单），用于测试导入和 diff 功能：

```bash
node docs/clothing-store/scripts/generate-mock-data.js [天数] [起始日期]
# 示例：生成 5 天的数据，从 2025-02-12 开始
node docs/clothing-store/scripts/generate-mock-data.js 5 2025-02-12
```

### 6. 上传 xlsx 导入（插件 API）

安装并启用 `@wintent/plugin-clothing-store` 后，可通过 API 上传 xlsx 文件导入数据：

```bash
# 需先登录获取 Token
TOKEN="..."
curl -X POST "http://localhost:13000/api/clothingImport:upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@docs/clothing-store/example/2025-02-12/商品.xlsx"
```

- 支持表头自动识别（商品/库存/客户/销售单）
- 可选参数 `type` 显式指定：products | inventory | customers | sales_orders
- 执行 diff：已存在则更新，不存在则插入，无变化则跳过

**启用插件**：在 NocoBase 后台 → 插件管理 → 启用「服装店 AI 决策助手」，然后重启应用。

**测试脚本**：`./docs/clothing-store/scripts/test-import-upload.sh [URL] [xlsx路径]`

## 种子数据说明

- **商品**：10 款（连衣裙、阔腿裤、衬衫、外套等）
- **库存**：21 条（多颜色尺码，部分低库存用于测试补货建议）
- **客户**：10 人（含活跃/沉睡/流失，用于测试回访建议）
- **销售单**：9 单（近期销售记录）+ 销售明细

数据按 商陆花/笑铺日记 导出格式设计，`seed-api.js` 自动完成字段映射并导入。
