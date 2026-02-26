/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 库存管理页 - 按款号聚合库存，可展开查看明细
 */

import { useAPIClient } from '@nocobase/client';
import { DatabaseOutlined } from '@ant-design/icons';
import { Alert, Card, Col, Input, Row, Space, Switch, Table, Tag, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { useRequest } from 'ahooks';
import { useNavigate } from 'react-router-dom';

interface InventoryRow {
  id: number;
  product_id?: number;
  product_name?: string;
  spu_code?: string;
  store_name?: string;
  color?: string;
  size?: string;
  quantity?: number;
  barcode?: string;
}

interface AggregatedRow {
  spu_code: string;
  product_name?: string;
  totalQty: number;
  skuCount: number;
  hasLowStock: boolean;
  product_id?: number;
}

export const InventoryManagePage: React.FC = () => {
  const api = useAPIClient();
  const navigate = useNavigate();
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [keyword, setKeyword] = useState('');

  const { data: rawList = [], loading } = useRequest(
    async () => {
      const filter = onlyLowStock ? { quantity: { $lt: 5 } } : undefined;
      const res = await api.resource('inventory').list?.({
        pageSize: 1000,
        filter,
      });
      const data = res?.data as { data?: InventoryRow[]; rows?: InventoryRow[] };
      const rows = data?.data ?? data?.rows ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    { refreshDeps: [onlyLowStock] },
  );

  const groupedData = useMemo<AggregatedRow[]>(() => {
    const map = new Map<string, AggregatedRow>();
    (rawList as InventoryRow[]).forEach((row) => {
      const key = row.spu_code;
      if (!key) return;
      const exist = map.get(key);
      const qty = Number(row.quantity) || 0;
      if (!exist) {
        map.set(key, {
          spu_code: key,
          product_name: row.product_name,
          totalQty: qty,
          skuCount: 1,
          hasLowStock: qty < 5,
          product_id: row.product_id,
        });
      } else {
        exist.totalQty += qty;
        exist.skuCount += 1;
        if (qty < 5) {
          exist.hasLowStock = true;
        }
      }
    });

    let list = Array.from(map.values());
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(
        (item) =>
          (item.spu_code && item.spu_code.toLowerCase().includes(k)) ||
          (item.product_name && item.product_name.toLowerCase().includes(k)),
      );
    }
    return list;
  }, [rawList, keyword]);

  const columns: ColumnsType<AggregatedRow> = [
    {
      title: '款号',
      dataIndex: 'spu_code',
      key: 'spu_code',
      width: 120,
      render: (v) => <Typography.Text strong>{v ?? '-'}</Typography.Text>,
    },
    {
      title: '名称',
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: 'SKU 数',
      dataIndex: 'skuCount',
      key: 'skuCount',
      width: 90,
      align: 'right',
    },
    {
      title: '总库存',
      dataIndex: 'totalQty',
      key: 'totalQty',
      width: 110,
      align: 'right',
      render: (v) => `${v} 件`,
    },
    {
      title: '断码',
      key: 'low',
      width: 80,
      render: (_, record) => (record.hasLowStock ? <Tag color="orange">存在低库存</Tag> : <Tag>库存正常</Tag>),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_, record) =>
        record.hasLowStock && record.product_id ? (
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/admin/restock-recommendation?productId=${record.product_id}`)}
          >
            去补货
          </Button>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
  ];

  const expandedRowRender = (record: AggregatedRow) => {
    const rows = (rawList as InventoryRow[]).filter((r) => r.spu_code === record.spu_code);
    const detailColumns: ColumnsType<InventoryRow> = [
      { title: '门店', dataIndex: 'store_name', key: 'store_name', width: 120 },
      { title: '颜色', dataIndex: 'color', key: 'color', width: 80 },
      { title: '尺码', dataIndex: 'size', key: 'size', width: 80 },
      {
        title: '库存数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        align: 'right',
      },
      { title: '条码', dataIndex: 'barcode', key: 'barcode', width: 140 },
    ];
    return (
      <Table<InventoryRow> size="small" rowKey="id" columns={detailColumns} dataSource={rows} pagination={false} />
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>
        <DatabaseOutlined /> 库存管理
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        按款号聚合查看库存情况，支持只看低库存、展开查看门店 / 颜色 / 尺码明细。
      </Typography.Paragraph>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="库存数据来自 xlsx 导入，点击「数据工作台」上传最新库存文件即可更新。"
        action={
          <Button type="link" onClick={() => navigate('/admin/data-studio')}>
            前往数据工作台
          </Button>
        }
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="none">
            <Space>
              <span>只看低库存：</span>
              <Switch checked={onlyLowStock} onChange={setOnlyLowStock} />
            </Space>
          </Col>
          <Col flex="auto">
            <Input.Search
              placeholder="搜索款号或名称"
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ maxWidth: 280 }}
            />
          </Col>
        </Row>
      </Card>

      <Table<AggregatedRow>
        size="small"
        rowKey="spu_code"
        columns={columns}
        dataSource={groupedData}
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
    </div>
  );
};
