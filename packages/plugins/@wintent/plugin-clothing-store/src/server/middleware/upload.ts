/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * File upload middleware for clothing import xlsx files.
 * Runs when clothingImport:upload action is invoked.
 */

import { Context, Next } from '@nocobase/actions';
import { koaMulter as multer } from '@nocobase/utils';

export async function clothingImportUploadMiddleware(ctx: Context, next: Next) {
  const resourceName = ctx.action?.resourceName;
  const actionName = ctx.action?.actionName;
  if (resourceName !== 'clothingImport' || actionName !== 'upload') {
    return next();
  }
  const upload = multer().single('file');
  return upload(ctx, next);
}
