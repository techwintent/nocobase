# Wintent 服装店数据模型设计 v0.1

> 基于南瓜导出的商陆花/笑铺日记表头设计
> 设计原则：**宁可冗余，不可重构**
> 状态：原型设计，待真实数据验证

---

## 设计原则

1. **字段类型宽松**：拿不准的用 `VARCHAR(255)` 或 `TEXT`
2. **预留扩展字段**：每表预留 `ext_json` 存储未预见的数据
3. **软删除**：所有表都有 `deleted_at`，不物理删除
4. **审计字段**：统一 `created_at`, `updated_at`, `created_by`, `updated_by`
5. **多门店支持**：所有业务表都有 `store_id`
6. **ID 策略**：主键用 `BIGINT` 自增，预留 `uuid` 字段备用

---

## 表结构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        核心业务表                                │
├─────────────────────────────────────────────────────────────────┤
│  stores        门店表                                            │
│  products      商品表（款号维度）                                 │
│  skus          SKU表（颜色+尺码维度）                            │
│  inventory     库存表（门店+SKU维度）                            │
│  customers     客户表                                            │
│  sales_orders  销售单表（单头）                                  │
│  sales_items   销售单明细（单身）                                │
├─────────────────────────────────────────────────────────────────┤
│                        辅助表                                    │
├─────────────────────────────────────────────────────────────────┤
│  suppliers     供应商表                                          │
│  categories    类别表                                            │
│  brands        品牌表                                            │
│  employees     员工表                                            │
│  vip_levels    VIP等级表                                         │
│  payment_methods 支付方式表                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. 门店表 (stores)

```sql
CREATE TABLE stores (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid            VARCHAR(36) UNIQUE,
    
    -- 基础信息
    name            VARCHAR(100) NOT NULL COMMENT '门店名称',
    code            VARCHAR(50) COMMENT '门店编码',
    type            VARCHAR(50) COMMENT '门店类型：直营/加盟/批发/零售',
    status          VARCHAR(20) DEFAULT 'active' COMMENT '状态：active/inactive/closed',
    
    -- 联系信息
    phone           VARCHAR(50),
    address         VARCHAR(500),
    province        VARCHAR(50),
    city            VARCHAR(50),
    district        VARCHAR(50),
    
    -- 负责人
    manager_name    VARCHAR(50),
    manager_phone   VARCHAR(50),
    
    -- 扩展
    ext_json        JSON COMMENT '扩展字段',
    remark          TEXT COMMENT '备注',
    
    -- 审计
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT,
    updated_by      BIGINT,
    deleted_at      DATETIME COMMENT '软删除时间'
);
```

---

## 2. 商品表 (products)

> 对应「款号」维度，一个款号可能有多个颜色、尺码（SKU）

```sql
CREATE TABLE products (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid            VARCHAR(36) UNIQUE,
    
    -- 基础信息（来自商品表表头）
    spu_code        VARCHAR(100) NOT NULL COMMENT '款号',
    name            VARCHAR(255) COMMENT '名称',
    status          VARCHAR(20) DEFAULT 'active' COMMENT '状态：active/inactive/discontinued',
    
    -- 价格体系（预留多价格）
    cost_price      DECIMAL(12,2) COMMENT '采购价/进货价',
    price_1         DECIMAL(12,2) COMMENT '价格1（零售价）',
    price_2         DECIMAL(12,2) COMMENT '价格2（批发价）',
    price_3         DECIMAL(12,2) COMMENT '价格3（VIP价）',
    price_4         DECIMAL(12,2) COMMENT '价格4',
    price_5         DECIMAL(12,2) COMMENT '价格5',
    discount        DECIMAL(5,2) COMMENT '产品折扣',
    
    -- 分类信息
    supplier_id     BIGINT COMMENT '供应商ID',
    supplier_name   VARCHAR(100) COMMENT '供应商名称（冗余）',
    brand_id        BIGINT COMMENT '品牌ID',
    brand_name      VARCHAR(100) COMMENT '品牌名称（冗余）',
    category_id     BIGINT COMMENT '类别ID',
    category_name   VARCHAR(100) COMMENT '类别名称（冗余）',
    
    -- 属性信息
    material        VARCHAR(255) COMMENT '面料',
    lining          VARCHAR(255) COMMENT '里料',
    accessory       VARCHAR(255) COMMENT '配料',
    style           VARCHAR(100) COMMENT '风格',
    season          VARCHAR(50) COMMENT '季节：春/夏/秋/冬/四季',
    year            VARCHAR(10) COMMENT '年份',
    
    -- 上架信息
    listed_at       DATE COMMENT '上架日期',
    sales_cycle     VARCHAR(50) COMMENT '款号销售周期',
    is_special      TINYINT DEFAULT 0 COMMENT '是否特价商品',
    
    -- 合规信息（服装行业需要）
    exec_standard   VARCHAR(100) COMMENT '执行标准',
    safety_category VARCHAR(50) COMMENT '安全类别',
    quality_grade   VARCHAR(50) COMMENT '等级',
    inspector       VARCHAR(50) COMMENT '检验员',
    origin          VARCHAR(100) COMMENT '产地',
    
    -- 图片（预留）
    main_image      VARCHAR(500) COMMENT '主图URL',
    images          JSON COMMENT '图片列表',
    
    -- 统计（冗余，定期更新）
    total_stock     INT DEFAULT 0 COMMENT '总库存',
    total_sold      INT DEFAULT 0 COMMENT '总销量',
    
    -- 扩展
    unit            VARCHAR(20) DEFAULT '件' COMMENT '计量单位',
    ext_json        JSON COMMENT '扩展字段',
    remark          TEXT COMMENT '备注',
    
    -- 审计
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT,
    updated_by      BIGINT,
    deleted_at      DATETIME,
    
    -- 索引
    INDEX idx_spu_code (spu_code),
    INDEX idx_supplier (supplier_id),
    INDEX idx_brand (brand_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_listed_at (listed_at)
);
```

