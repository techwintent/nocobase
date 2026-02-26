#!/bin/bash

# Wintent NocoBase 配置脚本
# 用于配置 Wintent 定制化的 NocoBase 环境

set -e

echo "================================================"
echo "  Wintent NocoBase 配置脚本"
echo "================================================"
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在 NocoBase 项目根目录下运行此脚本${NC}"
    exit 1
fi

echo "步骤 1: 配置环境变量..."
echo "----------------------------------------"

# 备份现有的 .env 文件（只保留一份最新备份）
if [ -f ".env" ]; then
    if [ -f ".env.backup" ]; then
        echo -e "${YELLOW}删除旧备份...${NC}"
        rm -f .env.backup
    fi
    echo -e "${YELLOW}备份当前 .env 文件到 .env.backup${NC}"
    cp .env .env.backup
fi

# 复制 wintent 配置
if [ ! -f "wintent-config.env" ]; then
    echo -e "${RED}错误: 找不到 wintent-config.env 文件${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 应用 Wintent 配置到 .env 文件${NC}"
cp wintent-config.env .env

echo ""
echo "步骤 2: 创建 wintent 数据库..."
echo "----------------------------------------"

# 检查数据库脚本是否存在
if [ ! -f "create-wintent-db.sh" ]; then
    echo -e "${RED}错误: 找不到 create-wintent-db.sh 脚本${NC}"
    exit 1
fi

# 运行数据库创建脚本
echo "运行数据库创建脚本..."
./create-wintent-db.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}数据库创建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 数据库配置完成${NC}"

echo ""
echo "步骤 3: 清理旧数据（如果存在）..."
echo "----------------------------------------"

