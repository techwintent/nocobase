/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * AI insight card - rule-based insights + LLM placeholder.
 */

import { RobotOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, message, Space, Typography } from 'antd';
import React from 'react';
import type { Insight } from '../../shared/types';

const CATEGORY_LABELS: Record<string, string> = {
  inventory: '库存',
  price: '价格',
  customer: '客户',
  sales: '销售',
};

export interface AIInsightCardProps {
  insights: Insight[];
  loading?: boolean;
  onRequestAnalysis?: () => void;
}

export function AIInsightCard({ insights, loading, onRequestAnalysis }: AIInsightCardProps) {
  if (loading) {
    return (
      <Card title="AI 洞察" size="small">
        <Empty description="正在分析…" />
      </Card>
    );
  }

  const hasInsights = insights?.length > 0;

  return (
    <Card
      title="AI 洞察"
      size="small"
      extra={
        <Button
          type="link"
          icon={<RobotOutlined />}
          size="small"
          onClick={() => {
            onRequestAnalysis?.();
            if (!onRequestAnalysis) {
              message.info('AI 深度分析即将上线');
            }
          }}
        >
          AI 深度分析
        </Button>
      }
    >
      {!hasInsights ? (
        <Empty description="导入数据后 AI 将自动分析并生成洞察" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {insights.map((insight, idx) => (
            <Alert
              key={`${insight.category}-${idx}`}
              type={insight.level === 'danger' ? 'error' : insight.level}
              showIcon
              message={
                <Space>
                  <Typography.Text strong>{insight.title}</Typography.Text>
                  <Typography.Text type="secondary">
                    [{CATEGORY_LABELS[insight.category] ?? insight.category}]
                  </Typography.Text>
                </Space>
              }
              description={insight.description}
            />
          ))}
        </Space>
      )}
    </Card>
  );
}
