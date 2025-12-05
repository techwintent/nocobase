# Wintent NocoBase Docker 部署指南

本指南说明如何构建和部署包含所有 Wintent 定制化的 Docker 镜像。

## 📦 方案说明

### 为什么需要自定义镜像？

官方的 `nocobase/nocobase` 镜像是预编译的，不包含我们的定制化修改：
- ✨ Header 底部边框样式
- 🎨 Wintent Logo 和 Favicon
- 🎯 Wintent 主题色配置
- 🔧 其他核心文件修改

因此，我们需要构建一个**包含所有 Wintent 定制化的自定义镜像**。

## 🚀 快速开始

### 1. 构建并部署（一键完成）

```bash
cd docker/app-wintent
./build-and-deploy.sh
```

这个脚本会：
1. 从源码构建 Wintent 定制 Docker 镜像
2. 停止现有容器
3. 启动新容器
4. 显示启动日志

### 2. 手动构建（可选）

如果你想分步骤执行：

#### 步骤 1: 构建镜像

```bash
cd docker/app-wintent
docker build -t wintent/nocobase:2.0.0-alpha.49-wintent \
    -f Dockerfile.wintent \
    ../../
```

#### 步骤 2: 启动服务

```bash
docker-compose -f docker-compose.wintent.yml up -d
```

#### 步骤 3: 查看日志

```bash
docker-compose -f docker-compose.wintent.yml logs -f app
```

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `Dockerfile.wintent` | Wintent 定制镜像的 Dockerfile |
| `docker-compose.wintent.yml` | 使用定制镜像的 docker-compose 配置 |
| `docker-entrypoint-wintent.sh` | 容器启动脚本，包含自动配置逻辑 |
| `build-and-deploy.sh` | 一键构建和部署脚本 |
| `docker-compose.yml` | 原始配置（使用官方镜像） |

## 🔧 定制内容

### 包含的修改

1. **核心样式修改**
   - Header 底部边框：`1px solid rgba(5, 5, 5, 0.06)`
   - 位置：`packages/core/client/src/route-switch/antd/admin-layout/index.tsx`

2. **Wintent 配置插件**
   - Logo 和 Favicon 自动配置
   - 自定义 CSS 样式注入
   - 位置：`packages/plugins/@wintent/plugin-config`

3. **自动初始化**
   - 首次启动自动安装 NocoBase
   - 自动启用 Wintent 插件
   - 自动配置品牌信息和主题

### 自动配置项

