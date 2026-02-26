/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Wintent 经营概览与 AI 建议配置参数（与 design/business-overview-design.md 一致）
 */

export const WINTENT_CONFIG = {
  /** 库存低于此值视为低库存/断码参考（件） */
  STOCK_THRESHOLD: 5,
  /** 超过 N 天未消费为沉睡客户 */
  SLEEP_DAYS: 30,
  /** 超过 N 天未消费为流失客户 */
  CHURN_DAYS: 60,
  /** 上架 N 天内视为新品 */
  NEW_PRODUCT_DAYS: 7,
  /** 滞销：近 N 天无销售视为滞销 */
  SLOW_SALE_DAYS: 30,
} as const;
