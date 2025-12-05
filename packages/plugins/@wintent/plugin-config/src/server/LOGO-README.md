# Wintent Logo 配置说明

## 添加 Logo 文件

将 Wintent 的 Logo 文件放置在此目录下，文件名为：`wintent-logo.png`

### 要求

- **文件名**：`wintent-logo.png`
- **格式**：PNG（推荐）或 JPG
- **尺寸**：建议宽度 200px，高度 80px 以内
- **背景**：建议使用透明背景（PNG 格式）

### 文件路径

```
packages/plugins/@wintent/plugin-config/src/server/wintent-logo.png
```

## 如果没有 Logo

如果暂时没有 Logo 文件，插件安装时会：

1. 跳过 Logo 上传
2. 只设置系统名称为 "Wintent"
3. 后续可以通过「系统设置」手动上传 Logo

## 手动上传 Logo

1. 登录系统
2. 右上角用户菜单 → 「系统设置」
3. 在「Logo」部分上传图片
4. 点击「保存」
