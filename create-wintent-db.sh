#!/bin/bash

# 创建 Wintent 数据库脚本（macOS 版本）
# 适用于通过 Homebrew 安装的 PostgreSQL

set -e

echo "================================================"
echo "  创建 Wintent 数据库"
echo "================================================"
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 获取当前系统用户
CURRENT_USER=$(whoami)
echo "当前系统用户: $CURRENT_USER"
echo ""

# 检查 PostgreSQL 是否运行
echo "检查 PostgreSQL 状态..."
if ! psql -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}PostgreSQL 未运行或无法连接${NC}"
    echo ""
    echo "尝试启动 PostgreSQL："
    echo "  brew services start postgresql@14"
    echo "或"
    echo "  brew services start postgresql"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL 运行正常${NC}"
echo ""

# 检查数据库是否已存在
echo "检查数据库 'wintent' 是否存在..."
if psql -lqt | cut -d \| -f 1 | grep -qw wintent; then
    echo -e "${YELLOW}数据库 'wintent' 已存在${NC}"
    read -p "是否要删除并重建？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "删除数据库 'wintent'..."
        psql -d postgres -c "DROP DATABASE IF EXISTS wintent;"
        echo -e "${GREEN}✓ 数据库已删除${NC}"
    else
        echo "保留现有数据库"
    fi
fi

# 创建数据库
echo ""
echo "创建数据库 'wintent'..."
psql -d postgres << EOF
-- 创建数据库
CREATE DATABASE wintent;

-- 创建用户（如果不存在）
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'wintent') THEN
    CREATE USER wintent WITH PASSWORD 'wintent';
  END IF;
END
\$\$;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE wintent TO wintent;

-- 连接到 wintent 数据库
\c wintent

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO wintent;

-- 授予默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wintent;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wintent;

EOF

echo -e "${GREEN}✓ 数据库创建成功${NC}"
echo ""

# 验证
echo "验证数据库配置..."
if psql -U wintent -d wintent -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 用户 'wintent' 可以访问数据库 'wintent'${NC}"
else
    echo -e "${RED}✗ 数据库配置有问题${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}  数据库创建完成！${NC}"
echo "================================================"
echo ""
echo "数据库信息："
echo "  - 数据库名: wintent"
echo "  - 用户名: wintent"
echo "  - 密码: wintent"
echo "  - 主机: localhost"
echo "  - 端口: 5432"
echo ""
echo "测试连接："
echo "  psql -U wintent -d wintent -c 'SELECT version();'"
echo ""

