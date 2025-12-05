#!/bin/bash

# Wintent 插件和配置导出脚本
# 不依赖运行中的容器，只导出必要文件

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "  导出 Wintent 插件和配置"
echo "================================================"
echo ""

# 检查当前目录
if [ ! -f "docker-compose.yml" ]; then
    echo "错误: 请在 docker/app-wintent 目录下运行此脚本"
    exit 1
fi

# 输出目录
OUTPUT_DIR="wintent-package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "步骤 1: 创建导出目录..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
echo -e "${GREEN}✓ 导出目录已创建${NC}"

echo ""
echo "步骤 2: 复制 Docker 配置..."
cp docker-compose.yml "$OUTPUT_DIR/"
cp env.example "$OUTPUT_DIR/"
cp apply-config-from-host.sh "$OUTPUT_DIR/"
cp README-部署.txt "$OUTPUT_DIR/" 2>/dev/null || true
cp -r init-files "$OUTPUT_DIR/"
echo -e "${GREEN}✓ Docker 配置已复制${NC}"

echo ""
echo "步骤 3: 复制 Wintent 插件..."
if [ -d "../../packages/plugins/@wintent" ]; then
    mkdir -p "$OUTPUT_DIR/wintent-plugin"
    cp -r ../../packages/plugins/@wintent "$OUTPUT_DIR/wintent-plugin/"
    echo -e "${GREEN}✓ Wintent 插件已复制${NC}"
    du -sh "$OUTPUT_DIR/wintent-plugin"
else
    echo -e "${YELLOW}⚠️  未找到 Wintent 插件，请先运行 yarn build @wintent/plugin-config --no-dts${NC}"
fi

echo ""
echo "步骤 4: 创建服务器部署脚本..."
cat > "$OUTPUT_DIR/deploy.sh" << 'DEPLOY_SCRIPT'
#!/bin/bash

# Wintent 服务器部署脚本（插件方案）

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "  Wintent NocoBase 服务器部署"
echo "================================================"
echo ""

echo "步骤 1: 检查 Docker..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装"
    exit 1
fi
echo -e "${GREEN}✓ Docker 环境正常${NC}"

echo ""
echo "步骤 2: 创建环境配置..."
if [ ! -f ".env" ]; then
    cp env.example .env
    echo -e "${GREEN}✓ .env 已创建${NC}"
    echo -e "${YELLOW}⚠️  请检查并修改 .env 中的密钥！${NC}"
else
    echo -e "${GREEN}✓ .env 已存在${NC}"
fi

echo ""
echo "步骤 3: 安装 Wintent 插件..."
if [ -d "wintent-plugin/@wintent" ]; then
    echo "复制 Wintent 插件到 NocoBase..."
    # 插件会在容器启动时自动挂载
    echo -e "${GREEN}✓ Wintent 插件已准备${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 Wintent 插件${NC}"
fi

echo ""
echo "步骤 4: 启动 Docker 容器..."
docker-compose up -d
echo -e "${GREEN}✓ 容器已启动${NC}"

echo ""
echo "步骤 5: 等待 NocoBase 初始化（3 分钟）..."
echo "查看日志: docker-compose logs -f app"
echo ""
for i in {1..180}; do
    if docker-compose logs app 2>&1 | grep -q "Application started"; then
        echo ""
        echo -e "${GREEN}✓ NocoBase 已启动${NC}"
        break
    fi
    echo -n "."
    sleep 1
    if [ $((i % 30)) -eq 0 ]; then
        echo " $i 秒"
    fi
done
echo ""

echo ""
echo "步骤 6: 应用 Wintent 配置..."
if [ -f "apply-config-from-host.sh" ]; then
    ./apply-config-from-host.sh
else
    echo -e "${YELLOW}⚠️  配置脚本不存在，请手动配置${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}  🎉 部署完成！${NC}"
echo "================================================"
echo ""
echo "访问: http://your-server-ip:13000"
echo "登录: admin@wintent.tech / admin123"
echo ""
echo "如果 Logo 或主题未显示，刷新浏览器: Ctrl+Shift+R"
echo ""
DEPLOY_SCRIPT

chmod +x "$OUTPUT_DIR/deploy.sh"
echo -e "${GREEN}✓ 部署脚本已创建${NC}"