if [ -d "storage" ]; then
    echo "发现 storage 目录，是否要清理？"
    read -p "清理会删除所有上传的文件和日志 (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf storage/db/*
        rm -rf storage/logs/*
        rm -rf storage/uploads/*
        echo -e "${GREEN}✓ 已清理旧数据${NC}"
    fi
fi

echo ""
echo "步骤 4: 安装依赖..."
echo "----------------------------------------"

yarn install
echo -e "${GREEN}✓ 依赖安装完成${NC}"

echo ""
echo "步骤 5: 编译 Wintent 插件..."
echo "----------------------------------------"

yarn build @wintent/plugin-config @wintent/plugin-clothing-store --no-dts
echo -e "${GREEN}✓ 插件编译完成${NC}"

echo ""
echo "步骤 6: 初始化 NocoBase..."
echo "----------------------------------------"

echo "开始安装 NocoBase（这可能需要几分钟）..."
yarn nocobase install \
  --lang=zh-CN \
  --root-email=admin@wintent.tech \
  --root-password=admin123 \
  --root-nickname="Wintent Admin" \
  --root-username=admin

echo -e "${GREEN}✓ NocoBase 安装完成${NC}"

echo ""
echo "步骤 7: 应用 Wintent 品牌配置（Logo、Favicon、主题）..."
echo "----------------------------------------"

# 复制 Logo 和 Favicon 文件到 uploads 目录
echo "正在准备 Wintent 资源..."
if [ -f "packages/plugins/@wintent/plugin-config/src/server/wintent-logo.png" ]; then
    cp packages/plugins/@wintent/plugin-config/src/server/wintent-logo.png storage/uploads/
    echo -e "${GREEN}✓ Logo 文件已准备${NC}"
fi

if [ -f "packages/plugins/@wintent/plugin-config/src/server/icon_square.ico" ]; then
    cp packages/plugins/@wintent/plugin-config/src/server/icon_square.ico storage/uploads/
    echo -e "${GREEN}✓ Favicon 文件已准备${NC}"
fi

# 生成随机文件名后缀
RANDOM_SUFFIX=$(head /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 6)
LOGO_FILENAME="wintent-logo-${RANDOM_SUFFIX}.png"
FAVICON_FILENAME="wintent-favicon-${RANDOM_SUFFIX}.ico"

# 复制带随机后缀的文件
if [ -f "storage/uploads/wintent-logo.png" ]; then
    cp storage/uploads/wintent-logo.png "storage/uploads/${LOGO_FILENAME}"
fi

if [ -f "storage/uploads/icon_square.ico" ]; then
    cp storage/uploads/icon_square.ico "storage/uploads/${FAVICON_FILENAME}"
fi

echo "正在通过数据库直接应用 Wintent 配置..."

# 在数据库中创建附件记录并更新系统设置
psql -U wintent -d wintent > /dev/null 2>&1 << EOF
-- 创建 Logo 附件记录
INSERT INTO attachments (
  title, 
  filename, 
  extname, 
  mimetype, 
  url,
  "createdAt",
  "updatedAt"
) VALUES (
  'wintent-logo',
  '${LOGO_FILENAME}',
  '.png',
  'image/png',
  '/storage/uploads/${LOGO_FILENAME}',
  NOW(),
  NOW()
);

-- 创建 Favicon 附件记录
INSERT INTO attachments (
  title, 
  filename, 
  extname, 
  mimetype, 
  url,
  "createdAt",
  "updatedAt"
) VALUES (
  'wintent-favicon',
  '${FAVICON_FILENAME}',
  '.ico',
  'image/x-icon',
  '/storage/uploads/${FAVICON_FILENAME}',
  NOW(),
  NOW()
);

-- 更新系统设置
UPDATE "systemSettings" 
SET 
  title = 'Wintent',
  "appLang" = 'zh-CN',
  "enabledLanguages" = '["zh-CN", "en-US"]',
  "logoId" = (SELECT id FROM attachments WHERE title = 'wintent-logo' ORDER BY id DESC LIMIT 1),
  "faviconId" = (SELECT id FROM attachments WHERE title = 'wintent-favicon' ORDER BY id DESC LIMIT 1)
WHERE id = 1;
EOF

echo -e "${GREEN}✓ Wintent 品牌配置已完全应用（Logo、Favicon）${NC}"

echo ""
echo "步骤 8: 应用 Wintent 主题色配置..."
echo "----------------------------------------"

echo "正在更新默认主题配置..."

# 应用 Wintent 主题色
psql -U wintent -d wintent > /dev/null 2>&1 << 'EOF'
-- 更新默认主题配置（应用 Wintent 主题色）
UPDATE "themeConfig" 
SET config = jsonb_set(
  config::jsonb,
  '{token}',
  '{
    "colorPrimary": "#2f55d4",
    "colorInfo": "#2f55d4",
    "colorPrimaryHeader": "#001529",
    "colorBgHeader": "#ffffff",
    "colorBgHeaderMenuHover": "#dbe8ff",
    "colorBgHeaderMenuActive": "#f0f6ff",
    "colorTextHeaderMenu": "#000",
    "colorTextHeaderMenuHover": "#000",
    "colorTextHeaderMenuActive": "#2f55d4",
    "colorSettings": "#F18B62",
    "colorBgSettingsHover": "rgba(241, 139, 98, 0.06)",
    "colorTemplateBgSettingsHover": "rgba(98, 200, 241, 0.06)",
    "colorBorderSettingsHover": "rgba(241, 139, 98, 0.3)",
    "motionUnit": 0.03
  }'::jsonb
)::json
WHERE uid = 'default';

-- 确保 Default 主题是默认主题
UPDATE "themeConfig" SET "default" = false;
UPDATE "themeConfig" SET "default" = true WHERE uid = 'default';
EOF

echo -e "${GREEN}✓ Wintent 主题色已应用${NC}"
echo "  - 主题色: #2f55d4 (蓝色)"
echo "  - 设置色: #F18B62 (橙色)"
echo "  - 默认主题: Default (已设置)"

echo ""
echo "================================================"
echo -e "${GREEN}  🎉 Wintent NocoBase 配置完成！${NC}"
echo "================================================"
echo ""
echo "✅ 配置信息："
echo "  - 系统名称: Wintent ✨"
echo "  - Logo: Wintent Logo ✨"
echo "  - Favicon: Wintent Icon ✨"
echo "  - 管理员邮箱: admin@wintent.tech"
echo "  - 管理员密码: admin123"
echo "  - 默认语言: 中文 ✨"
echo "  - 主题色: #2f55d4 (蓝色) ✨"
echo "  - 设置色: #F18B62 (橙色) ✨"
echo "  - 数据库: wintent"
echo ""
echo "🚀 启动服务："
echo "  开发模式: yarn dev"
echo "  生产模式: yarn start"
echo ""
echo "🌐 访问地址: http://localhost:13000"
echo ""
echo "⚠️  安全提示："
echo "  - 首次登录后请立即修改默认密码"
echo "  - 生产环境请修改 APP_KEY"
echo "  - 生产环境请使用强密码"
echo ""
echo "📚 查看文档："
echo "  - 完整文档: cat WINTENT.md"
echo ""
