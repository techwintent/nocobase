/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 经营概览 - 商品与客户统计
 */

import { useAPIClient } from '@nocobase/client';
import { AppstoreOutlined, TeamOutlined } from '@ant-design/icons';
import { Card, Col, Row, Spin, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface OverviewStats {
  product: { total: number; outOfSize: number; new: number; slow: number };
  customer: { total: number; active: number; sleeping: number; churn: number };
  trend?: { date: string; salesQty: number; customerCount: number }[];
}

export function OverviewStatsCard() {
  const api = useAPIClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.request({ url: 'wintentOverview:stats' });
        const raw = res?.data;
        const stats = (raw?.data ?? raw ?? {}) as OverviewStats;
        if (process.env.NODE_ENV !== 'production' && (!stats?.product || !stats?.customer)) {
          console.warn('[经营概览] 响应格式异常，res.data:', res?.data);
        }
        if (!cancelled) {
          setData(stats?.product && stats?.customer ? stats : null);
          setError(stats?.product && stats?.customer ? null : '数据格式异常，请检查控制台日志');
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || '加载失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) {
    return (
      <Card title="经营概览" size="small">
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      </Card>
    );
  }
  if (error || !data) {
    return (
      <Card title="经营概览" size="small">
        <div style={{ color: '#cf1322', padding: 16 }}>{error || '无数据'}</div>
      </Card>
    );
  }

  const product = data.product ?? { total: 0, outOfSize: 0, new: 0, slow: 0 };
  const customer = data.customer ?? { total: 0, active: 0, sleeping: 0, churn: 0 };
  return (
    <Card title="经营概览" size="small">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 8, color: '#666' }}>
            <AppstoreOutlined /> 商品
          </div>
          <Row gutter={16}>
            <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/product-list')}>
              <Statistic title="总数" value={product.total ?? 0} />
            </Col>
            <Col
              span={6}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/admin/product-list?status=outOfSize')}
            >
              <Statistic title="断码" value={product.outOfSize ?? 0} />
            </Col>
            <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/product-list?status=new')}>
              <Statistic title="新品" value={product.new ?? 0} />
            </Col>
            <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/product-list?status=slow')}>
              <Statistic title="滞销" value={product.slow ?? 0} />
            </Col>
          </Row>
        </Col>
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 8, color: '#666' }}>
            <TeamOutlined /> 客户
          </div>
          <Row gutter={16}>
            <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/customers')}>
              <Statistic title="总数" value={customer.total ?? 0} />
            </Col>
            <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/customers?segment=active')}>
              <Statistic title="活跃" value={customer.active ?? 0} />
            </Col>
            <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/customers?segment=sleeping')}>
              <Statistic title="沉睡" value={customer.sleeping ?? 0} />
            </Col>
            <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/customers?segment=churn')}>
              <Statistic title="流失" value={customer.churn ?? 0} />
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
}
