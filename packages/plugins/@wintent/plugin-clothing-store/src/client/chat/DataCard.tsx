import React from 'react';
import { Statistic, Tag } from 'antd';

export interface DataCardProps {
  type: 'overview' | 'productList' | 'customerList';
  data: any;
}

const cardContainerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid #f0f0f0',
  padding: '16px',
  margin: '8px 0',
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
};

// ---- Overview ----

interface OverviewData {
  totalProducts?: number;
  totalCustomers?: number;
  outOfSizeProducts?: number;
  dormantCustomers?: number;
}

const OverviewCard: React.FC<{ data: OverviewData }> = ({ data }) => {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  };

  const itemStyle: React.CSSProperties = {
    textAlign: 'center',
  };

  const stats = [
    { label: '商品总数', value: data.totalProducts ?? 0 },
    { label: '客户总数', value: data.totalCustomers ?? 0 },
    { label: '断码商品', value: data.outOfSizeProducts ?? 0 },
    { label: '沉睡客户', value: data.dormantCustomers ?? 0 },
  ];

  return (
    <div style={gridStyle}>
      {stats.map((stat) => (
        <div key={stat.label} style={itemStyle}>
          <Statistic
            value={stat.value}
            valueStyle={{ fontSize: '24px', fontWeight: 700, color: '#1677ff' }}
          />
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

// ---- Product List ----

interface Product {
  name?: string;
  spu_code?: string;
  price?: number | string;
  stock?: number | string;
}

const ProductListCard: React.FC<{ data: Product[] }> = ({ data }) => {
  const items = data.slice(0, 5);
  const hasMore = data.length > 5;

  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f5f5f5',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#8c8c8c',
    minWidth: '40px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'rgba(0, 0, 0, 0.88)',
    fontWeight: 500,
  };

  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'rgba(0,0,0,0.88)' }}>
        商品列表
      </div>
      <div style={listStyle}>
        {items.map((product, index) => (
          <div key={product.spu_code ?? index} style={itemStyle}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(0,0,0,0.88)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.name ?? '未知商品'}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={labelStyle}>货号:</span>
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{product.spu_code ?? '-'}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ ...valueStyle, color: '#1677ff' }}>¥{product.price ?? '-'}</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>库存: {product.stock ?? '-'}</div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <span style={{ fontSize: '13px', color: '#1677ff', cursor: 'pointer' }}>
            查看更多 ({data.length - 5} 条)
          </span>
        </div>
      )}
    </div>
  );
};

// ---- Customer List ----

interface Customer {
  name?: string;
  phone?: string;
  vip_level?: string | number;
  last_purchase_date?: string;
}

const VIP_LEVEL_COLORS: Record<string, string> = {
  '普通': 'default',
  '银卡': 'silver',
  '金卡': 'gold',
  '钻石': 'blue',
};

const CustomerListCard: React.FC<{ data: Customer[] }> = ({ data }) => {
  const items = data.slice(0, 5);

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f5f5f5',
  };

  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'rgba(0,0,0,0.88)' }}>
        客户列表
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((customer, index) => {
          const level = String(customer.vip_level ?? '普通');
          const tagColor = VIP_LEVEL_COLORS[level] ?? 'default';
          return (
            <div key={customer.phone ?? index} style={itemStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(0,0,0,0.88)' }}>
                    {customer.name ?? '未知客户'}
                  </span>
                  <Tag color={tagColor} style={{ fontSize: '11px', lineHeight: '18px', padding: '0 6px' }}>
                    {level}
                  </Tag>
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  {customer.phone ?? '-'}
                </div>
              </div>
              <div style={{ flexShrink: 0, marginLeft: '12px', textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#8c8c8c' }}>最近消费</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.65)' }}>
                  {customer.last_purchase_date ?? '-'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Main DataCard ----

export const DataCard: React.FC<DataCardProps> = ({ type, data }) => {
  const renderContent = () => {
    if (!data) {
      return <div style={{ fontSize: '13px', color: '#8c8c8c' }}>暂无数据</div>;
    }

    switch (type) {
      case 'overview':
        return <OverviewCard data={data} />;
      case 'productList':
        return <ProductListCard data={Array.isArray(data) ? data : []} />;
      case 'customerList':
        return <CustomerListCard data={Array.isArray(data) ? data : []} />;
      default:
        return <div style={{ fontSize: '13px', color: '#8c8c8c' }}>未知数据类型</div>;
    }
  };

  return <div style={cardContainerStyle}>{renderContent()}</div>;
};

export default DataCard;
