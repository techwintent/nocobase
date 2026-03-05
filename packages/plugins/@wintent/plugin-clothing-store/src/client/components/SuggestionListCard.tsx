/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * AI 建议列表 - 4 类建议，支持刷新与跳转
 */

import { useAPIClient } from '@nocobase/client';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Empty, List, message, Space, Spin, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  restock: { label: '补货', color: 'blue' },
  match: { label: '推荐', color: 'green' },
  customer: { label: '回访', color: 'orange' },
  clear: { label: '促销', color: 'red' },
};

export interface SuggestionItem {
  id: number;
  type: string;
  title: string;
  content: string;
  target_id: number;
  target_type: string;
  status: string;
  confidence?: number;
}

export function SuggestionListCard() {
  const api = useAPIClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<SuggestionItem[]>([]);

  const fetchList = useCallback(async () => {
    try {
      const { data } = await api.resource('ai_suggestions').list({
        pageSize: 50,
        sort: ['-id'],
        filter: { status: 'pending' },
      });
      const rows = data?.data ?? data ?? [];
      setList(Array.isArray(rows) ? rows : []);
    } catch (e) {
      message.error('加载建议失败');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleRefreshSuggestions = async () => {
    setRefreshing(true);
    try {
      await api.request({ url: 'wintentSuggestions:refresh', method: 'post' });
      message.success('建议已刷新');
      await fetchList();
    } catch (e: any) {
      message.error(e?.message || '刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card title="AI 智能建议" size="small" extra={<span />}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="AI 智能建议"
      size="small"
      extra={
        <Button
          type="link"
          size="small"
          icon={<ReloadOutlined />}
          loading={refreshing}
          onClick={handleRefreshSuggestions}
        >
          刷新建议
        </Button>
      }
    >
      {list.length === 0 ? (
        <Empty description="暂无建议，点击「刷新建议」生成" />
      ) : (
        <List
          size="small"
          dataSource={list}
          renderItem={(item) => {
            const meta = TYPE_MAP[item.type] || { label: item.type, color: 'default' };
            const handleClick = () => {
              if (item.target_type === 'products') {
                if (item.type === 'restock') {
                  navigate(`/admin/restock-recommendation?productId=${item.target_id}`);
                } else if (item.type === 'clear') {
                  navigate(`/admin/campaign-planner?type=clear&productId=${item.target_id}`);
                } else if (item.type === 'match') {
                  navigate(`/admin/campaign-planner?type=match&productId=${item.target_id}`);
                } else {
                  navigate('/admin/product-list');
                }
              } else if (item.target_type === 'customers') {
                navigate('/admin/customers?campaign=customer&segment=sleeping');
              } else {
                message.info('暂不支持该类型联动');
              }
            };
            return (
              <List.Item
                key={item.id}
                actions={[
                  <Typography.Link key="link" onClick={handleClick}>
                    {item.target_type === 'customers' ? '去回访' : '去处理'}
                  </Typography.Link>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={meta.color}>{meta.label}</Tag>
                      {item.title}
                      {item.confidence != null && (
                        <Typography.Text type="secondary">
                          置信度 {(Number(item.confidence) * 100).toFixed(0)}%
                        </Typography.Text>
                      )}
                    </Space>
                  }
                  description={item.content}
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}
