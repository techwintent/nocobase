/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 客户模块 - 客户列表 + 运营活动执行（根据 URL campaign/segment 切换）
 * 列表：状态标签（活跃/沉睡/流失）、搜索筛选、查看详情、生成话术
 * 执行：匹配客户列表 + 个性化话术 + 一键复制
 */

import { useAPIClient } from '@nocobase/client';
import { TeamOutlined, CopyOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Input, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { CustomerDetailPanel } from '../components/CustomerDetailPanel';

const SLEEP_DAYS = 30;
const CHURN_DAYS = 60;

interface CustomerRecord {
  id: number;
  name?: string;
  phone?: string;
  phone_masked?: string;
  total_amount?: number;
  total_orders?: number;
  last_order_at?: string;
  days_since_last?: number;
  vip_level_name?: string;
}

interface ScriptData {
  analysis: string;
  suggestions: string;
  script: string;
}

interface MatchedProduct {
  id: number;
  spuCode: string;
  name: string;
  categoryName: string;
  style?: string;
  season?: string;
  price: number;
  totalStock: number;
  matchReasons: string[];
}

interface ProductCategoryGroup {
  category: string;
  products: MatchedProduct[];
}

const SEGMENT_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'active', label: '活跃' },
  { value: 'sleeping', label: '沉睡' },
  { value: 'churn', label: '流失' },
];

function getSegment(days: number | undefined): 'active' | 'sleeping' | 'churn' | null {
  if (days == null) return null;
  if (days <= SLEEP_DAYS) return 'active';
  if (days <= CHURN_DAYS) return 'sleeping';
  return 'churn';
}

