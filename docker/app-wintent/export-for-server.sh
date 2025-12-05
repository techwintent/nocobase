#!/bin/bash

# Wintent Docker 导出脚本
# 在本地配置完成后，导出镜像和数据，用于服务器部署

set -e

echo "================================================"
echo "  导出 Wintent Docker 配置"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查当前目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 请在 docker/app-wintent 目录下运行此脚本${NC}"
    exit 1
fi

# 输出目录
OUTPUT_DIR="wintent-docker-package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "步骤 1: 检查容器状态..."
echo "----------------------------------------"

if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}✗ 容器未运行${NC}"
    echo "请先启动容器并完成配置："
    echo "  ./start.sh"
    exit 1
fi

echo -e "${GREEN}✓ 容器正在运行${NC}"

echo ""
echo "步骤 2: 验证 Wintent 配置..."
echo "----------------------------------------"

# 检查配置是否正确
CONFIG_CHECK=$(docker-compose exec -T postgres psql -U wintent -d wintent -t -c "SELECT title FROM \"systemSettings\" WHERE id = 1;")

if echo "$CONFIG_CHECK" | grep -q "Wintent"; then
    echo -e "${GREEN}✓ Wintent 配置已应用${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到 Wintent 配置，是否继续？${NC}"
    read -p "继续导出？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消"
        exit 1
    fi
fi

echo ""
echo "步骤 3: 创建导出目录..."
echo "----------------------------------------"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
echo -e "${GREEN}✓ 导出目录已创建: $OUTPUT_DIR/${NC}"

echo ""
echo "步骤 2: 复制配置文件..."
echo "----------------------------------------"

cp docker-compose.yml "$OUTPUT_DIR/"
cp env.example "$OUTPUT_DIR/"
cp apply-config-from-host.sh "$OUTPUT_DIR/"
cp server-update.sh "$OUTPUT_DIR/" 2>/dev/null || true
cp README.md "$OUTPUT_DIR/"
cp QUICKSTART.md "$OUTPUT_DIR/"
cp README-部署.txt "$OUTPUT_DIR/" 2>/dev/null || true
cp -r init-files "$OUTPUT_DIR/"

echo -e "${GREEN}✓ 配置文件已复制${NC}"

echo ""
echo "步骤 3: 打包 Wintent 插件..."
echo "----------------------------------------"

# 复制 Wintent 插件到导出目录
if [ -d "../../packages/plugins/@wintent" ]; then
    echo "复制 Wintent 插件..."
    mkdir -p "$OUTPUT_DIR/wintent-plugin"
    cp -r ../../packages/plugins/@wintent "$OUTPUT_DIR/wintent-plugin/"
    echo -e "${GREEN}✓ Wintent 插件已复制${NC}"
    du -sh "$OUTPUT_DIR/wintent-plugin"
else
    echo -e "${YELLOW}⚠️  未找到 Wintent 插件${NC}"
fi

echo ""
echo "步骤 4: 打包 storage 数据..."
echo "----------------------------------------"

if [ -d "storage" ]; then
    echo "正在压缩 storage 目录..."
    # 使用兼容格式，排除 macOS 扩展属性和数据库文件
    tar --format=ustar \
        --exclude='._*' \
        --exclude='.DS_Store' \
        --exclude='storage/db/postgres' \
        --exclude='storage/db/nocobase.sqlite' \
        -czf "$OUTPUT_DIR/storage-data.tar.gz" storage/
    echo -e "${GREEN}✓ 数据已打包${NC}"
    ls -lh "$OUTPUT_DIR/storage-data.tar.gz"
else
    echo -e "${YELLOW}⚠️  storage 目录不存在${NC}"
fi

echo ""
echo "步骤 5: 跳过镜像导出（使用官方镜像）..."
echo "----------------------------------------"

# 检测架构
ARCH=$(uname -m)
echo "检测到架构: $ARCH"

if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    echo -e "${YELLOW}⚠️  检测到 ARM64 架构（Apple Silicon）${NC}"
    echo -e "${YELLOW}   镜像将不会导出，服务器将从网络拉取适配的镜像${NC}"
    echo -e "${GREEN}✓ 跳过镜像导出（服务器将自动拉取）${NC}"
else
    echo "正在保存 NocoBase 镜像..."
    docker save nocobase/nocobase:2.0.0-alpha.49 | gzip > "$OUTPUT_DIR/nocobase-image.tar.gz"
    echo -e "${GREEN}✓ NocoBase 镜像已保存${NC}"

    echo "正在保存 PostgreSQL 镜像..."
    docker save postgres:14 | gzip > "$OUTPUT_DIR/postgres-image.tar.gz"
    echo -e "${GREEN}✓ PostgreSQL 镜像已保存${NC}"
fi

echo ""
echo "步骤 6: 创建服务器端启动脚本..."
echo "----------------------------------------"

cat > "$OUTPUT_DIR/server-deploy.sh" << 'DEPLOY_SCRIPT'
#!/bin/bash

# Wintent 服务器部署脚本
# 在服务器上运行此脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "  Wintent NocoBase 服务器部署"
echo "================================================"
echo ""

echo "步骤 1: 加载 Docker 镜像..."
echo "----------------------------------------"

if [ -f "nocobase-image.tar.gz" ]; then
    echo "加载 NocoBase 镜像..."
    docker load < nocobase-image.tar.gz
    echo -e "${GREEN}✓ NocoBase 镜像已加载${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 nocobase-image.tar.gz，将从网络拉取${NC}"
