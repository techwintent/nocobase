# Requirements Document: Wintent 服装店 AI 决策助手

## Introduction

Wintent 是专为小微服装店主设计的 **AI 驱动的经营决策助手**。基于 NocoBase 低代码平台构建，旨在帮助店主从"凭感觉经营"转向"数据驱动决策"。

### 核心价值主张

**"商陆花/笑铺日记帮你记账，Wintent 帮你决策"**

- 🤖 **进什么货？** → AI 基于销售趋势给出进货建议
- 🤖 **怎么搭配？** → AI 推荐最优组合提升连带率
- 🤖 **谁该回访？** → AI 识别沉睡客户最佳回访时机
- 🤖 **哪些滞销？** → AI 预警库存风险并建议清仓策略

### 目标用户

**主要用户**：月销 500-1000 件的成熟服装店主
- 已有数字化基础（使用过商陆花、笑铺日记等工具）
- 有经营意识但缺乏数据分析能力
- 希望从经验驱动转向数据驱动

**用户痛点**：
1. **数据录入难**：实体店节奏快，没时间详细录入商品和客户信息
2. **组货搭配难**：进货时不知道怎么搭配，卖货时连带率低
3. **功能繁琐**：现有软件功能多但复杂，好功能用不上
4. **决策靠感觉**：有数据但不会分析，不知道"接下来该怎么做"

### 设计原则

1. **主动推送** > 被动查询：AI 主动告诉你该做什么，而非等你查询
2. **一步到位** > 多步操作：最多点击 2 次完成核心任务
3. **自然语言** > 专业术语：用人话表达，不用"RFM 模型"这种术语
4. **渐进式复杂度**：新手看首页建议即可，高级用户可深入分析

### 核心差异化

与传统进销存系统（如商陆花/笑铺日记）的区别：

| 维度 | 传统进销存 | Wintent |
|-----|-----------|---------|
| **定位** | 记录工具 | 决策助手 |
| **能力** | 数据存储 | 智能分析 |
| **体验** | 功能堆砌 | 场景导向 |
| **价值** | 提升效率 | 提升决策质量 |

## Glossary

### 业务术语

- **Product**：商品，服装店销售的具体款式
- **SKU**：库存单位，商品+尺码的唯一组合
- **Customer**：客户，有购买记录的消费者
- **Match**：搭配，可一起销售的商品组合
- **Co-purchase Rate**：连带率，两件商品一起购买的概率
- **Campaign**：运营活动，针对特定商品和客户群体的营销活动
- **Script**：话术，向客户推荐商品时使用的个性化文案

### 技术术语

- **Collection**：NocoBase 中的数据表
- **Block**：NocoBase 中的界面区块
- **AI Engine**：智能分析引擎（规则引擎 + LLM）

## Requirements

### Requirement 1: 低门槛数据录入

**User Story:** As a 店主, I want 快速录入核心信息, so that AI 能获得足够数据进行分析，且不影响我的经营节奏。

#### Acceptance Criteria

1. THE System SHALL 支持扫码自动识别商品基本信息
2. THE System SHALL 只要求录入核心字段：商品名、货号、进价、售价  
3. THE System SHALL 支持快速标签标注：风格（休闲/通勤/甜美）、季节（春夏秋冬）
4. THE System SHALL 基于销售记录自动推断商品的适合人群和搭配建议
5. THE System SHALL 支持 Level 1 录入：姓名 + 手机号，30 秒完成
6. THE System SHALL 支持拍照存档，解决"不知道谁是谁"的问题
7. THE System SHALL 基于购买记录自动推断客户的尺码偏好和风格倾向
8. THE System SHALL 支持将微信聊天信息快速同步到客户备注

### Requirement 2: 智能搭配推荐（核心功能）

**User Story:** As a 店主, I want AI 推荐商品搭配组合, so that 我在进货和卖货时都能做出更好的搭配决策。

#### Acceptance Criteria

