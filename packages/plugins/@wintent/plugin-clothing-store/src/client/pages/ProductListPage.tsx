/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 库存模块 - 商品列表与状态管理
 * 商品卡片展示、状态标签（断码/新品/滞销）、快捷操作（促销/补货/推荐）
 */

import { useAPIClient } from '@nocobase/client';
import { AppstoreOutlined, ShoppingOutlined, TagOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

interface ProductRecord {
  id: number;
  spu_code: string;
  name?: string;
  status?: string;
  total_stock?: number;
  total_sold?: number;
  listed_at?: string;
  price_1?: number;
  category_name?: string;
  season?: string;
}

interface StatusMap {
  outOfSize: number[];
  new: number[];
  slow: number[];
}

interface InventoryRecord {
  id: number;
  store_name?: string;
  color?: string;
  size?: string;
  quantity?: number;
  barcode?: string;
  product_id?: number;
  spu_code?: string;
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'outOfSize', label: '断码' },
  { value: 'new', label: '新品' },
  { value: 'slow', label: '滞销' },
];

export function ProductListPage() {
  const api = useAPIClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && STATUS_FILTER_OPTIONS.some((o) => o.value === statusFromUrl)) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  const { data: statusMap, loading: statusLoading } = useRequest(
    async (): Promise<StatusMap> => {
      const res = await api.request({ url: 'wintentOverview:productStatusMap', method: 'get' });
      const raw = res?.data;
      return (raw?.data ?? raw ?? {}) as StatusMap;
    },
    { manual: false },
  );

  const { data: listData, loading: listLoading } = useRequest(
    async () => {
      const res = await api.resource('products').list?.({
        pageSize: 200,
        sort: ['-id'],
        filter: { status: 'active' },
      });
      const data = res?.data as { data?: ProductRecord[]; rows?: ProductRecord[] };
      const rows = data?.data ?? data?.rows ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    { manual: false },
  );

  const { data: inventoryList = [], loading: inventoryLoading } = useRequest(
    async () => {
      const res = await api.resource('inventory').list?.({
        pageSize: 2000,
      });
      const data = res?.data as { data?: InventoryRecord[]; rows?: InventoryRecord[] };
      const rows = data?.data ?? data?.rows ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    { manual: false },
  );

  const statusSet = useMemo(() => {
    const map = statusMap ?? { outOfSize: [], new: [], slow: [] };
    return {
      outOfSize: new Set(map.outOfSize ?? []),
      new: new Set(map.new ?? []),
      slow: new Set(map.slow ?? []),
    };
  }, [statusMap]);

  const inventorySummary = useMemo<Record<string, { totalQty: number; skuCount: number }>>(() => {
    const summary: Record<string, { totalQty: number; skuCount: number }> = {};
    (inventoryList as InventoryRecord[]).forEach((row) => {
      const key = row.spu_code;
      if (!key) return;
      const qty = Number(row.quantity) || 0;
      if (!summary[key]) {
        summary[key] = { totalQty: qty, skuCount: 1 };
      } else {
        summary[key].totalQty += qty;
        summary[key].skuCount += 1;
      }
    });
    return summary;
  }, [inventoryList]);

  const filteredList = useMemo(() => {
    let list: ProductRecord[] = Array.isArray(listData) ? listData : [];
    if (statusFilter === 'outOfSize') {
      list = list.filter((p) => statusSet.outOfSize.has(p.id));
    } else if (statusFilter === 'new') {
      list = list.filter((p) => statusSet.new.has(p.id));
    } else if (statusFilter === 'slow') {
      list = list.filter((p) => statusSet.slow.has(p.id));
    }
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(
        (p) => (p.spu_code && p.spu_code.toLowerCase().includes(k)) || (p.name && p.name.toLowerCase().includes(k)),
      );
    }

    const seen = new Map<string, ProductRecord>();
    for (const p of list) {
      if (!seen.has(p.spu_code)) {
        seen.set(p.spu_code, p);
      }
    }

    return Array.from(seen.values());
  }, [listData, statusFilter, statusSet, keyword]);

  const renderTags = (record: ProductRecord) => {
    const tags: { key: string; color: string; label: string }[] = [];
    if (statusSet.outOfSize.has(record.id)) tags.push({ key: 'outOfSize', color: 'orange', label: '断码' });
    if (statusSet.new.has(record.id)) tags.push({ key: 'new', color: 'green', label: '新品' });
    if (statusSet.slow.has(record.id)) tags.push({ key: 'slow', color: 'default', label: '滞销' });
    return (
      <Space size={[0, 4]} wrap>
        {tags.map((t) => (
          <Tag key={t.key} color={t.color}>
            {t.label}
          </Tag>
        ))}
      </Space>
    );
  };

  const columns: ColumnsType<ProductRecord> = [
    {
      title: '款号',
      dataIndex: 'spu_code',
      key: 'spu_code',
      width: 120,
      render: (val) => <Typography.Text strong>{val ?? '-'}</Typography.Text>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '状态标签',
      key: 'tags',
      width: 160,
      render: (_, record) => renderTags(record),
    },
    {
      title: '库存',
      dataIndex: 'total_stock',
      key: 'total_stock',
      width: 120,
      align: 'right',
      render: (v, record) => {
        const summary = inventorySummary[record.spu_code];
        if (summary) {
          return `${summary.totalQty} 件（${summary.skuCount} 个 SKU）`;
        }
        return v != null ? v : '-';
      },
    },
    {
      title: '销量',
      dataIndex: 'total_sold',
      key: 'total_sold',
      width: 80,
      align: 'right',
    },
    {
      title: '零售价',
      dataIndex: 'price_1',
      key: 'price_1',
      width: 90,
      align: 'right',
      render: (v) => (v != null ? Number(v).toFixed(2) : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<TagOutlined />}
            onClick={() => navigate(`/admin/campaign-planner?type=clear&productId=${record.id}`)}
          >
            促销
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ShoppingOutlined />}
            onClick={() => navigate(`/admin/restock-recommendation?productId=${record.id}`)}
          >
            补货
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate(`/admin/campaign-planner?type=match&productId=${record.id}`)}
          >
            推荐
          </Button>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: ProductRecord) => (
    <ProductInventoryTable productId={record.id} spuCode={record.spu_code} />
  );

  const rowExpandable = () => true;

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>
        <AppstoreOutlined /> 商品列表
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        按状态筛选（断码/新品/滞销），支持一键促销、补货、推荐跳转运营活动或补货详情。
      </Typography.Paragraph>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="none">
            <Space>
              <span>状态筛选：</span>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_FILTER_OPTIONS}
                style={{ width: 120 }}
              />
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

      <Table
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={listLoading || statusLoading || inventoryLoading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 900 }}
        expandable={{
          expandedRowRender,
          rowExpandable,
        }}
      />
    </div>
  );
}

interface ProductInventoryTableProps {
  productId: number;
  spuCode: string;
}

const ProductInventoryTable: React.FC<ProductInventoryTableProps> = ({ productId, spuCode }) => {
  const api = useAPIClient();

  const { data = [], loading } = useRequest(
    async () => {
      const res = await api.resource('inventory').list?.({
        pageSize: 500,
        filter: { spu_code: spuCode },
      });
      const data = res?.data as { data?: InventoryRecord[]; rows?: InventoryRecord[] };
      const rows = data?.data ?? data?.rows ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    { refreshDeps: [productId] },
  );

  const columns: ColumnsType<InventoryRecord> = [
    { title: '门店', dataIndex: 'store_name', key: 'store_name', width: 120 },
    { title: '颜色', dataIndex: 'color', key: 'color', width: 80 },
    { title: '尺码', dataIndex: 'size', key: 'size', width: 80 },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (v) => (v != null ? v : 0),
    },
    { title: '条码', dataIndex: 'barcode', key: 'barcode', width: 140 },
  ];

  return (
    <Table<InventoryRecord>
      size="small"
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
    />
  );
};