echo ""
echo "步骤 5: 创建使用说明..."
cat > "$OUTPUT_DIR/README.txt" << 'README'
====================================================
  Wintent NocoBase 部署包（插件方案）
====================================================

📦 包含内容

  - docker-compose.yml            Docker 配置
  - apply-config-from-host.sh     Wintent 配置脚本
  - wintent-plugin/@wintent/      Wintent 插件 ⭐
  - init-files/wintent-logo.png   Logo 文件
  - deploy.sh                     一键部署脚本 ⭐

====================================================

🚀 部署步骤

1. 解压
   tar -xzf wintent-package-*.tar.gz
   cd wintent-package

2. 修改配置（可选）
   vi .env

3. 部署
   ./deploy.sh

4. 访问
   http://your-server-ip:13000
   admin@wintent.tech / admin123

====================================================

✨ 特性

  ✓ 使用官方 Docker 镜像
  ✓ 包含 Wintent 插件（CSS 修改）
  ✓ 自动应用品牌配置
  ✓ 部署包小巧（约 1MB）

====================================================
README

echo -e "${GREEN}✓ 使用说明已创建${NC}"

echo ""
echo "步骤 6: 更新 docker-compose.yml 挂载插件..."
# 在 docker-compose.yml 中添加插件挂载
cat > "$OUTPUT_DIR/docker-compose.yml" << 'COMPOSE'
version: "3"

networks:
  wintent:
    driver: bridge

services:
  app:
    image: nocobase/nocobase:2.0.0-alpha.49
    platform: linux/amd64
    container_name: wintent-app
    networks:
      - wintent
    environment:
      - APP_ENV=production
      - APP_KEY=wintent-docker-secure-key-change-in-production
      - ENCRYPTION_FIELD_KEY=wintent-encryption-key-change-in-production
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=wintent
      - DB_USER=wintent
      - DB_PASSWORD=wintent
      - DB_TIMEZONE=+08:00
      - INIT_ROOT_EMAIL=admin@wintent.tech
      - INIT_ROOT_PASSWORD=admin123
      - INIT_ROOT_NICKNAME=Wintent Admin
      - INIT_ROOT_USERNAME=admin
      - INIT_APP_LANG=zh-CN
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
      - ./wintent-plugin/@wintent:/app/nocobase/packages/plugins/@wintent:ro
    ports:
      - "13000:80"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    init: true

  postgres:
    image: postgres:14
    platform: linux/amd64
    container_name: wintent-postgres
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: wintent
      POSTGRES_DB: wintent
      POSTGRES_PASSWORD: wintent
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - wintent
    ports:
      - "15432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wintent -d wintent"]
      interval: 10s
      timeout: 5s
      retries: 5
COMPOSE

echo -e "${GREEN}✓ docker-compose.yml 已更新（包含插件挂载）${NC}"

echo ""
echo "步骤 7: 打包所有文件..."
PACKAGE_NAME="wintent-package-${TIMESTAMP}.tar.gz"
tar --format=ustar --exclude='._*' --exclude='.DS_Store' -czf "../$PACKAGE_NAME" "$OUTPUT_DIR"

PACKAGE_SIZE=$(ls -lh "../$PACKAGE_NAME" | awk '{print $5}')
echo -e "${GREEN}✓ 打包完成${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}  🎉 导出完成！${NC}"
echo "================================================"
echo ""
echo "📦 导出包信息:"
echo "  文件: $(cd .. && pwd)/$PACKAGE_NAME"
echo "  大小: $PACKAGE_SIZE"
echo ""
echo "📤 上传到服务器:"
echo "  cd .."
echo "  scp $PACKAGE_NAME user@server:/path/to/"
echo ""
echo "📥 在服务器上部署:"
echo "  tar -xzf $PACKAGE_NAME"
echo "  cd $OUTPUT_DIR"
echo "  ./deploy.sh"
echo ""
echo "🌐 访问地址:"
echo "  http://your-server-ip:13000"
echo ""
echo "📋 登录信息:"
echo "  邮箱: admin@wintent.tech"
echo "  密码: admin123"
echo ""
echo "⚠️  生产环境记得修改 .env 中的密钥和密码！"
echo ""