---

## 3. SKU表 (skus)

> 对应「颜色+尺码」维度，每个 SKU 有独立条码

```sql
CREATE TABLE skus (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid            VARCHAR(36) UNIQUE,
    
    -- 关联
    product_id      BIGINT NOT NULL COMMENT '商品ID',
    spu_code        VARCHAR(100) COMMENT '款号（冗余）',
    
    -- SKU 属性
    sku_code        VARCHAR(100) COMMENT 'SKU编码',
    barcode         VARCHAR(100) COMMENT '条码',
    color           VARCHAR(50) COMMENT '颜色',
    color_code      VARCHAR(20) COMMENT '颜色编码',
    size            VARCHAR(20) COMMENT '尺码',
    
    -- 价格（可覆盖商品价格）
    cost_price      DECIMAL(12,2) COMMENT '进货价（可单独设置）',
    price_1         DECIMAL(12,2) COMMENT '价格1',
    price_2         DECIMAL(12,2) COMMENT '价格2',
    price_3         DECIMAL(12,2) COMMENT '价格3',
    price_4         DECIMAL(12,2) COMMENT '价格4',
    price_5         DECIMAL(12,2) COMMENT '价格5',
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'active' COMMENT '状态',
    
    -- 图片
    image           VARCHAR(500) COMMENT 'SKU图片',
    
    -- 扩展
    ext_json        JSON COMMENT '扩展字段',
    
    -- 审计
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    
    -- 索引
    INDEX idx_product (product_id),
    INDEX idx_spu_code (spu_code),
    INDEX idx_barcode (barcode),
    INDEX idx_color_size (color, size)
);
```

---

## 4. 库存表 (inventory)

> 对应「门店+SKU」维度

```sql
CREATE TABLE inventory (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 关联
    store_id        BIGINT NOT NULL COMMENT '门店ID',
    store_name      VARCHAR(100) COMMENT '门店名称（冗余）',
    product_id      BIGINT NOT NULL COMMENT '商品ID',
    sku_id          BIGINT NOT NULL COMMENT 'SKU ID',
    
    -- 冗余信息（查询方便）
    spu_code        VARCHAR(100) COMMENT '款号',
    sku_code        VARCHAR(100) COMMENT 'SKU编码',
    barcode         VARCHAR(100) COMMENT '条码',
    product_name    VARCHAR(255) COMMENT '商品名称',
    color           VARCHAR(50) COMMENT '颜色',
    size            VARCHAR(20) COMMENT '尺码',
    
    -- 库存数量
    quantity        INT DEFAULT 0 COMMENT '当前库存',
    available_qty   INT DEFAULT 0 COMMENT '可用库存（扣除锁定）',
    locked_qty      INT DEFAULT 0 COMMENT '锁定库存',
    
    -- 预警
    min_stock       INT DEFAULT 0 COMMENT '最低库存预警',
    max_stock       INT COMMENT '最高库存预警',
    
    -- 成本
    avg_cost        DECIMAL(12,2) COMMENT '平均成本',
    
    -- 位置
    location        VARCHAR(100) COMMENT '库位',
    
    -- 扩展
    ext_json        JSON COMMENT '扩展字段',
    
    -- 审计
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 唯一约束
    UNIQUE KEY uk_store_sku (store_id, sku_id),
    
    -- 索引
    INDEX idx_store (store_id),
    INDEX idx_product (product_id),
    INDEX idx_sku (sku_id),
    INDEX idx_barcode (barcode),
    INDEX idx_quantity (quantity)
);
```