**进货搭配推荐**：
1. WHEN 选择一件商品准备进货, THE System SHALL 推荐可搭配的其他商品
2. THE System SHALL 基于历史连带率分析，给出搭配建议和建议进货数量
3. THE System SHALL 考虑现有库存，避免推荐库存积压的商品
4. THE System SHALL 显示预期连带销售额和提升幅度
5. THE System SHALL 支持一键将搭配商品添加到进货单

**销售搭配推荐**：
6. WHEN 客户选择一件商品, THE System SHALL 实时推荐最佳搭配
7. THE System SHALL 基于该客户的历史偏好调整推荐优先级
8. THE System SHALL 优先推荐库存充足的商品
9. THE System SHALL 显示搭配的连带成功率和预期客单价提升

**补货场景搭配推荐**：
10. WHEN 商品库存不足需要补货, THE System SHALL 分析该商品的常见搭配
11. THE System SHALL 基于连带率推荐同时补货的搭配商品
12. THE System SHALL 计算搭配商品的建议补货数量
13. THE System SHALL 显示搭配进货的预期连带销售提升
14. THE System SHALL 生成完整的进货单，包含主商品和搭配商品

**算法基础**：
15. THE System SHALL 基于历史销售数据计算商品间的连带率
16. THE System SHALL 结合商品属性（颜色、风格、品类）进行规则匹配
17. THE System SHALL 综合连带率（70%权重）和属性匹配（30%权重）进行排序
18. THE System SHALL 持续学习用户采纳情况，优化推荐算法

### Requirement 3: 智能进货建议

**User Story:** As a 店主, I want AI 基于销售趋势给我进货建议, so that 我能减少盲目进货，提高商品周转率。

#### Acceptance Criteria

1. THE System SHALL 分析最近 30/60/90 天的销售趋势，识别畅销品类和款式
2. THE System SHALL 结合库存水位，计算建议补货数量
3. THE System SHALL 考虑季节因素，调整进货建议的优先级
4. THE System SHALL 识别滞销商品，建议暂停进货或清仓处理
5. THE System SHALL 基于客户需求分析，预测下阶段可能的热销方向
6. THE System SHALL 以自然语言生成进货建议报告

### Requirement 4: 移动端3栏导航界面

**User Story:** As a 店主, I want 移动端优化的简洁界面, so that 我能在手机上高效完成所有核心操作。

#### Acceptance Criteria

**导航结构**：
1. THE System SHALL 采用底部3栏导航：📦 库存、🤖 AI中心、👥 客户
2. THE System SHALL 以 AI中心 作为默认首页，突出智能决策功能
3. THE System SHALL 支持单手操作，关键按钮位于拇指易触达区域
4. THE System SHALL 在当前页面高亮显示对应导航图标

**AI中心页面**：
5. THE System SHALL 显示经营概览：商品和客户数据可视化
6. THE System SHALL 显示AI智能建议列表，支持一键执行
7. THE System SHALL 提供数据导入入口（商陆花/笑铺日记）
8. THE System SHALL 提供系统设置功能

**库存页面**：
9. THE System SHALL 提供Tab切换：[商品列表] [运营活动]
10. THE System SHALL 在商品列表中显示快捷操作按钮（一键促销、一键补货、上新推荐）
11. THE System SHALL 支持运营活动策划：活动类型选择、商品筛选、客户匹配
12. THE System SHALL 显示补货详情页：搭配推荐、进货单汇总

**客户页面**：
13. THE System SHALL 支持3种视图切换：客户列表、运营活动执行、客户详情
14. THE System SHALL 在运营活动执行中显示匹配客户和个性化话术
15. THE System SHALL 提供一键复制话术功能

**页面联动**：
16. THE System SHALL 支持AI建议点击直接跳转到对应模块
17. THE System SHALL 支持运营活动执行时自动跳转到客户页面
18. THE System SHALL 支持补货操作时显示搭配推荐和进货单

**移动端适配**：
19. THE System SHALL 适配320px-450px屏幕宽度
20. THE System SHALL 使用卡片式布局，信息层次清晰
21. THE System SHALL 避免超过 3 层的操作深度
22. THE System SHALL 采用自然语言表达，避免专业术语

### Requirement 5: 客户复购分析

