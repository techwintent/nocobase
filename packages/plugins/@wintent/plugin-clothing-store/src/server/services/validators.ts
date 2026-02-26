/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Data validation rules for clothing import.
 * Validates rows before import. Failed rows are recorded but do not abort the import.
 */

import type { ImportType } from './xlsx-parser';

const SEASONS = ['春', '夏', '秋', '冬', '四季'];
const CUSTOMER_STATUSES = ['活跃', '沉睡', '流失'];
const PRODUCT_STATUSES = ['在售', '停售', '下架'];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isEmpty(v: any): boolean {
  return v === undefined || v === null || v === '';
}

export function validateProductsRow(row: Record<string, any>, rowIndex: number): ValidationResult {
  const errors: string[] = [];
  if (isEmpty(row['款号'])) {
    errors.push('款号不能为空');
  }
  const costPrice = row['采购价'];
  if (costPrice != null && (Number.isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
    errors.push('采购价必须为非负数');
  }
  const price1 = row['价格1'];
  if (price1 != null && (Number.isNaN(Number(price1)) || Number(price1) < 0)) {
    errors.push('价格1必须为非负数');
  }
  const season = row['季节'];
  if (season && !SEASONS.includes(String(season))) {
    errors.push(`季节必须为: ${SEASONS.join(', ')}`);
  }
  const status = row['状态'];
  if (status && !PRODUCT_STATUSES.includes(String(status))) {
    errors.push(`状态必须为: ${PRODUCT_STATUSES.join(', ')}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateInventoryRow(
  row: Record<string, any>,
  rowIndex: number,
  productExists?: (spuCode: string) => boolean,
): ValidationResult {
  const errors: string[] = [];
  if (isEmpty(row['条码'])) {
    errors.push('条码不能为空');
  }
  const qty = row['库存'];
  if (qty != null && (Number.isNaN(Number(qty)) || Number(qty) < 0 || !Number.isInteger(Number(qty)))) {
    errors.push('库存必须为非负整数');
  }
  const spuCode = row['款号'];
  if (spuCode && productExists && !productExists(String(spuCode))) {
    errors.push(`款号 "${spuCode}" 对应的商品不存在，请先导入商品`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateCustomersRow(row: Record<string, any>, rowIndex: number): ValidationResult {
  const errors: string[] = [];
  const phone = row['手机'];
  if (isEmpty(phone)) {
    errors.push('手机不能为空');
  } else {
    const ph = String(phone).replace(/\D/g, '');
    if (ph.length !== 11) {
      errors.push('手机号必须为11位数字');
    }
  }
  const birthday = row['生日'];
  if (birthday) {
    const d = new Date(birthday);
    if (Number.isNaN(d.getTime())) {
      errors.push('生日日期格式无效');
    }
  }
  const status = row['状态'];
  if (status && !CUSTOMER_STATUSES.includes(String(status))) {
    errors.push(`状态必须为: ${CUSTOMER_STATUSES.join(', ')}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateSalesOrdersRow(
  row: Record<string, any>,
  rowIndex: number,
  customerExists?: (name: string) => boolean,
): ValidationResult {
  const errors: string[] = [];
  if (isEmpty(row['批次'])) {
    errors.push('批次不能为空');
  }
  const receivable = Number(row['应收'] ?? row['销售额'] ?? 0);
  const received = Number(row['实收'] ?? row['应收'] ?? 0);
  if (received > receivable) {
    errors.push('实收不能大于应收');
  }
  const customer = row['客户'];
  if (customer && customerExists && !customerExists(String(customer))) {
    errors.push(`客户 "${customer}" 不存在，请先导入客户`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateRow(
  type: ImportType,
  row: Record<string, any>,
  rowIndex: number,
  context?: { productExists?: (s: string) => boolean; customerExists?: (s: string) => boolean },
): ValidationResult {
  switch (type) {
    case 'products':
      return validateProductsRow(row, rowIndex);
    case 'inventory':
      return validateInventoryRow(row, rowIndex, context?.productExists);
    case 'customers':
      return validateCustomersRow(row, rowIndex);
    case 'sales_orders':
      return validateSalesOrdersRow(row, rowIndex, context?.customerExists);
    default:
      return { valid: false, errors: ['未知的数据类型'] };
  }
}
