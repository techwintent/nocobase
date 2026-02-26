/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Data Studio page - AI analysis assistant with input and output modules.
 * Layout: 数据导入 -> 变更摘要+AI洞察 -> 数据看板+AI建议
 */

import { useAPIClient } from '@nocobase/client';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Col, Modal, Row, Space, Typography, message } from 'antd';
import React, { useState } from 'react';
import { AIInsightCard } from '../components/AIInsightCard';
import { ChangeLogCard } from '../components/ChangeLogCard';
import { DataImportCard } from '../components/DataImportCard';
import { OverviewStatsCard } from '../components/OverviewStatsCard';
import { SuggestionListCard } from '../components/SuggestionListCard';
import type { ImportResult } from '../../shared/types';

export function DataStudioPage() {
  const api = useAPIClient();
  const [results, setResults] = useState<ImportResult[]>([]);
  const [resetVersion, setResetVersion] = useState(0);
  const [importVersion, setImportVersion] = useState(0);

  const handleImportComplete = (res: ImportResult[]) => {
    setResults(res);
    setImportVersion((v) => v + 1);
  };

  const handleImportStart = () => {
    setResults([]);
  };

  const handleResetData = () => {
    Modal.confirm({
      title: '确认清空所有业务数据？',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content:
        '该操作将清空商品、库存、客户、销售、AI 建议等所有业务数据（保留表结构），操作不可恢复，后续需要重新导入 Excel。',
      okText: '确认清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await api.request({ url: 'wintentData:reset', method: 'post' });
          message.success('已清空所有业务数据，请重新导入 Excel');
          setResults([]);
          setResetVersion((v) => v + 1);
        } catch (e: any) {
          const msg = e?.response?.data?.errors?.[0]?.message || e?.message || '清空失败';
          message.error(msg);
          throw e;
        }
      },
    });
  };

  const refreshKey = `${resetVersion}-${importVersion}`;
  const hasResults = results.length > 0;
  const allInsights = results.flatMap((r) => r.insights ?? []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <Typography.Title level={4} style={{ marginBottom: 8 }}>
            数据工作台 - AI 分析助手
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            上传 xlsx 数据后，系统将自动识别类型、执行智能导入，并基于变更数据生成 AI 洞察。
          </Typography.Paragraph>
        </div>
        <Button danger type="primary" onClick={handleResetData}>
          清空所有业务数据
        </Button>
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <OverviewStatsCard key={refreshKey} />

        <DataImportCard onImportComplete={handleImportComplete} onImportStart={handleImportStart} />

        {hasResults && (
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <ChangeLogCard results={results} />
            </Col>
            <Col xs={24} lg={12}>
              <AIInsightCard insights={allInsights} />
            </Col>
          </Row>
        )}

        <SuggestionListCard key={refreshKey} />
      </Space>
    </div>
  );
}