**User Story:** As a 店主, I want 了解客户的消费行为和复购规律, so that 我能主动维护客户关系，提升复购率。

#### Acceptance Criteria

1. THE System SHALL 计算每位客户的复购周期和消费频次
2. THE System SHALL 识别"沉睡客户"（超过预期周期未消费的客户）
3. THE System SHALL 预测客户下次购买时机，提前推送回访提醒
4. THE System SHALL 分析客户的风格偏好变化趋势
5. THE System SHALL 识别高价值客户并给出专属营销建议
6. THE System SHALL 在客户生日/特殊节日前自动提醒

### Requirement 6: 基础数据管理（简化版）

**User Story:** As a 店主, I want 管理商品和库存信息, so that AI 分析功能有足够的数据基础。

#### Acceptance Criteria

**商品管理**：
1. THE System SHALL 支持基础商品信息管理：名称、货号、分类、进价、售价
2. THE System SHALL 支持商品状态管理：正常、断码、新品、滞销
3. THE System SHALL 支持商品风格和季节标签设置
4. THE System SHALL 支持批量导入商品信息
5. WHEN 商品被销售记录引用, THE System SHALL 禁止删除

**库存管理**：
6. THE System SHALL 为每个商品+尺码维护独立库存记录
7. THE System SHALL 支持入库/出库/盘点操作，记录流水日志
8. THE System SHALL 设置库存预警阈值，低库存时高亮提醒
9. THE System SHALL 自动计算商品周转率和库存天数
10. THE System SHALL 按库存详情显示各尺码库存明细

**客户管理**：
11. THE System SHALL 支持客户基本信息：姓名、手机、微信、生日
12. THE System SHALL 支持客户照片存储和识别
13. THE System SHALL 支持客户状态管理：活跃、沉睡、流失
14. THE System SHALL 记录客户最后消费时间和累计消费金额
15. THE System SHALL 自动统计客户消费次数、最后消费时间
16. THE System SHALL 支持客户偏好信息：尺码偏好、风格偏好、消费水平

**销售管理**：
17. THE System SHALL 支持快速开单：选择客户、添加商品、确认支付
18. THE System SHALL 自动计算订单金额，支持整单折扣
19. THE System SHALL 支持多种支付方式记录
20. WHEN 订单完成, THE System SHALL 自动扣减库存并记录销售数据

### Requirement 7: 数据可视化仪表盘

**User Story:** As a 店主, I want 直观查看关键经营数据, so that 我能快速了解生意状况。

#### Acceptance Criteria

1. THE System SHALL 显示今日/本周/本月销售额和对比趋势
2. THE System SHALL 显示商品销量排行榜和客户消费排行榜
3. THE System SHALL 显示库存预警商品列表
4. THE System SHALL 显示 AI 建议的执行状态和效果跟踪
5. THE System SHALL 支持按时间范围筛选和对比分析
6. THE System SHALL 用图表而非数字表格展示趋势变化

### Requirement 8: AI 引擎扩展性

**User Story:** As a 开发者, I want AI 分析引擎具有扩展性, so that 可以持续优化算法和添加新的分析功能。

#### Acceptance Criteria

1. THE System SHALL 采用插件化架构，AI 功能可独立升级
2. THE System SHALL 支持规则引擎和机器学习混合模式
3. THE System SHALL 支持本地部署和云端 API 两种计算方式
4. THE System SHALL 记录 AI 建议的采纳率，用于算法优化
5. THE System SHALL 支持自定义分析规则和阈值

### Requirement 9: 系统性能与可靠性

**User Story:** As a 店主, I want 系统响应快速且稳定, so that 不会影响我的日常经营。

#### Acceptance Criteria

1. THE System SHALL 在 2 秒内完成日常查询操作
2. THE System SHALL 支持离线模式，网络中断时仍可基本使用
3. THE System SHALL 自动备份数据，提供数据恢复功能
4. THE System SHALL 记录系统日志，便于问题排查
5. THE System SHALL 支持数据导入导出，保证数据可迁移

### Requirement 10: 数据导入功能

