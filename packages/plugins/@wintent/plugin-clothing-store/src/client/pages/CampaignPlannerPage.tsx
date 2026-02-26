/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 库存模块 - 运营活动策划
 * 活动类型选择、商品/客户筛选、预览匹配结果、跳转客户模块执行
 */

import { useAPIClient } from '@nocobase/client';
import { TeamOutlined, BulbOutlined } from '@ant-design/icons';
import { Button, Card, Collapse, Form, InputNumber, Select, Space, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

const CAMPAIGN_TYPES = [
  { value: 'clear', label: '断码促销' },
  { value: 'match', label: '上新推荐' },
  { value: 'customer', label: '客户回访' },
];

const CUSTOMER_SEGMENTS = [
  { value: 'all', label: '全部客户' },
  { value: 'active', label: '活跃客户（30天内）' },
  { value: 'sleeping', label: '沉睡客户（30-60天）' },
  { value: 'churn', label: '流失客户（60天+）' },
];

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

export function CampaignPlannerPage() {
  const api = useAPIClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const typeFromUrl = searchParams.get('type') as 'clear' | 'match' | 'customer' | null;
  const productIdFromUrl = searchParams.get('productId');

  const [preview, setPreview] = useState<{
    customerCount: number;
    productCount: number;
    productsByCategory: ProductCategoryGroup[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeFromUrl) form.setFieldValue('type', typeFromUrl);
    if (productIdFromUrl) form.setFieldValue('productId', Number(productIdFromUrl) || undefined);
  }, [typeFromUrl, productIdFromUrl, form]);

  const runPreview = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setLoading(true);
    try {
      const res = await api.request({
        url: 'wintentCampaigns:preview',
        method: 'post',
        data: {
          type: values.type ?? 'clear',
          productIds: values.productId != null ? [Number(values.productId)] : undefined,
          customerSegment: values.customerSegment ?? 'all',
        },
      });
      const raw = res?.data;
      const data = (raw?.data ?? raw ?? {}) as {
        customerCount?: number;
        productCount?: number;
        productsByCategory?: ProductCategoryGroup[];
      };
      setPreview({
        customerCount: data.customerCount ?? 0,
        productCount: data.productCount ?? 0,
        productsByCategory: data.productsByCategory ?? [],
      });
    } catch (e) {
      console.error(e);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const goExecute = () => {
    const type = form.getFieldValue('type') || 'clear';
    const segment = form.getFieldValue('customerSegment') || 'all';
    const productIds = preview?.productsByCategory?.flatMap((g) => g.products.map((p) => p.id)) ?? [];
    const uniqueIds = Array.from(new Set(productIds)).filter((id) => !!id);
    const query = new URLSearchParams({
      campaign: type,
      segment,
    });
    if (uniqueIds.length > 0) {
      query.set('productIds', uniqueIds.join(','));
    }
    navigate(`/admin/customers?${query.toString()}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>
        <BulbOutlined /> 运营活动策划
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        选择活动类型与客户群体，预览匹配人数后跳转客户模块执行。
      </Typography.Paragraph>

      <Card size="small" style={{ maxWidth: 560, marginBottom: 24 }}>
        <Form form={form} layout="vertical" initialValues={{ type: 'clear', customerSegment: 'all' }}>
          <Form.Item name="type" label="活动类型" rules={[{ required: true }]}>
            <Select options={CAMPAIGN_TYPES} placeholder="选择活动类型" />
          </Form.Item>
          <Form.Item name="customerSegment" label="目标客户">
            <Select options={CUSTOMER_SEGMENTS} />
          </Form.Item>
          <Form.Item name="productId" label="指定商品 ID（可选）" help="不填则按活动类型自动选商品">
            <InputNumber style={{ width: '100%' }} placeholder="如 1 或留空" min={1} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={runPreview} loading={loading}>
                预览匹配结果
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {preview !== null && (
        <Card size="small" title="预览结果" style={{ maxWidth: 800, marginBottom: 24 }}>
          <p>
            匹配商品数：<strong>{preview.productCount}</strong>
          </p>
          <p>
            匹配客户数：<strong>{preview.customerCount}</strong>
          </p>
          <Button type="primary" icon={<TeamOutlined />} onClick={goExecute} style={{ marginTop: 8, marginBottom: 12 }}>
            去客户模块执行
          </Button>

          {preview.productsByCategory && preview.productsByCategory.length > 0 && (
            <Collapse style={{ marginTop: 8 }}>
              {preview.productsByCategory.map((group) => (
                <Collapse.Panel
                  header={`${group.category || '未分类'}（${group.products.length} 款）`}
                  key={group.category || 'unknown'}
                >
                  {group.products.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 0',
                        borderBottom: '1px dashed #f0f0f0',
                      }}
                    >
                      <div>
                        <Typography.Text strong>{p.spuCode}</Typography.Text>
                        <Typography.Text style={{ marginLeft: 8 }}>{p.name}</Typography.Text>
                        {p.style && (
                          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                            风格：{p.style}
                          </Typography.Text>
                        )}
                        {p.season && (
                          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                            季节：{p.season}
                          </Typography.Text>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>
                          <Typography.Text type="secondary">价格：</Typography.Text>
                          <Typography.Text>¥{(p.price ?? 0).toFixed(0)}</Typography.Text>
                          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                            库存：{p.totalStock ?? 0}
                          </Typography.Text>
                        </div>
                        <div style={{ marginTop: 4 }}>
                          {(p.matchReasons || []).map((reason) => (
                            <Tag key={reason} color="blue" style={{ marginBottom: 2 }}>
                              {reason}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </Collapse.Panel>
              ))}
            </Collapse>
          )}
        </Card>
      )}
    </div>
  );
}
