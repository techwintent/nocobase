# Wintent NocoBase 配置指南

## 📋 配置信息

| 项目 | 值 |
|------|-----|
| 系统名称 | Wintent |
| Logo | 蓝色波浪图案 |
| Favicon | Wintent 图标（icon_square.ico）|
| 主题色 | #2f55d4（蓝色） |
| 设置色 | #F18B62（橙色） |
| 管理员 | admin@wintent.tech / admin123 |
| 数据库 | wintent/wintent/wintent |
| 访问地址 | http://localhost:13000 |

---

## 🎯 实现方式

**通过 Wintent 插件实现所有定制**

### Wintent 插件
```
packages/plugins/@wintent/plugin-config/
├── src/client/plugin.tsx         # CSS 注入 ⭐
├── src/server/plugin.ts          # 配置应用 ⭐
└── src/server/wintent-logo.png   # Logo 文件
```

**功能**：
- CSS 样式注入（菜单布局优化）
- Logo 和 Favicon 管理
- 主题色配置
- 系统名称配置

---

## 🚀 开发环境

### 一键安装

```bash
./wintent-setup.sh
```

**自动完成**：
1. 创建 PostgreSQL 数据库
2. 安装依赖
3. 编译 Wintent 插件
4. 初始化 NocoBase
5. 应用 Wintent 品牌配置

**时间**：约 10 分钟

### 启动开发

```bash
yarn dev

# 访问
http://localhost:13000
admin@wintent.tech / admin123
```

---

## 🐳 生产部署

### 1. 导出部署包

```bash
cd docker/app-wintent
./export-wintent.sh
```

**生成**：`wintent-package-*.tar.gz`（132K）

**包含**：
- Wintent 插件（含 CSS 修改）
- Docker 配置（含插件挂载）
- 一键部署脚本
- Wintent 配置脚本

### 2. 上传到服务器

```bash
cd /Users/wangziteng/wintent/nocobase/docker
scp wintent-package-*.tar.gz user@server:/path/
```

### 3. 服务器部署

```bash
# 解压
tar -xzf wintent-package-*.tar.gz
cd wintent-package

# 一键部署
./deploy.sh
```

**自动完成**：
1. 检查 Docker 环境
2. 创建配置文件
3. 启动 Docker 容器
4. 等待 NocoBase 初始化（3分钟）
5. 应用 Wintent 配置

**时间**：约 5-8 分钟

---

## 🎨 修改 CSS 样式

### 编辑插件

**文件**：`packages/plugins/@wintent/plugin-config/src/client/plugin.tsx`

```typescript
private injectCustomStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* 添加你的 CSS */
    .your-class {
      /* ... */
    }
  `;
  document.head.appendChild(style);
}
```

### 重新部署

```bash
# 1. 构建插件
yarn build @wintent/plugin-config --no-dts

# 2. 测试
yarn dev

# 3. 导出部署
cd docker/app-wintent
./export-wintent.sh

# 4. 服务器更新
# (上传后在服务器执行)
docker-compose down
./deploy.sh
```

---

## 📁 核心文件

### 开发（4个）
```
wintent-setup.sh                  # 一键安装
create-wintent-db.sh              # 数据库创建
wintent-config.env                # 环境变量
wintent-theme-config.json         # 主题色配置
```

### 插件（1个）
```
packages/plugins/@wintent/plugin-config/  # Wintent 插件 ⭐
```

### 部署（2个）
```
docker/app-wintent/
  export-wintent.sh               # 导出脚本 ⭐
  apply-config-from-host.sh       # 配置应用
```

---

## 🔧 技术实现

### Logo 应用
```sql
INSERT INTO attachments (...) VALUES ('wintent-logo', ...);
UPDATE "systemSettings" SET "logoId" = ...;
```

### 主题色应用
```sql
UPDATE "themeConfig" 
SET config = jsonb_set(config, '{token}', '{"colorPrimary": "#2f55d4", ...}')
WHERE uid = 'default';
```

### CSS 注入
```typescript
// 插件加载时自动注入
document.head.appendChild(style);
```

---

## 📊 方案优势

| 特性 | 说明 |
|------|------|
| **简单** | 不需要构建 Docker 镜像 |
| **快速** | 部署包只有 132K |
| **稳定** | 使用官方 Docker 镜像 |
| **统一** | 开发和生产环境一致 |
| **灵活** | 插件易于修改和维护 |

---

## 🎯 快速命令

### 开发
```bash
./wintent-setup.sh    # 安装
yarn dev              # 开发
```

### 部署
```bash
cd docker/app-wintent
./export-wintent.sh   # 导出
# (服务器) ./deploy.sh
```

### 构建插件
```bash
yarn build @wintent/plugin-config --no-dts
```

---

## 🔍 验证配置

### 浏览器验证
访问 http://localhost:13000

检查：
- [ ] 系统名称显示 "Wintent"
- [ ] Logo 显示蓝色波浪图案
- [ ] 主题色为蓝色
- [ ] 控制台显示：`[Wintent] Custom CSS styles injected successfully`

### 数据库验证
```bash
# 开发环境
psql -U wintent -d wintent -c "SELECT title FROM \"systemSettings\";"

# Docker 环境
docker-compose exec postgres psql -U wintent -d wintent -c "SELECT title FROM \"systemSettings\";"
```

---

## 🎉 总结

✅ **所有定制通过 Wintent 插件实现**  
✅ **使用官方 Docker 镜像**  
✅ **部署包只有 132K**  
✅ **开发和生产环境统一**  
✅ **一键安装、一键导出、一键部署**  

**完美的解决方案！** 🚀
