/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient } from '@nocobase/client';
import { UserOutlined, MessageOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';
import { useRequest } from 'ahooks';

interface CustomerRecord {
  id: number;
  name?: string;
  phone?: string;
  phone_masked?: string;
  gender?: string;
  birthday?: string;
  vip_level_name?: string;
  total_orders?: number;
  total_amount?: number;
  last_order_at?: string;
  days_since_last?: number;
}

interface OrderRecord {
  id: number;
  order_no?: string;
  order_date?: string;
  sale_amount?: number;
  receivable?: number;
}

interface CustomerDetailPanelProps {
  customerId: number | null;
}

interface ScriptData {
  analysis: string;
  suggestions: string;
  script: string;
}

export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({ customerId }) => {
  const api = useAPIClient();

  const [scriptType, setScriptType] = useState<'clear' | 'match' | 'customer'>('customer');
  const [script, setScript] = useState<ScriptData | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  const { data: customer, loading: customerLoading } = useRequest<CustomerRecord | null, any>(
    async (): Promise<CustomerRecord | null> => {
      if (customerId == null || Number.isNaN(customerId)) return null;
      const res = await api.resource('customers').get?.({
        filterByTk: customerId,
      });
      const raw = res?.data as any;
      const record: CustomerRecord | null = (raw && (raw.data as CustomerRecord)) || raw || null;
      return record;
    },
    { refreshDeps: [customerId], ready: customerId != null && !Number.isNaN(customerId) },
  );

  const { data: orders = [], loading: ordersLoading } = useRequest<OrderRecord[], any>(
    async () => {
      if (customerId == null) return [];
      const res = await api.resource('sales_orders').list?.({
        pageSize: 50,
        sort: ['-order_date'],
        filter: { customer_id: customerId },
      });
      const data = res?.data as { data?: OrderRecord[]; rows?: OrderRecord[] };
      const rows = data?.data ?? data?.rows ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    { refreshDeps: [customerId], ready: customerId != null },
  );

  const generateScript = async () => {
    if (customerId == null) return;
    setScriptLoading(true);
    try {
      const res = await api.request({
        url: 'wintentScript:generate',
        method: 'post',
        data: { customerId, campaignType: scriptType },
      });
      const raw = res?.data;
      const body = (raw?.data ?? raw ?? {}) as {
        analysis?: string;
        suggestions?: string;
        script?: string;
      };
      const data: ScriptData = {
        analysis: body.analysis || '系统暂未识别出明显的历史偏好，可结合客户最近一次消费记录进行灵活沟通。',
        suggestions:
          body.suggestions || '建议先以简单问候开场，根据客户反馈再介绍本次活动或推荐商品，注意控制节奏与频率。',
        script: body.script ?? '',
      };
      setScript(data);
    } catch (e) {
      message.error('生成失败');
    } finally {
      setScriptLoading(false);
    }
  };

  const copyScript = () => {
    if (!script?.script) return;
    navigator.clipboard
      .writeText(script.script)
      .then(() => message.success('已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  };

  const orderColumns: ColumnsType<OrderRecord> = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 140 },
    {
      title: '日期',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 110,
      render: (v) => (v ? String(v).slice(0, 10) : '-'),
    },
    {
      title: '金额',
      dataIndex: 'sale_amount',
      key: 'sale_amount',
      width: 100,
      align: 'right',
      render: (v) => (v != null ? Number(v).toFixed(2) : '-'),
    },
  ];

  if (customerId == null) {
    return <Typography.Text type="secondary">请选择左侧列表中的客户查看详情</Typography.Text>;
  }

  if (customerLoading && !customer) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  if (!customer) {
    return (
      <div style={{ padding: 24 }}>
        <Typography.Text type="secondary">未找到该客户</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, maxHeight: '80vh', overflow: 'auto' }}>
      <Typography.Title level={5}>
        <UserOutlined /> 客户详情
      </Typography.Title>

      <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="姓名">{customer.name ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="手机">{customer.phone_masked ?? customer.phone ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="性别">{customer.gender ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="VIP">{customer.vip_level_name ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="购买次数">{customer.total_orders ?? 0}</Descriptions.Item>
          <Descriptions.Item label="累计金额">
            {customer.total_amount != null ? Number(customer.total_amount).toFixed(2) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后消费">
            {customer.last_order_at ? String(customer.last_order_at).slice(0, 10) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="距今天数">
            {customer.days_since_last != null ? `${customer.days_since_last} 天` : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="购买记录" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          rowKey="id"
          columns={orderColumns}
          dataSource={orders}
          loading={ordersLoading}
          pagination={orders.length > 10 ? { pageSize: 10 } : false}
        />
      </Card>

      <Card size="small" title="个性化话术">
        <Space wrap>
          <Select
            value={scriptType}
            onChange={setScriptType}
            options={[
              { value: 'clear', label: '断码促销' },
              { value: 'match', label: '上新推荐' },
              { value: 'customer', label: '客户回访' },
            ]}
            style={{ width: 120 }}
          />
          <Button type="primary" icon={<MessageOutlined />} loading={scriptLoading} onClick={generateScript}>
            生成话术
          </Button>
        </Space>
        {script && (
          <div style={{ marginTop: 16 }}>
            <Typography.Title level={5} style={{ marginBottom: 8, fontSize: 14 }}>
              偏好说明
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 12 }}>{script.analysis}</Typography.Paragraph>

            <Typography.Title level={5} style={{ marginBottom: 8, fontSize: 14 }}>
              沟通建议
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 12 }}>{script.suggestions}</Typography.Paragraph>

            <Typography.Title level={5} style={{ marginBottom: 8, fontSize: 14 }}>
              参考话术
            </Typography.Title>
            <Typography.Paragraph copyable style={{ marginBottom: 4 }}>
              {script.script}
            </Typography.Paragraph>
            <Button type="link" size="small" onClick={copyScript}>
              复制参考话术
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