容器首次启动时会自动：
- ✅ 安装 NocoBase
- ✅ 启用 @wintent/plugin-config 插件
- ✅ 上传 Logo 和 Favicon 到附件表
- ✅ 更新系统设置（标题、Logo）
- ✅ 应用 Wintent 主题色 (#2f55d4)
- ✅ 设置默认语言为中文

## 🌐 访问和登录

- **访问地址**: http://localhost:13000
- **管理员邮箱**: admin@wintent.tech
- **默认密码**: admin123

⚠️ **安全提示**：生产环境请修改默认密码和密钥！

## 📝 常用命令

### 容器管理

```bash
# 启动服务
docker-compose -f docker-compose.wintent.yml up -d

# 停止服务
docker-compose -f docker-compose.wintent.yml down

# 重启服务
docker-compose -f docker-compose.wintent.yml restart

# 查看日志
docker-compose -f docker-compose.wintent.yml logs -f

# 进入容器
docker exec -it wintent-app bash
```

### 镜像管理

```bash
# 查看镜像
docker images | grep wintent

# 删除旧镜像
docker rmi wintent/nocobase:2.0.0-alpha.49-wintent

# 重新构建（强制不使用缓存）
docker build --no-cache -t wintent/nocobase:2.0.0-alpha.49-wintent \
    -f Dockerfile.wintent ../../
```

### 数据管理

```bash
# 备份数据库
docker exec wintent-postgres pg_dump -U wintent wintent > backup.sql

# 恢复数据库
docker exec -i wintent-postgres psql -U wintent wintent < backup.sql

# 清空数据重新初始化
rm -rf storage/db/postgres
rm -f storage/.initialized
docker-compose -f docker-compose.wintent.yml up -d
```

## 🚢 部署到服务器

### 方法 1: 导出镜像并传输

在本地构建后导出镜像：

```bash
# 1. 构建镜像
./build-and-deploy.sh

# 2. 导出镜像
docker save wintent/nocobase:2.0.0-alpha.49-wintent \
    | gzip > wintent-nocobase-image.tar.gz

# 3. 传输到服务器
scp wintent-nocobase-image.tar.gz user@server:/path/to/

# 4. 在服务器上加载镜像
ssh user@server
gunzip -c wintent-nocobase-image.tar.gz | docker load

# 5. 启动服务
cd /path/to/wintent/docker/app-wintent
docker-compose -f docker-compose.wintent.yml up -d
```

### 方法 2: 使用私有镜像仓库

```bash
# 1. 标记镜像
docker tag wintent/nocobase:2.0.0-alpha.49-wintent \
    registry.yourcompany.com/wintent/nocobase:2.0.0-alpha.49-wintent

# 2. 推送到私有仓库
docker push registry.yourcompany.com/wintent/nocobase:2.0.0-alpha.49-wintent

# 3. 在服务器上修改 docker-compose.wintent.yml
# image: registry.yourcompany.com/wintent/nocobase:2.0.0-alpha.49-wintent

# 4. 拉取并启动
docker-compose -f docker-compose.wintent.yml pull
docker-compose -f docker-compose.wintent.yml up -d
```

### 方法 3: 在服务器上直接构建

```bash
# 1. 将整个项目代码传输到服务器
rsync -avz --exclude 'node_modules' --exclude '.git' \
    ../../ user@server:/path/to/nocobase/

# 2. 在服务器上构建
ssh user@server
cd /path/to/nocobase/docker/app-wintent
./build-and-deploy.sh
```

## 🔄 更新流程

当你修改了源码（如样式、插件等），需要重新构建镜像：

```bash
# 1. 修改源码后重新构建
cd docker/app-wintent
docker build -t wintent/nocobase:2.0.0-alpha.49-wintent \
    -f Dockerfile.wintent ../../

# 2. 重启服务
docker-compose -f docker-compose.wintent.yml down
docker-compose -f docker-compose.wintent.yml up -d
```

## 📊 版本管理

建议为每个版本打标签：

```bash
# 构建并打标签
docker build -t wintent/nocobase:2.0.0-alpha.49-wintent \
    -t wintent/nocobase:latest \
    -t wintent/nocobase:v1.0.0 \
    -f Dockerfile.wintent ../../
```

## ❓ 故障排查

### 问题 1: 样式没有生效

检查：
1. 镜像是否重新构建：`docker images | grep wintent`
2. 容器是否使用新镜像：`docker-compose -f docker-compose.wintent.yml ps`
3. 浏览器缓存是否清除：`Ctrl+Shift+R`

### 问题 2: 插件未启用

```bash
# 进入容器检查
docker exec -it wintent-app bash
cd /app/nocobase
yarn pm list

# 如果未启用，手动启用
yarn pm enable @wintent/plugin-config
```

### 问题 3: 数据库连接失败

```bash
# 检查数据库状态
docker-compose -f docker-compose.wintent.yml ps postgres

# 查看数据库日志
docker-compose -f docker-compose.wintent.yml logs postgres
```

## 📚 相关文档

- [NocoBase 官方文档](https://docs.nocobase.com/)
- [Docker 官方文档](https://docs.docker.com/)
- [项目根目录的 README-WINTENT.txt](../../README-WINTENT.txt)

## 🤝 支持

如有问题，请联系 Wintent 技术团队。

