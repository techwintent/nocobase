#!/bin/bash

# 从宿主机应用 Wintent 配置
# 通过 postgres 容器执行 SQL

set -e

echo "================================================"
echo "  应用 Wintent 品牌配置"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查容器状态
if ! docker-compose ps | grep -q "Up"; then
    echo "容器未运行，请先启动："
    echo "  docker-compose up -d"
    exit 1
fi

echo "步骤 1: 复制 Logo 到容器..."
echo "----------------------------------------"

if [ -f "init-files/wintent-logo.png" ]; then
    # 复制 Logo 到容器的 storage 目录
    docker-compose exec app mkdir -p /app/nocobase/storage/uploads
    docker cp init-files/wintent-logo.png wintent-app:/app/nocobase/storage/uploads/wintent-logo.png
    
    # 生成随机后缀
    RANDOM_SUFFIX=$(head /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 6)
    LOGO_FILENAME="wintent-logo-${RANDOM_SUFFIX}.png"
    
    docker-compose exec app cp /app/nocobase/storage/uploads/wintent-logo.png \
        "/app/nocobase/storage/uploads/${LOGO_FILENAME}"
    
    echo -e "${GREEN}✓ Logo 文件已复制: ${LOGO_FILENAME}${NC}"
else
    echo -e "${YELLOW}⚠ Logo 文件不存在${NC}"
    LOGO_FILENAME=""
fi

echo ""
echo "步骤 2: 应用 Wintent 配置到数据库..."
echo "----------------------------------------"

if [ -n "$LOGO_FILENAME" ]; then
    # 有 Logo 的完整配置
    docker-compose exec -T postgres psql -U wintent -d wintent << EOF
-- 创建附件记录
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
) ON CONFLICT DO NOTHING;

-- 更新系统设置
UPDATE "systemSettings" 
SET 
  title = 'Wintent',
  "appLang" = 'zh-CN',
  "enabledLanguages" = '["zh-CN", "en-US"]',
  "logoId" = (SELECT id FROM attachments WHERE title = 'wintent-logo' ORDER BY id DESC LIMIT 1)
WHERE id = 1;
EOF
    echo -e "${GREEN}✓ 系统设置和 Logo 已更新${NC}"
else
    # 没有 Logo，只更新系统名称和语言
    docker-compose exec -T postgres psql -U wintent -d wintent << EOF
UPDATE "systemSettings" 
SET 
  title = 'Wintent',
  "appLang" = 'zh-CN',
  "enabledLanguages" = '["zh-CN", "en-US"]'
WHERE id = 1;
EOF
    echo -e "${GREEN}✓ 系统设置已更新${NC}"
fi

echo ""
echo "步骤 3: 应用 Wintent 主题色..."
echo "----------------------------------------"

docker-compose exec -T postgres psql -U wintent -d wintent << 'EOF'
-- 更新默认主题配置
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

echo -e "${GREEN}✓ 主题色已更新${NC}"

echo ""
echo "步骤 4: 验证配置..."
echo "----------------------------------------"

docker-compose exec -T postgres psql -U wintent -d wintent << 'EOF'
SELECT 
  s.id,
  s.title as system_name,
  s."appLang" as language,
  a.title as logo_title,
  (SELECT config->>'name' FROM "themeConfig" WHERE "default" = true) as default_theme
FROM "systemSettings" s
LEFT JOIN attachments a ON s."logoId" = a.id
WHERE s.id = 1;
EOF

echo ""
echo "================================================"
echo -e "${GREEN}  ✅ Wintent 配置应用完成！${NC}"
echo "================================================"
echo ""
echo "🌐 访问: http://localhost:13000"
echo "👤 登录: admin@wintent.tech / admin123"
echo ""
echo "刷新浏览器即可看到 Wintent 品牌配置！"
echo ""