**User Story:** As a 现有进销存软件用户, I want 快速导入历史数据到 Wintent, so that 我能在不中断业务的情况下享受 AI 决策功能。

#### Acceptance Criteria

1. THE System SHALL 支持批量导入 Excel (.xlsx) 和 CSV 格式的数据文件
2. THE System SHALL 提供商陆花和笑铺日记的预设数据模板，自动识别字段格式
3. THE System SHALL 提供智能字段映射功能，自动匹配源数据字段与系统字段的对应关系
4. THE System SHALL 允许用户手动调整字段映射关系，处理特殊格式差异
5. THE System SHALL 在导入前提供数据预览功能，显示将要导入的记录数和主要字段内容
6. THE System SHALL 支持数据清洗和格式化，自动处理常见的数据格式问题（空值、格式不一致等）
7. THE System SHALL 提供数据验证功能，检查必填字段、数据类型和业务规则合规性
8. THE System SHALL 在数据导入过程中显示进度条和状态信息
9. THE System SHALL 生成导入结果报告，详细列出成功、失败和警告记录
10. THE System SHALL 支持增量数据导入，能够识别和处理重复数据
11. THE System SHALL 记录导入历史，支持回滚到导入前的数据状态
12. THE System SHALL 支持大文件分批导入，单次导入支持至少 10000 条记录

### Requirement 11: 数据同步管理

**User Story:** As a 双系统并行用户, I want 定期同步现有系统的数据到 Wintent, so that 我能在过渡期保持数据一致性。

#### Acceptance Criteria

1. THE System SHALL 支持定期同步功能，用户可设置同步频率（日/周/月）
2. THE System SHALL 提供同步计划管理界面，显示上次同步时间和下次计划时间
3. THE System SHALL 支持手动触发立即同步操作
4. THE System SHALL 在同步过程中自动检测数据变化，只同步有更新的记录
5. THE System SHALL 提供冲突解决策略，当源数据与系统数据不一致时提供处理选项
6. THE System SHALL 记录每次同步的详细日志，包括同步数量、错误信息和处理结果
7. THE System SHALL 在同步失败时发送通知提醒，并提供错误详情
8. THE System SHALL 支持同步数据的回滚功能，可恢复到同步前的状态

### Requirement 12: 数据质量监控

**User Story:** As a 店主, I want 系统监控数据质量并给出改进建议, so that AI 分析基于高质量数据得出更准确的结论。

#### Acceptance Criteria

1. THE System SHALL 定期扫描数据完整性，识别缺失关键信息的记录
2. THE System SHALL 检测数据一致性问题，如价格异常、库存负值等
3. THE System SHALL 识别重复数据记录，提供合并或删除建议
4. THE System SHALL 分析数据入口质量，统计各来源数据的准确率
5. THE System SHALL 提供数据质量仪表板，直观显示数据健康度指标
6. THE System SHALL 生成数据质量报告，定期推送给用户
7. THE System SHALL 为低质量数据提供修复建议和一键修复功能
8. THE System SHALL 在数据质量影响 AI 分析准确性时主动预警

## Non-Functional Requirements

### 性能需求

- 系统响应时间 < 2 秒
- AI 分析延迟 < 5 秒
- 支持并发用户数 > 50

### 安全需求

- 客户隐私数据本地存储
- 支持数据加密和访问控制
- 定期安全漏洞扫描

### 可用性需求

- 系统可用性 > 99.5%
- 支持自动故障恢复
- 提供操作手册和在线帮助

### 兼容性需求

- 支持主流手机浏览器
- 支持 PC/平板/手机多端访问
- 兼容常见数据导入格式（Excel/CSV）

## Success Metrics

### 用户行为指标

- 日活跃用户数（DAU）
- 用户留存率（7天/30天）
- 功能使用率（各功能点击率）

### 业务价值指标

- AI 建议采纳率 > 60%
- 用户客单价提升 > 15%
- 库存周转率提升 > 10%
- 客户复购率提升 > 8%

### 产品满意度指标

