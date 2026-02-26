/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 库存模块 - 补货搭配推荐
 * 低库存商品、建议补货量、搭配进货推荐、进货单汇总
 */

import { useAPIClient } from '@nocobase/client';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Card, Col, message, Row, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

interface MatchItem {
  matchProductId: number;
  matchProductName: string;
  matchRate: number;
  suggestedQty: number;
}

interface RestockItem {
  productId: number;
  spuCode: string;
  productName: string;
  currentStock: number;
  suggestedQty: number;
  skuDetails?: {
    id: number;
    storeName?: string;
    color?: string;
    size?: string;
    quantity: number;
    suggestedQty: number;
  }[];
  matchProducts: MatchItem[];
}

export function RestockRecommendationPage() {
  const api = useAPIClient();
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get('productId');

  const { data, loading } = useRequest(
    async () => {
      const res = await api.request({
        url: 'wintentRestock:recommendations',
        method: 'get',
        params: productIdParam ? { productId: productIdParam } : undefined,
      });
      const raw = res?.data;
      const body = (raw?.data ?? raw ?? {}) as { items?: RestockItem[] };
      return body?.items ?? [];
    },
    { refreshDeps: [productIdParam], onError: (e: any) => message.error(e?.message || '加载补货推荐失败') },
  );

  const items: RestockItem[] = Array.isArray(data) ? data : [];
  const totalSuggested = items.reduce((sum, i) => sum + i.suggestedQty, 0);
  const matchCount = items.reduce((sum, i) => sum + i.matchProducts.length, 0);

  const columns: ColumnsType<RestockItem> = [
    {
      title: '款号',
      dataIndex: 'spuCode',
      key: 'spuCode',
      width: 120,
      render: (v) => <Typography.Text strong>{v ?? '-'}</Typography.Text>,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right',
    },
    {
      title: '建议补货量',
      dataIndex: 'suggestedQty',
      key: 'suggestedQty',
      width: 110,
      align: 'right',
      render: (v) => <Typography.Text type="warning">{v ?? 0}</Typography.Text>,
    },
    {
      title: '搭配推荐',
      key: 'matchProducts',
      render: (_, record) =>
        record.matchProducts?.length ? (
          <Typography.Text type="secondary">
            {record.matchProducts.map((m) => `${m.matchProductName}×${m.suggestedQty}`).join('、')}
          </Typography.Text>
        ) : (
          '-'
        ),
    },
  ];

  const skuColumns = [
    {
      title: '门店',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 120,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
    },
    {
      title: '尺码',
      dataIndex: 'size',
      key: 'size',
      width: 80,
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '建议补货量',
      dataIndex: 'suggestedQty',
      key: 'suggestedQty',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <Typography.Text type="warning">{v ?? 0}</Typography.Text>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>
        <ShoppingCartOutlined /> 补货搭配推荐
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        基于当前库存与搭配率，生成建议补货量与搭配进货推荐；与 AI 中心补货建议联动。
      </Typography.Paragraph>

      {items.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card size="small" title="建议补货款数">
              <Typography.Title level={3}>{items.length}</Typography.Title>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="建议补货总量">
              <Typography.Title level={3}>{totalSuggested}</Typography.Title>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="搭配推荐数">
              <Typography.Title level={3}>{matchCount}</Typography.Title>
            </Card>
          </Col>
        </Row>
      )}

      <Table
        size="small"
        rowKey="productId"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={items.length > 10 ? { pageSize: 20 } : false}
        expandable={{
          expandedRowRender: (record) =>
            record.skuDetails && record.skuDetails.length ? (
              <Table size="small" rowKey="id" columns={skuColumns} dataSource={record.skuDetails} pagination={false} />
            ) : null,
          rowExpandable: (record) => !!record.skuDetails && record.skuDetails.length > 0,
        }}
      />
    </div>
  );
}
