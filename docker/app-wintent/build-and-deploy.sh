#!/bin/bash

# Wintent NocoBase Docker 构建和部署脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Wintent NocoBase Docker 构建和部署${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查是否在正确的目录
if [ ! -f "../../package.json" ]; then
    echo -e "${YELLOW}错误: 请在 docker/app-wintent 目录下运行此脚本${NC}"
    exit 1
fi

# 步骤 1: 构建 Docker 镜像
echo -e "${GREEN}步骤 1: 构建 Wintent 定制 Docker 镜像...${NC}"
echo "----------------------------------------"
docker build -t wintent/nocobase:2.0.0-alpha.49-wintent \
    -f Dockerfile.wintent \
    ../../

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}镜像构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 镜像构建完成${NC}"
echo ""

# 步骤 2: 停止现有容器
echo -e "${GREEN}步骤 2: 停止现有容器...${NC}"
echo "----------------------------------------"
docker-compose -f docker-compose.wintent.yml down
echo -e "${GREEN}✓ 容器已停止${NC}"
echo ""

# 步骤 3: 启动新容器
echo -e "${GREEN}步骤 3: 启动 Wintent NocoBase...${NC}"
echo "----------------------------------------"
docker-compose -f docker-compose.wintent.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}容器启动失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 容器已启动${NC}"
echo ""

# 步骤 4: 查看日志
echo -e "${GREEN}步骤 4: 等待服务启动...${NC}"
echo "----------------------------------------"
echo "查看启动日志（Ctrl+C 退出日志查看）："
echo ""
docker-compose -f docker-compose.wintent.yml logs -f app

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}  ✅ Wintent NocoBase 部署完成！${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "🌐 访问地址: http://localhost:13000"
echo "👤 管理员账号: admin@wintent.tech"
echo "🔑 默认密码: admin123"
echo ""
echo "📝 其他命令："
echo "  查看日志: docker-compose -f docker-compose.wintent.yml logs -f"
echo "  停止服务: docker-compose -f docker-compose.wintent.yml down"
echo "  重启服务: docker-compose -f docker-compose.wintent.yml restart"
echo ""