---

## 5. 客户表 (customers)

```sql
CREATE TABLE customers (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid            VARCHAR(36) UNIQUE,
    
    -- 基础信息
    name            VARCHAR(100) COMMENT '客户名称',
    phone           VARCHAR(50) COMMENT '手机',
    phone_masked    VARCHAR(50) COMMENT '脱敏手机号',
    gender          VARCHAR(10) COMMENT '性别：男/女/未知',
    birthday        DATE COMMENT '生日',
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'active' COMMENT '状态：active/inactive/blacklist',
    
    -- 会员信息
    vip_level_id    BIGINT COMMENT 'VIP等级ID',
    vip_level_name  VARCHAR(50) COMMENT 'VIP等级名称（冗余）',
    paid_member_level VARCHAR(50) COMMENT '付费会员等级',
    member_expire_at DATE COMMENT '会员到期时间',
    customer_discount DECIMAL(5,2) COMMENT '客户折扣',
    price_level     VARCHAR(20) COMMENT '适用价格：price_1/price_2/...',
    
    -- 储值信息
    balance         DECIMAL(12,2) DEFAULT 0 COMMENT '储值余额',
    principal_balance DECIMAL(12,2) DEFAULT 0 COMMENT '本金余额',
    gift_balance    DECIMAL(12,2) DEFAULT 0 COMMENT '赠金余额',
    credit_balance  DECIMAL(12,2) DEFAULT 0 COMMENT '货款余额/欠款',
    points          INT DEFAULT 0 COMMENT '剩余积分',
    
    -- 消费统计（冗余，定期更新）
    total_orders    INT DEFAULT 0 COMMENT '购买次数',
    total_amount    DECIMAL(14,2) DEFAULT 0 COMMENT '购买金额',
    last_order_at   DATETIME COMMENT '上次消费日期',
    last_order_amount DECIMAL(12,2) COMMENT '上次消费金额',
    days_since_last INT COMMENT '未消费天数',
    avg_order_amount DECIMAL(12,2) COMMENT '平均客单价',
    
    -- 归属
    store_id        BIGINT COMMENT '所属门店',
    employee_id     BIGINT COMMENT '所属员工',
    employee_name   VARCHAR(50) COMMENT '所属员工名称（冗余）',
    
    -- 联系地址
    province        VARCHAR(50),
    city            VARCHAR(50),
    district        VARCHAR(50),
    address         VARCHAR(500) COMMENT '详细地址',
    
    -- 标签（用于分群）
    tags            JSON COMMENT '标签列表',
    
    -- 来源
    source          VARCHAR(50) COMMENT '来源渠道：门店/小程序/抖音/...',
    source_detail   VARCHAR(255) COMMENT '来源详情',
    
    -- 扩展
    ext_json        JSON COMMENT '扩展字段',
    remark          TEXT COMMENT '备注',
    
    -- 审计
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT,
    updated_by      BIGINT,
    deleted_at      DATETIME,
    
    -- 索引
    INDEX idx_phone (phone),
    INDEX idx_store (store_id),
    INDEX idx_employee (employee_id),
    INDEX idx_vip_level (vip_level_id),
    INDEX idx_last_order (last_order_at),
    INDEX idx_status (status)
);
```

---

## 6. 销售单表 (sales_orders)

> 单头信息