fi

if [ -f "postgres-image.tar.gz" ]; then
    echo "加载 PostgreSQL 镜像..."
    docker load < postgres-image.tar.gz
    echo -e "${GREEN}✓ PostgreSQL 镜像已加载${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 postgres-image.tar.gz，将从网络拉取${NC}"
fi

echo ""
echo "步骤 2: 解压数据..."
echo "----------------------------------------"

if [ -f "wintent-data.tar.gz" ]; then
    echo "解压 Wintent 数据和插件..."
    # 忽略 macOS 扩展属性警告
    tar -xzf wintent-data.tar.gz 2>/dev/null || tar -xzf wintent-data.tar.gz
    echo -e "${GREEN}✓ 数据和插件已解压${NC}"
elif [ -f "storage-data.tar.gz" ]; then
    echo "解压 storage 数据..."
    tar -xzf storage-data.tar.gz 2>/dev/null || tar -xzf storage-data.tar.gz
    echo -e "${GREEN}✓ 数据已解压${NC}"
else
    echo -e "${YELLOW}⚠️  未找到数据包，将创建新的环境${NC}"
fi

echo ""
echo "步骤 3: 创建环境变量文件..."
echo "----------------------------------------"

if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${GREEN}✓ .env 文件已创建${NC}"
        echo -e "${YELLOW}⚠️  请检查 .env 文件并修改密钥！${NC}"
    fi
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi

echo ""
echo "步骤 4: 启动服务..."
echo "----------------------------------------"

docker-compose up -d

echo -e "${GREEN}✓ 服务已启动${NC}"

echo ""
echo "步骤 5: 等待服务就绪..."
echo "----------------------------------------"

echo "等待容器启动（约 1-2 分钟）..."
sleep 60

echo ""
echo "================================================"
echo -e "${GREEN}  🎉 Wintent 部署完成！${NC}"
echo "================================================"
echo ""
echo "✅ 访问地址: http://localhost:13000"
echo "✅ 管理员: admin@wintent.tech / admin123"
echo ""
echo "🔧 常用命令:"
echo "  docker-compose logs -f    # 查看日志"
echo "  docker-compose ps         # 查看状态"
echo "  docker-compose restart    # 重启服务"
echo ""
echo "⚠️  生产环境请修改 .env 中的密钥！"
echo ""
DEPLOY_SCRIPT

chmod +x "$OUTPUT_DIR/server-deploy.sh"
echo -e "${GREEN}✓ 服务器部署脚本已创建${NC}"

echo ""
echo "步骤 7: 创建使用说明..."
echo "----------------------------------------"

cat > "$OUTPUT_DIR/部署说明.txt" << 'INSTRUCTIONS'
====================================================
  Wintent NocoBase 服务器部署包
====================================================

📦 包含内容：
  - Docker 镜像（NocoBase + PostgreSQL）
  - 已配置的数据（包含 Wintent 品牌）
  - Docker Compose 配置
  - 环境变量示例
  - 部署脚本

====================================================

🚀 部署步骤：

1. 上传到服务器
   scp wintent-docker-package.tar.gz user@server:/path/to/

2. 在服务器上解压
   tar -xzf wintent-docker-package.tar.gz
   cd wintent-docker-package

3. 运行部署脚本
   ./server-deploy.sh

4. 访问系统
   http://your-server-ip:13000
   登录：admin@wintent.tech / admin123

====================================================

⚠️  生产环境注意：

1. 修改 .env 中的密钥
   - APP_KEY
   - ENCRYPTION_FIELD_KEY
   - DB_PASSWORD

2. 修改管理员密码
   首次登录后立即修改

3. 配置防火墙
   开放端口 13000

4. 配置域名（可选）
   使用 Nginx 反向代理

====================================================

🔧 常用命令：

docker-compose logs -f       # 查看日志
docker-compose ps            # 查看状态
docker-compose restart       # 重启
docker-compose stop          # 停止
docker-compose start         # 启动

====================================================
INSTRUCTIONS

echo -e "${GREEN}✓ 使用说明已创建${NC}"

echo ""
echo "步骤 8: 打包所有文件..."
echo "----------------------------------------"

PACKAGE_NAME="wintent-docker-package-${TIMESTAMP}.tar.gz"

echo "正在打包..."
# 使用兼容格式，排除 macOS 扩展属性
tar --format=ustar --exclude='._*' --exclude='.DS_Store' -czf "../$PACKAGE_NAME" "$OUTPUT_DIR"

PACKAGE_SIZE=$(ls -lh "../$PACKAGE_NAME" | awk '{print $5}')
echo -e "${GREEN}✓ 打包完成${NC}"
echo "  文件名: $PACKAGE_NAME"
echo "  大小: $PACKAGE_SIZE"

# 重新启动容器
echo ""
echo "步骤 9: 完成..."
echo "----------------------------------------"

echo -e "${GREEN}✓ 导出完成${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}  🎉 导出完成！${NC}"
echo "================================================"
echo ""
echo "📦 导出包位置:"
echo "  $(cd .. && pwd)/$PACKAGE_NAME"
echo "  大小: $PACKAGE_SIZE"
echo ""
echo "📤 上传到服务器:"
echo "  cd .."
echo "  scp $PACKAGE_NAME user@server:/path/to/"
echo ""
echo "📥 在服务器上部署:"
echo "  tar -xzf $PACKAGE_NAME"
echo "  cd $OUTPUT_DIR"
echo "  ./server-deploy.sh"
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

