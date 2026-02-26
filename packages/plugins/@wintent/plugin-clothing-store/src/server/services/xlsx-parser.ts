/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * XLSX parser with header auto-detection for clothing store import.
 * Detects data type (products/inventory/customers/sales_orders) from sheet headers.
 */

import * as XLSX from 'xlsx';

export type ImportType = 'products' | 'inventory' | 'customers' | 'sales_orders';

const HEADER_SIGNATURES: Record<ImportType, string[]> = {
  products: ['款号', '采购价', '上架日期'],
  inventory: ['条码', '颜色', '尺码'],
  customers: ['客户名称', '手机', 'VIP等级'],
  sales_orders: ['批次', '经办人', '实销数'],
};

/**
 * Detect import type from sheet headers (first row).
 * Returns the type if at least 2 signature columns match.
 */
export function detectImportType(headers: string[]): ImportType | null {
  const headerSet = new Set(headers.map((h) => String(h || '').trim()));
  for (const [type, sigs] of Object.entries(HEADER_SIGNATURES)) {
    const matches = sigs.filter((s) => headerSet.has(s));
    if (matches.length >= 2) {
      return type as ImportType;
    }
  }
  return null;
}

/**
 * Parse xlsx buffer and return rows with headers.
 * First row is treated as headers. Returns { headers, rows, type }.
 */
export function parseXlsx(
  buffer: Buffer,
  explicitType?: ImportType,
): { headers: string[]; rows: Record<string, any>[]; type: ImportType } {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    raw: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel file has no sheets');
  }
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  }) as string[][];

  if (!raw || raw.length < 1) {
    throw new Error('Excel file is empty');
  }

  const headers = (raw[0] || []).map((h) => String(h ?? '').trim());
  const dataRows = raw.slice(1);

  const rows: Record<string, any>[] = [];
  for (const row of dataRows) {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      const val = row[i];
      if (val !== undefined && val !== null && val !== '') {
        obj[h] = val;
      }
    });
    if (Object.keys(obj).length > 0) {
      rows.push(obj);
    }
  }

  const type = explicitType || detectImportType(headers);
  if (!type) {
    throw new Error(
      'Cannot detect import type from headers. Expected one of: 商品(款号,采购价,上架日期), 库存(条码,颜色,尺码), 客户(客户名称,手机,VIP等级), 销售单(批次,经办人,实销数)',
    );
  }

  return { headers, rows, type };
}
