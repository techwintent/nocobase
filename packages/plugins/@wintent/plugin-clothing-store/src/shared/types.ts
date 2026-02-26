/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Shared types for clothing import, change log, and AI insights.
 */

export interface DetailedChange {
  action: 'insert' | 'update';
  uniqueKey: string;
  label: string;
  changedFields?: string[];
  before?: Record<string, any>;
  after?: Record<string, any>;
}

export interface Insight {
  level: 'info' | 'warning' | 'danger';
  category: 'inventory' | 'price' | 'customer' | 'sales';
  title: string;
  description: string;
  relatedKeys?: string[];
}

export interface ImportResult {
  type: string;
  fileName?: string;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string; details?: string }[];
  changes: DetailedChange[];
  insights: Insight[];
  fileArchivePath?: string;
}