```sql
CREATE TABLE sales_orders (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid            VARCHAR(36) UNIQUE,
    
    -- 单据信息
    order_no        VARCHAR(50) NOT NULL COMMENT '单据编号',
    batch_no        VARCHAR(50) COMMENT '批次号',
    order_type      VARCHAR(20) DEFAULT 'sale' COMMENT '单据类型：sale/return/exchange',
    status          VARCHAR(20) DEFAULT 'completed' COMMENT '状态：pending/completed/cancelled/refunded',
    
    -- 关联
    store_id        BIGINT COMMENT '门店ID',
    store_name      VARCHAR(100) COMMENT '门店名称（冗余）',
    customer_id     BIGINT COMMENT '客户ID',
    customer_name   VARCHAR(100) COMMENT '客户名称（冗余）',
    customer_phone  VARCHAR(50) COMMENT '客户手机（冗余）',
    employee_id     BIGINT COMMENT '经办人ID',
    employee_name   VARCHAR(50) COMMENT '经办人名称（冗余）',
    
    -- 时间
    order_date      DATE COMMENT '销售日期',
    order_time      DATETIME COMMENT '销售时间',
    
    -- 数量统计
    sale_qty        INT DEFAULT 0 COMMENT '销售数',
    return_qty      INT DEFAULT 0 COMMENT '退货数',
    actual_qty      INT DEFAULT 0 COMMENT '实销数',
    
    -- 金额
    sale_amount     DECIMAL(12,2) DEFAULT 0 COMMENT '销售额',
    return_amount   DECIMAL(12,2) DEFAULT 0 COMMENT '退货额',
    discount_amount DECIMAL(12,2) DEFAULT 0 COMMENT '优惠总额',
    other_fee       DECIMAL(12,2) DEFAULT 0 COMMENT '其他费用',
    receivable      DECIMAL(12,2) DEFAULT 0 COMMENT '应收',
    received        DECIMAL(12,2) DEFAULT 0 COMMENT '实收',
    
    -- 抵扣
    coupon_deduct   DECIMAL(12,2) DEFAULT 0 COMMENT '抖音券抵扣',
    points_deduct   DECIMAL(12,2) DEFAULT 0 COMMENT '积分抵扣',
    
    -- 支付方式明细
    pay_principal   DECIMAL(12,2) DEFAULT 0 COMMENT '储值本金支付',
    pay_gift        DECIMAL(12,2) DEFAULT 0 COMMENT '储值赠金支付',
    pay_qrcode      DECIMAL(12,2) DEFAULT 0 COMMENT '扫码收款',
    pay_cash        DECIMAL(12,2) DEFAULT 0 COMMENT '现金',
    pay_bank        DECIMAL(12,2) DEFAULT 0 COMMENT '银行',
    pay_alipay      DECIMAL(12,2) DEFAULT 0 COMMENT '支付宝',
    pay_wechat      DECIMAL(12,2) DEFAULT 0 COMMENT '微信',
    pay_other       DECIMAL(12,2) DEFAULT 0 COMMENT '其他支付',
    
    -- 支付汇总（JSON 格式，更灵活）
    payments        JSON COMMENT '支付明细 [{method, amount}]',
    
    -- 扩展
    ext_json        JSON COMMENT '扩展字段',
    remark          TEXT COMMENT '备注',
    
    -- 审计
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT COMMENT '创建人',
    updated_by      BIGINT,
    deleted_at      DATETIME,
    
    -- 索引
    UNIQUE KEY uk_order_no (order_no),
    INDEX idx_store (store_id),
    INDEX idx_customer (customer_id),
    INDEX idx_employee (employee_id),
    INDEX idx_order_date (order_date),
    INDEX idx_status (status)
);
```

---

## 7. 销售单明细表 (sales_items)

> 单身信息，每行是一个 SKU

```sql
CREATE TABLE sales_items (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 关联
    order_id        BIGINT NOT NULL COMMENT '销售单ID',
    order_no        VARCHAR(50) COMMENT '单据编号（冗余）',
    
    -- 商品信息（冗余，快照）
    product_id      BIGINT COMMENT '商品ID',
    sku_id          BIGINT COMMENT 'SKU ID',
    spu_code        VARCHAR(100) COMMENT '款号',
    sku_code        VARCHAR(100) COMMENT 'SKU编码',
    barcode         VARCHAR(100) COMMENT '条码',
    product_name    VARCHAR(255) COMMENT '商品名称',
    color           VARCHAR(50) COMMENT '颜色',
    size            VARCHAR(20) COMMENT '尺码',
    
    -- 数量
    quantity        INT NOT NULL COMMENT '数量（正=销售，负=退货）',
    
    -- 价格（快照）
    cost_price      DECIMAL(12,2) COMMENT '成本价',
    original_price  DECIMAL(12,2) COMMENT '原价',
    sell_price      DECIMAL(12,2) COMMENT '售价',
    discount        DECIMAL(5,2) COMMENT '折扣',
    
    -- 金额
    amount          DECIMAL(12,2) COMMENT '金额',
    discount_amount DECIMAL(12,2) DEFAULT 0 COMMENT '优惠金额',
    actual_amount   DECIMAL(12,2) COMMENT '实际金额',
    
    -- 扩展
    ext_json        JSON COMMENT '扩展字段',
    remark          VARCHAR(500),
    
    -- 索引
    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    INDEX idx_sku (sku_id),
    INDEX idx_barcode (barcode)
);
```

