/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Change log card - summary + expandable row-level details, supports multi-file batch.
 */

import { Card, Collapse, Empty, Space, Statistic, Table, Typography } from 'antd';
import React from 'react';
import type { DetailedChange, ImportResult } from '../../shared/types';

const TYPE_LABELS: Record<string, string> = {
  products: '商品',
  inventory: '库存',
  customers: '客户',
  sales_orders: '销售单',
};

const FIELD_LABELS: Record<string, string> = {
  price_1: '价格1',
  price_2: '价格2',
  price_3: '价格3',
  cost_price: '采购价',
  quantity: '库存数量',
  available_qty: '可用数量',
  status: '状态',
  received: '实收',
};

export interface ChangeLogCardProps {
  results: ImportResult[];
  loading?: boolean;
}

function formatValue(v: any): string {
  if (v == null) return '—';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function SingleResultContent({ result }: { result: ImportResult }) {
  const hasErrors = result.errors?.length > 0;
  const hasChanges = (result.changes?.length ?? 0) > 0;

  const changeColumns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: (a: string) => (a === 'insert' ? '新增' : '更新'),
    },
    { title: '标识', dataIndex: 'label', key: 'label' },
    {
      title: '变更字段',
      dataIndex: 'changedFields',
      key: 'changedFields',
      render: (fields: string[] | undefined) => fields?.map((f) => FIELD_LABELS[f] || f).join(', ') || '—',
    },
  ];

  const detailColumns = [
    { title: '字段', dataIndex: 'field', key: 'field', width: 120 },
    { title: '变更前', dataIndex: 'before', key: 'before' },
    { title: '变更后', dataIndex: 'after', key: 'after' },
  ];

  const expandRow = (record: DetailedChange) => {
    if (record.action !== 'update' || !record.changedFields?.length || !record.before || !record.after) {
      return null;
    }
    const dataSource = record.changedFields.map((f) => ({
      key: f,
      field: FIELD_LABELS[f] || f,
      before: formatValue(record.before[f]),
      after: formatValue(record.after[f]),
    }));
    return <Table dataSource={dataSource} columns={detailColumns} pagination={false} size="small" />;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Typography.Text strong>识别类型：</Typography.Text> {TYPE_LABELS[result.type] ?? result.type}
      </div>
      <Space wrap size="large">
        <Statistic title="新增" value={result.inserted} />
        <Statistic title="更新" value={result.updated} />
        <Statistic title="跳过" value={result.skipped} />
        {hasErrors && <Statistic title="错误" value={result.errors.length} valueStyle={{ color: '#cf1322' }} />}
      </Space>

      {hasErrors && (
        <Collapse
          size="small"
          items={[
            {
              key: 'errors',
              label: `错误详情（${result.errors.length} 行）`,
              children: (
                <Table
                  dataSource={result.errors}
                  columns={[
                    { title: '行号', dataIndex: 'row', key: 'row', width: 80 },
                    { title: '错误原因', dataIndex: 'message', key: 'message' },
                  ]}
                  rowKey={(r) => `${r.row}-${r.message}`}
                  pagination={false}
                  size="small"
                />
              ),
            },
          ]}
        />
      )}

      {hasChanges && (
        <Collapse
          size="small"
          items={[
            {
              key: 'changes',
              label: `变更明细（${result.changes.length} 条）`,
              children: (
                <Table
                  dataSource={result.changes}
                  columns={changeColumns}
                  rowKey={(r) => `${r.uniqueKey}-${r.action}`}
                  pagination={false}
                  size="small"
                  expandable={{
                    expandedRowRender: expandRow,
                    rowExpandable: (r) => r.action === 'update' && (r.changedFields?.length ?? 0) > 0,
                  }}
                />
              ),
            },
          ]}
        />
      )}
    </Space>
  );
}

export function ChangeLogCard({ results, loading }: ChangeLogCardProps) {
  if (loading) {
    return (
      <Card title="变更摘要" size="small">
        <Empty description="正在导入…" />
      </Card>
    );
  }

  if (!results?.length) {
    return (
      <Card title="变更摘要" size="small">
        <Empty description="导入数据后这里将显示变更摘要" />
      </Card>
    );
  }

  const totalInserted = results.reduce((s, r) => s + (r.inserted ?? 0), 0);
  const totalUpdated = results.reduce((s, r) => s + (r.updated ?? 0), 0);
  const totalSkipped = results.reduce((s, r) => s + (r.skipped ?? 0), 0);
  const totalErrors = results.reduce((s, r) => s + (r.errors?.length ?? 0), 0);

  const collapseItems = results.map((r, idx) => ({
    key: `file-${idx}`,
    label: `${r.fileName || `文件${idx + 1}`} (${TYPE_LABELS[r.type] ?? r.type})`,
    children: <SingleResultContent result={r} />,
  }));

  return (
    <Card title="变更摘要" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space wrap size="large">
          <Statistic title="新增合计" value={totalInserted} />
          <Statistic title="更新合计" value={totalUpdated} />
          <Statistic title="跳过合计" value={totalSkipped} />
          {totalErrors > 0 && <Statistic title="错误合计" value={totalErrors} valueStyle={{ color: '#cf1322' }} />}
        </Space>
        <Collapse size="small" items={collapseItems} />
      </Space>
    </Card>
  );
}