- 用户评分 > 4.5/5
- 用户推荐意愿 > 70%
- 客服工单数量 < 5/月/用户
### Requirement 13: 运营活动管理

**User Story:** As a 店主, I want 创建和管理各类运营活动, so that 我能针对库存商品进行精准营销。

#### Acceptance Criteria

1. THE System SHALL 支持创建运营活动类型：断码促销、上新推荐、换季推荐、滞销清仓、自定义活动
2. THE System SHALL 支持设置商品筛选条件：分类、状态（断码/新品/滞销）、季节、价格区间
3. THE System SHALL 支持设置客户匹配条件：尺码匹配、风格偏好、消费能力、上次消费时间
4. THE System SHALL 实时显示预览：匹配的商品数量和客户数量
5. THE System SHALL 执行活动时自动跳转到客户模块，显示匹配客户列表
6. THE System SHALL 支持 AI 自动识别库存状况并推荐运营活动
7. THE System SHALL 记录活动执行历史和效果统计

### Requirement 14: 话术生成

**User Story:** As a 店主, I want 系统自动生成个性化推荐话术, so that 我能快速高效地联系客户。

#### Acceptance Criteria

1. THE System SHALL 基于客户信息（姓名、尺码、风格偏好）生成个性化话术
2. THE System SHALL 基于商品信息（名称、价格、促销状态）调整话术内容
3. THE System SHALL 支持多种话术模板：促销话术、上新话术、回访话术、搭配推荐话术
4. THE System SHALL 提供一键复制话术功能，显示"已复制"反馈
5. THE System SHALL 支持批量复制多个客户的话术
6. THE System SHALL 记录话术复制和使用情况，优化生成效果

### Requirement 15: 经营概览可视化

**User Story:** As a 店主, I want 直观查看商品和客户的关键数据, so that 我能快速了解经营状况并采取行动。

#### Acceptance Criteria

1. THE System SHALL 显示商品统计：总数、断码数、新品数、滞销数
2. THE System SHALL 显示客户统计：总数、活跃客户数、沉睡客户数、流失客户数
3. THE System SHALL 显示趋势图：销售件数趋势、客户触达趋势
4. THE System SHALL 使用颜色区分状态：正常（绿色）、警告（橙色）、危险（红色）
5. THE System SHALL 支持点击数据项直接跳转到对应筛选列表
6. THE System SHALL 数据实时更新，反映当前最新状态

---

## 2026-02-04 新增需求（待细化）

> 以下需求来自南瓜原型反馈，待进一步讨论细节后正式纳入。

### Requirement 16: 小红书/抖音搭配搜索（待定）

**User Story:** As a 店主, I want 搜索小红书/抖音上的热门搭配, so that 我能参考流行趋势进行进货和推荐。

#### 背景

南瓜在原型体验后主动提出此需求："能否有自动搜索小红书或者抖音同款，并推荐搭配？"

#### 初步设想

1. THE System SHALL 支持输入商品名称/关键词搜索外部平台搭配
2. THE System SHALL 展示热门搭配图片和链接
3. THE System SHALL 基于搭配结果推荐店内可搭配商品或进货建议

#### 待研究

- 技术方案：爬虫 vs API vs 第三方服务
- 合规性：平台数据使用政策
- 优先级：需评估开发成本

---

### Requirement 17: 新客获取 - 碰碰贴/扫码引流（待定）

**User Story:** As a 店主, I want 通过 NFC 碰碰贴或扫码快速获取新客户信息, so that 我能高效积累客户资产并引导关注店铺渠道。

#### 背景

南瓜反馈她正在使用有赞的「流量碰碰贴」，周边商户也有需求但不懂技术。

#### 初步设想

**碰碰贴/扫码链路**：
1. THE System SHALL 支持 NFC 标签或二维码触发跳转
2. THE System SHALL 提供可定制的落地页（店铺介绍 + 关注入口）
3. THE System SHALL 支持多渠道跳转：视频号、小程序商城、公众号、企业微信
4. THE System SHALL 支持新人优惠券领取（需手机号授权）
5. THE System SHALL 自动创建客户档案（手机号 + 来源标记）

