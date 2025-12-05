#!/bin/bash
set -e

# Wintent NocoBase Docker 启动脚本

echo "================================================"
echo "  Starting Wintent NocoBase"
echo "================================================"

# 等待数据库就绪
if [ -n "$DB_HOST" ]; then
    echo "Waiting for database..."
    until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" 2>/dev/null; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    echo "Database is ready!"
fi

# 检查是否需要初始化
if [ ! -f "/app/nocobase/storage/.initialized" ]; then
    echo "First run detected, initializing NocoBase..."
    
    # 运行安装
    yarn nocobase install \
        --lang="${INIT_APP_LANG:-zh-CN}" \
        --root-email="${INIT_ROOT_EMAIL:-admin@wintent.tech}" \
        --root-password="${INIT_ROOT_PASSWORD:-admin123}" \
        --root-nickname="${INIT_ROOT_NICKNAME:-Wintent Admin}" \
        --root-username="${INIT_ROOT_USERNAME:-admin}"
    
    # 启用 Wintent 插件
    echo "Enabling Wintent plugins..."
    yarn pm enable @wintent/plugin-config
    
    # 应用 Wintent 配置到数据库
    if [ -n "$DB_DIALECT" ] && [ "$DB_DIALECT" = "postgres" ]; then
        echo "Applying Wintent branding configuration..."
        
        # 复制 Logo 文件
        mkdir -p /app/nocobase/storage/uploads
        if [ -f "/app/nocobase/packages/plugins/@wintent/plugin-config/dist/server/wintent-logo.png" ]; then
            cp /app/nocobase/packages/plugins/@wintent/plugin-config/dist/server/wintent-logo.png \
               /app/nocobase/storage/uploads/wintent-logo.png
        fi
        
        if [ -f "/app/nocobase/packages/plugins/@wintent/plugin-config/dist/server/icon_square.ico" ]; then
            cp /app/nocobase/packages/plugins/@wintent/plugin-config/dist/server/icon_square.ico \
               /app/nocobase/storage/uploads/wintent-favicon.ico
        fi
        
        # 生成随机文件名
        LOGO_SUFFIX=$(head /dev/urandom | tr -dc 'a-z0-9' | head -c 6)
        LOGO_FILENAME="wintent-logo-${LOGO_SUFFIX}.png"
        FAVICON_FILENAME="wintent-favicon-${LOGO_SUFFIX}.ico"
        
        cp /app/nocobase/storage/uploads/wintent-logo.png \
           "/app/nocobase/storage/uploads/${LOGO_FILENAME}"
        cp /app/nocobase/storage/uploads/wintent-favicon.ico \
           "/app/nocobase/storage/uploads/${FAVICON_FILENAME}"
        
        # 应用数据库配置
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_DATABASE" << EOF
-- 创建附件记录
INSERT INTO attachments (
  title, filename, extname, mimetype, url, "createdAt", "updatedAt"
) VALUES 
  ('wintent-logo', '${LOGO_FILENAME}', '.png', 'image/png', 
   '/storage/uploads/${LOGO_FILENAME}', NOW(), NOW()),
  ('wintent-favicon', '${FAVICON_FILENAME}', '.ico', 'image/x-icon', 
   '/storage/uploads/${FAVICON_FILENAME}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 更新系统设置
UPDATE "systemSettings" 
SET 
  title = 'Wintent',
  "appLang" = 'zh-CN',
  "enabledLanguages" = '["zh-CN", "en-US"]',
  "logoId" = (SELECT id FROM attachments WHERE title = 'wintent-logo' ORDER BY id DESC LIMIT 1)
WHERE id = 1;

-- 更新主题配置
UPDATE "themeConfig" 
SET config = jsonb_set(
  config::jsonb, '{token}',
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

UPDATE "themeConfig" SET "default" = false;
UPDATE "themeConfig" SET "default" = true WHERE uid = 'default';
EOF
        
        echo "✓ Wintent branding configuration applied"
    fi
    
    # 标记已初始化
    touch /app/nocobase/storage/.initialized
    echo "✓ Initialization complete"
fi

# 启动 NocoBase
echo "Starting NocoBase..."
exec yarn start

