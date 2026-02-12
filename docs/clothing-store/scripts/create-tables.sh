#!/bin/bash
# NocoBase 建表脚本
# 基于 Wintent 数据模型 v0.1
# 使用方式: ./create-tables.sh <NOCOBASE_URL> <API_TOKEN>

set -e

NOCOBASE_URL=${1:-"http://localhost:13000"}
API_TOKEN=${2:-""}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COLLECTIONS_FILE="$SCRIPT_DIR/collections.json"

if [ ! -f "$COLLECTIONS_FILE" ]; then
    echo "❌ 找不到 collections.json 文件"
    exit 1
fi

echo "🚀 开始创建 NocoBase 表..."
echo "   NocoBase URL: $NOCOBASE_URL"
echo "   配置文件: $COLLECTIONS_FILE"
echo ""

# 读取 collections 数组
COLLECTIONS=$(cat "$COLLECTIONS_FILE" | jq -c '.collections[]')

# 计数器
TOTAL=0
SUCCESS=0
FAILED=0

# 遍历每个 collection
echo "$COLLECTIONS" | while read -r collection; do
    NAME=$(echo "$collection" | jq -r '.name')
    TITLE=$(echo "$collection" | jq -r '.title')
    
    echo "📦 创建表: $NAME ($TITLE)"
    TOTAL=$((TOTAL + 1))
    
    # 调用 NocoBase API 创建 collection
    RESPONSE=$(curl -s -X POST "$NOCOBASE_URL/api/collections:create" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_TOKEN" \
        -d "$collection" 2>&1) || true
    
    # 检查响应
    if echo "$RESPONSE" | jq -e '.data.name' > /dev/null 2>&1; then
        echo "   ✅ 成功"
        SUCCESS=$((SUCCESS + 1))
    else
        ERROR=$(echo "$RESPONSE" | jq -r '.errors[0].message // .message // "未知错误"' 2>/dev/null || echo "$RESPONSE")
        echo "   ❌ 失败: $ERROR"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "=========================================="
echo "📊 执行结果"
echo "   总计: $TOTAL"
echo "   成功: $SUCCESS"
echo "   失败: $FAILED"
echo "=========================================="

# 表创建顺序（考虑依赖关系）
cat << 'EOF'

📋 表创建顺序（建议）:
   1. stores        - 门店（无依赖）
   2. suppliers     - 供应商（无依赖）
   3. brands        - 品牌（无依赖）
   4. categories    - 类别（无依赖）
   5. vip_levels    - VIP等级（无依赖）
   6. employees     - 员工（依赖 stores）
   7. products      - 商品（依赖 suppliers, brands, categories）
   8. skus          - SKU（依赖 products）
   9. inventory     - 库存（依赖 stores, products, skus）
   10. customers    - 客户（依赖 stores, employees, vip_levels）
   11. sales_orders - 销售单（依赖 stores, customers, employees）
   12. sales_items  - 销售明细（依赖 sales_orders, products, skus）
   13. matches      - 搭配（依赖 products）
   14. ai_suggestions - AI建议（多态关联）

EOF