export function CustomerListPage() {
  const api = useAPIClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaign = searchParams.get('campaign');
  const segment = searchParams.get('segment');
  const isExecutionMode = Boolean(campaign && segment);

  const productIdsParam = searchParams.get('productIds');
  const productIds = (productIdsParam || '')
    .split(',')
    .map((v) => Number(v))
    .filter((v) => !Number.isNaN(v) && v > 0);

  const [segmentFilter, setSegmentFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailCustomerId, setDetailCustomerId] = useState<number | null>(null);
  const [campaignProducts, setCampaignProducts] = useState<ProductCategoryGroup[]>([]);

  // 活动执行：拉取匹配客户 ID & 活动商品，再拉客户详情
  const { data: executionCustomerIds } = useRequest(
    async () => {
      if (!isExecutionMode) return [];
      const res = await api.request({
        url: 'wintentCampaigns:preview',
        method: 'post',
        data: {
          type: campaign,
          customerSegment: segment,
          productIds: productIds.length ? productIds : undefined,
          limit: 500,
        },
      });
      const raw = res?.data;
      const body = (raw?.data ?? raw ?? {}) as {
        customerIds?: number[];
        sampleCustomerIds?: number[];
        productsByCategory?: ProductCategoryGroup[];
      };
      if (body?.productsByCategory) {
        setCampaignProducts(body.productsByCategory);
      } else {
        setCampaignProducts([]);
      }
      return body?.customerIds ?? body?.sampleCustomerIds ?? [];
    },
    { refreshDeps: [isExecutionMode, campaign, segment, productIdsParam], ready: isExecutionMode },
  );

  const { data: executionList, loading: executionLoading } = useRequest(
    async () => {
      const ids = executionCustomerIds ?? [];
      if (ids.length === 0) return [];
      const res = await api.resource('customers').list?.({
        pageSize: 500,
        filter: { id: { $in: ids } },
      });
      const data = res?.data as { data?: CustomerRecord[]; rows?: CustomerRecord[] };
      const rows = data?.data ?? data?.rows ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    { refreshDeps: [executionCustomerIds], ready: (executionCustomerIds?.length ?? 0) > 0 },
  );

  // 客户列表模式
  const { data: listData, loading: listLoading } = useRequest(
    async () => {
      if (isExecutionMode) return [];
      const filter: Record<string, any> = {};
      if (segmentFilter === 'active') filter.days_since_last = { $lte: SLEEP_DAYS };
      else if (segmentFilter === 'sleeping')
        filter.$and = [{ days_since_last: { $gt: SLEEP_DAYS } }, { days_since_last: { $lte: CHURN_DAYS } }];
      else if (segmentFilter === 'churn') filter.days_since_last = { $gt: CHURN_DAYS };

      const res = await api.resource('customers').list?.({
        pageSize: 200,
        sort: ['-id'],
        filter: Object.keys(filter).length ? filter : undefined,
      });
      const data = res?.data as { data?: CustomerRecord[]; rows?: CustomerRecord[] };
      const rows = data?.data ?? data?.rows ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    { refreshDeps: [isExecutionMode, segmentFilter], ready: !isExecutionMode },
  );

  useEffect(() => {
    if (isExecutionMode) return;
    const segFromUrl = searchParams.get('segment');
    if (segFromUrl && SEGMENT_OPTIONS.some((o) => o.value === segFromUrl)) {
      setSegmentFilter(segFromUrl);
    }
  }, [isExecutionMode, searchParams]);

  const filteredList = useMemo(() => {
    const list = isExecutionMode ? executionList ?? [] : listData ?? [];
    if (!keyword.trim()) return list;
    const k = keyword.trim().toLowerCase();
    return list.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(k)) ||
        (c.phone && c.phone.includes(k)) ||
        (c.phone_masked && c.phone_masked.includes(k)),
    );
  }, [isExecutionMode, executionList, listData, keyword]);

  const [scripts, setScripts] = useState<Record<number, ScriptData>>({});
  const [loadingScripts, setLoadingScripts] = useState<Record<number, boolean>>({});

  const loadScript = async (customerId: number) => {
    setLoadingScripts((s) => ({ ...s, [customerId]: true }));
    try {
      const res = await api.request({
        url: 'wintentScript:generate',
        method: 'post',
        data: { customerId, campaignType: campaign || 'customer' },
      });
      const raw = res?.data;
      const body = (raw?.data ?? raw ?? {}) as {
        analysis?: string;
        suggestions?: string;
        script?: string;
      };
      if (!body?.script) {
        message.warning('暂无可用话术，请稍后再试');
      }
      const data: ScriptData = {
        analysis: body.analysis || '系统暂未识别出明显的历史偏好，可结合客户最近一次消费记录进行灵活沟通。',
        suggestions:
          body.suggestions || '建议先以简单问候开场，根据客户反馈再介绍本次活动或推荐商品，注意控制节奏与频率。',
        script: body.script ?? '',
      };
      setScripts((s) => ({ ...s, [customerId]: data }));
    } catch (e: any) {
      message.error(e?.message || '生成话术失败');
    } finally {
      setLoadingScripts((s) => ({ ...s, [customerId]: false }));
    }
  };

  const copyScript = (text: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => message.success('已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  };

  const renderSegmentTag = (days: number | undefined) => {
    const seg = getSegment(days);
    if (!seg) return null;
    const color = seg === 'active' ? 'green' : seg === 'sleeping' ? 'orange' : 'default';
    const label = seg === 'active' ? '活跃' : seg === 'sleeping' ? '沉睡' : '流失';
    return <Tag color={color}>{label}</Tag>;
  };

  const columns: ColumnsType<CustomerRecord> = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100, render: (v) => v ?? '-' },
    { title: '手机', dataIndex: 'phone_masked', key: 'phone', width: 120, render: (v) => v ?? '-' },
    {
      title: '状态',
      key: 'segment',
      width: 80,
      render: (_, r) => renderSegmentTag(r.days_since_last),
    },
    {
      title: '消费金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      align: 'right',
      render: (v) => (v != null ? Number(v).toFixed(2) : '-'),
    },
    {
      title: '最后消费',
      dataIndex: 'last_order_at',
      key: 'last_order_at',
      width: 110,
      render: (v) => (v ? String(v).slice(0, 10) : '-'),
    },
  ];

  if (isExecutionMode) {
    columns.push({
      title: '话术',
      key: 'script',
      render: (_, record) => {
        const script = scripts[record.id];
        const loading = loadingScripts[record.id];
        return (
          <Space direction="vertical" size="small">
            {script ? (
              <>
                <Typography.Text type="secondary">偏好说明</Typography.Text>
                <Typography.Paragraph style={{ marginBottom: 4 }}>{script.analysis}</Typography.Paragraph>
                <Typography.Text type="secondary">沟通建议</Typography.Text>
                <Typography.Paragraph style={{ marginBottom: 4 }}>{script.suggestions}</Typography.Paragraph>
                <Typography.Text type="secondary">参考话术</Typography.Text>
                <Typography.Paragraph copyable style={{ marginBottom: 4 }} ellipsis={{ rows: 3 }}>
                  {script.script}
                </Typography.Paragraph>
                <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyScript(script.script)}>
                  复制
                </Button>
              </>
            ) : (
              <Button
                type="link"
                size="small"
                icon={<MessageOutlined />}
                loading={loading}
                onClick={() => loadScript(record.id)}
              >
                生成话术
              </Button>
            )}
          </Space>
        );
      },
    });
  } else {
    columns.push({
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setDetailCustomerId(record.id);
            setDetailVisible(true);
          }}
        >
          详情
        </Button>
      ),
    });
  }

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>
        <TeamOutlined /> {isExecutionMode ? '运营活动执行' : '客户列表'}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {isExecutionMode
          ? `当前活动：${campaign}，目标客户：${segment}。为每位客户生成「说明 + 建议 + 参考话术」，可一键复制。`
          : '按状态筛选客户，支持搜索；点击详情查看购买记录与生成话术。'}
      </Typography.Paragraph>

      {isExecutionMode && campaignProducts.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Typography.Text strong>活动关联商品</Typography.Text>
          {campaignProducts.map((group) => (
            <div key={group.category} style={{ marginTop: 8 }}>
              <Typography.Text>
                分类：{group.category || '未分类'}（{group.products.length} 款）
              </Typography.Text>
              <div style={{ marginTop: 4 }}>
                {group.products.map((p) => (
                  <Tag key={p.id} color="blue" style={{ marginBottom: 4 }}>
                    {p.spuCode} {p.name} {(p.matchReasons || []).length > 0 && `· ${p.matchReasons.join(' / ')}`}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      {!isExecutionMode && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <span>状态：</span>
            <Select
              value={segmentFilter}
              onChange={setSegmentFilter}
              options={SEGMENT_OPTIONS}
              style={{ width: 120 }}
            />
            <Input.Search
              placeholder="搜索姓名或手机"
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 200 }}
            />
          </Space>
        </Card>
      )}

      <Table
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={isExecutionMode ? executionLoading : listLoading}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
      />
      <Drawer
        title={
          <Space>
            <UserOutlined />
            <span>客户详情</span>
          </Space>
        }
        width={520}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        <CustomerDetailPanel customerId={detailCustomerId} />
      </Drawer>
    </div>
  );
}