---

## 8. 辅助表

### 8.1 供应商表 (suppliers)

```sql
CREATE TABLE suppliers (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid            VARCHAR(36) UNIQUE,
    name            VARCHAR(100) NOT NULL COMMENT '供应商名称',
    code            VARCHAR(50) COMMENT '编码',
    contact_name    VARCHAR(50) COMMENT '联系人',
    contact_phone   VARCHAR(50) COMMENT '联系电话',
    address         VARCHAR(500) COMMENT '地址',
    status          VARCHAR(20) DEFAULT 'active',
    ext_json        JSON,
    remark          TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME
);
```

### 8.2 类别表 (categories)

```sql
CREATE TABLE categories (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    parent_id       BIGINT DEFAULT 0 COMMENT '父级ID',
    name            VARCHAR(100) NOT NULL COMMENT '类别名称',
    code            VARCHAR(50) COMMENT '编码',
    level           INT DEFAULT 1 COMMENT '层级',
    path            VARCHAR(255) COMMENT '路径：1/2/3',
    sort_order      INT DEFAULT 0 COMMENT '排序',
    status          VARCHAR(20) DEFAULT 'active',
    ext_json        JSON,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    INDEX idx_parent (parent_id)
);
```

### 8.3 品牌表 (brands)

```sql
CREATE TABLE brands (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL COMMENT '品牌名称',
    code            VARCHAR(50) COMMENT '编码',
    logo            VARCHAR(500) COMMENT 'Logo URL',
    description     TEXT COMMENT '描述',
    status          VARCHAR(20) DEFAULT 'active',
    ext_json        JSON,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME
);
```

### 8.4 员工表 (employees)

```sql
CREATE TABLE employees (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid            VARCHAR(36) UNIQUE,
    name            VARCHAR(50) NOT NULL COMMENT '姓名',
    phone           VARCHAR(50) COMMENT '手机',
    role            VARCHAR(50) COMMENT '角色：店长/店员/...',
    store_id        BIGINT COMMENT '所属门店',
    status          VARCHAR(20) DEFAULT 'active',
    ext_json        JSON,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    INDEX idx_store (store_id)
);
```

### 8.5 VIP等级表 (vip_levels)

```sql
CREATE TABLE vip_levels (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(50) NOT NULL COMMENT '等级名称',
    level           INT DEFAULT 0 COMMENT '等级序号',
    discount        DECIMAL(5,2) COMMENT '折扣',
    price_level     VARCHAR(20) COMMENT '适用价格',
    min_amount      DECIMAL(12,2) COMMENT '升级所需金额',
    min_points      INT COMMENT '升级所需积分',
    benefits        JSON COMMENT '权益列表',
    status          VARCHAR(20) DEFAULT 'active',
    ext_json        JSON,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 预留扩展

### 未来可能需要的表

```
purchase_orders     采购单
purchase_items      采购单明细
stock_in            入库单
stock_out           出库单
stock_transfer      调拨单
stock_check         盘点单
customer_points_log 积分变动记录
customer_balance_log 储值变动记录
promotions          促销活动
coupons             优惠券
```

### ext_json 使用约定

当需要存储未预见的字段时，统一使用 `ext_json`：

```json
{
  "custom_field_1": "value1",
  "custom_field_2": 123,
  "import_source": "商陆花",
  "original_id": "xxx"
}
```

---

## 数据迁移注意事项

1. **原系统 ID 保留**：在 `ext_json` 中存储 `original_id`
2. **导入来源标记**：记录 `import_source`
3. **数据清洗**：手机号、日期格式标准化
4. **关联重建**：根据款号、条码等建立关联

---

## ER 图（简化）

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│ stores  │      │suppliers│      │ brands  │
└────┬────┘      └────┬────┘      └────┬────┘
     │                │                │
     │         ┌──────┴───────┐        │
     │         │   products   │←───────┘
     │         └──────┬───────┘
     │                │
     │         ┌──────┴───────┐
     │         │     skus     │
     │         └──────┬───────┘
     │                │
┌────┴────────────────┴────┐
│        inventory         │
└──────────────────────────┘

┌───────────┐      ┌───────────────┐      ┌─────────────┐
│ customers │←─────│ sales_orders  │─────→│  employees  │
└───────────┘      └───────┬───────┘      └─────────────┘
                           │
                   ┌───────┴───────┐
                   │  sales_items  │
                   └───────────────┘
```

---

*版本：v0.1*
*创建：2026-02-08*
*状态：原型设计，待真实数据验证*
