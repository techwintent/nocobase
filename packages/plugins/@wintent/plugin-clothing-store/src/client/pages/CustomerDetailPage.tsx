/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 客户模块 - 客户详情（独立路由版本，复用 CustomerDetailPanel）
 */

import { UserOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomerDetailPanel } from '../components/CustomerDetailPanel';

export function CustomerDetailPage() {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const customerId = idParam ? Number(idParam) : null;

  if (customerId == null) {
    return (
      <div style={{ padding: 24 }}>
        <Typography.Text type="secondary">请从客户列表点击「详情」进入，或链接带 ?id=客户ID</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>
        <UserOutlined /> 客户详情
      </Typography.Title>
      <CustomerDetailPanel customerId={customerId} />
    </div>
  );
}
