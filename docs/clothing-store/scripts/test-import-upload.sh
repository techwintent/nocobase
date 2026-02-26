#!/bin/bash
# 测试 clothingImport:upload API
# 前置: 1) 启用 @wintent/plugin-clothing-store 插件  2) 重启 yarn dev

set -e
NOCOBASE_URL=${1:-http://localhost:13000}
FILE=${2:-docs/clothing-store/example/2025-02-13/商品.xlsx}

echo "登录获取 Token..."
TOKEN=$(curl -s -X POST "$NOCOBASE_URL/api/auth:signIn" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wintent.tech","password":"admin123"}' | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "登录失败"
  exit 1
fi

echo "上传文件: $FILE"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$NOCOBASE_URL/api/clothingImport:upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$FILE")

HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

echo "HTTP: $HTTP"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP" != "200" ]; then
  exit 1
fi
