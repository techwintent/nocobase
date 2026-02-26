/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Data import card - batch upload with auto type detection.
 */

import { useAPIClient } from '@nocobase/client';
import { InboxOutlined } from '@ant-design/icons';
import { Button, Card, message, Space, Spin, Upload } from 'antd';
import React, { useState } from 'react';
import type { ImportResult } from '../../shared/types';

export interface DataImportCardProps {
  onImportComplete?: (results: ImportResult[]) => void;
  onImportStart?: () => void;
}

export function DataImportCard({ onImportComplete, onImportStart }: DataImportCardProps) {
  const api = useAPIClient();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  const handleUpload = async () => {
    const files = fileList.map((f) => f.originFileObj).filter(Boolean);
    if (!files.length) {
      message.warning('请先选择 xlsx 文件');
      return;
    }

    setLoading(true);
    setProgress(null);
    onImportStart?.();
    const results: ImportResult[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length, fileName: file.name });
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.axios.post('clothingImport:upload', formData, {
          timeout: 60000,
        });

        const result = (data?.data ?? data) as ImportResult;
        if (!result.changes) result.changes = [];
        if (!result.insights) result.insights = [];
        result.fileName = file.name;
        results.push(result);
      }
      onImportComplete?.(results);
      message.success(`导入完成，共 ${results.length} 个文件`);
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0]?.message || err?.message || '导入失败';
      message.error(msg);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const clearFiles = () => {
    setFileList([]);
  };

  const removeFile = (file: any) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  return (
    <Card title="数据输入" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Upload.Dragger
          accept=".xlsx,.xls"
          multiple
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList((prev) => [
              ...prev,
              {
                uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: file.name,
                status: 'done',
                originFileObj: file,
              },
            ]);
            return false;
          }}
          onRemove={removeFile}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽 xlsx 文件到此区域（支持多选）</p>
          <p className="ant-upload-hint">支持商品、库存、客户、销售单，系统将根据表头自动识别</p>
        </Upload.Dragger>

        <Space>
          <Button type="primary" onClick={handleUpload} loading={loading} disabled={!fileList.length}>
            开始导入
          </Button>
          <Button onClick={clearFiles} disabled={!fileList.length}>
            清空
          </Button>
        </Space>

        {(loading || progress) && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin />
            <div style={{ marginTop: 8 }}>
              {progress ? `正在导入 ${progress.current}/${progress.total}：${progress.fileName}` : '正在导入，请稍候…'}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
}