**后台管理**：
6. THE System SHALL 提供短链管理功能（创建/编辑/统计）
7. THE System SHALL 记录触发统计：时间、来源、转化
8. THE System SHALL 支持远程更换跳转目标（无需更换 NFC 贴）

#### 待研究

- NFC 贴片采购渠道和成本
- 微信跳转限制和适配
- 与现有客户管理的整合

---

### Requirement 18: 数据获取 - 截图识别（待定）

**User Story:** As a 店主, I want 通过上传截图快速导入客户数据, so that 我能将笑铺日记等软件的客户画像信息迁移到 Wintent。

#### 背景

笑铺日记 App 没有数据导出功能，但有完善的客户画像页面。通过截图识别可以作为数据迁移的替代方案。

#### 初步设想

1. THE System SHALL 支持上传笑铺日记客户画像截图
2. THE System SHALL 使用 AI OCR 识别截图中的关键信息
3. THE System SHALL 提取字段：姓名、手机号、消费统计、偏好（颜色/尺码/分类）
4. THE System SHALL 支持用户确认/修正识别结果
5. THE System SHALL 自动创建或更新客户档案

#### 待研究

- OCR 识别准确率
- 多种截图格式适配
- 用户操作流程优化

---

### Requirement 19: AI 建议触发机制

**User Story:** As a 店主, I want AI 建议能够自动生成和更新, so that 我无需手动触发就能获得最新的经营建议。

#### Acceptance Criteria

**定时触发**：
1. THE System SHALL 每日 00:00 自动执行全量刷新
2. THE System SHALL 刷新内容包括：补货建议、促销建议、新品推荐、回访建议
3. THE System SHALL 同时更新客户状态（活跃/沉睡/流失）

**数据变更触发**：
4. WHEN 库存数据变更（inventory 表更新）, THE System SHALL 实时检查库存并更新补货建议
5. WHEN 销售出库（sale_items 新增）, THE System SHALL 实时检查库存并更新相关建议
6. WHEN 销售订单创建（sales 新增）, THE System SHALL 更新客户活跃度并清理回访建议
7. WHEN 商品状态变更为断码/滞销, THE System SHALL 自动生成促销建议
8. WHEN 商品状态恢复正常, THE System SHALL 自动清理促销建议

**配置参数**：
9. THE System SHALL 支持配置库存告警阈值（默认 5 件）
10. THE System SHALL 支持配置沉睡客户天数（默认 30 天）
11. THE System SHALL 支持配置流失客户天数（默认 60 天）
12. THE System SHALL 支持配置新品期限（默认 7 天）

**API 触发**：
13. THE System SHALL 提供手动刷新 API 端点
14. THE System SHALL 返回刷新结果摘要（各类建议数量）

---

## 战略方向更新（2026-02-04）

### 核心洞察

基于南瓜原型反馈和深度对话，明确以下关键认识：

1. **功能同质化不是卖点**
   - 商陆花/笑铺日记已有完善的进销存功能
   - 它们的上下游打通是核心优势（供应商 → 商家 → 客户）

2. **AI 价值 = 自动化 + 帮你做**
   - 不是展示信息，而是主动告诉你该做什么
   - 数据变化 → AI 自动触发 → 帮你执行

3. **数据在笑铺日记，分析在 Wintent**
   - 笑铺日记有数据但没分析（南瓜说"要不是你今天要，我也没看到"）
   - Wintent 定位：站在巨人肩膀上做增值服务

### 新定位

**「服装店数据分析助手」** 或 **「笑铺日记 AI 增强版」**

```
笑铺日记/商陆花：数据录入 + 上下游 + 收银开单 + 基础统计
        ↓ 数据导入/截图识别
Wintent：AI 分析 + 主动提醒 + 营销建议 + 搭配推荐
```

### 客户数据来源（双轨）

| 来源 | 方式 | 场景 |
|------|------|------|
| **老客录入** | 截图识别 / Excel 导入 / 手动录入 | 迁移现有客户 |
| **新客获取** | 碰碰贴 / 扫码 / 小程序授权 | 积累新客户 |

