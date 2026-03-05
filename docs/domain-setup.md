# 域名和 SSL 配置指南

## 域名配置

### 主域名设置
- 主域名: `engvloglab.com`
- DNS 提供商: Cloudflare
- 记录类型: A
- 记录值: Vercel 分配的 IP

### 子域名设置

1. **静态资源 CDN**
```
assets.engvloglab.com CNAME assets.engvloglab.com.cdn.cloudflare.net
```

2. **媒体文件 CDN**
```
media.engvloglab.com CNAME media.engvloglab.com.cdn.cloudflare.net
```

3. **API 子域名**
```
api.engvloglab.com CNAME cname.vercel-dns.com
```

### DNS 记录配置

| 类型  | 名称    | 值                               | TTL    | 代理状态 |
|-------|---------|----------------------------------|--------|----------|
| A     | @       | [Vercel IP]                      | 自动   | 已代理   |
| CNAME | www     | cname.vercel-dns.com            | 自动   | 已代理   |
| CNAME | assets  | assets.engvloglab.com.cdn.cloudflare.net | 自动   | 已代理   |
| CNAME | media   | media.engvloglab.com.cdn.cloudflare.net  | 自动   | 已代理   |
| CNAME | api     | cname.vercel-dns.com            | 自动   | 已代理   |

## SSL 配置

### Cloudflare SSL/TLS 设置

1. **SSL/TLS 加密模式**: Full (严格)
2. **最低 TLS 版本**: 1.2
3. **启用 HSTS**: 是
   - 最大期限: 6 个月
   - 包含子域名: 是
   - 预加载: 是

### 证书配置

1. **主域名证书**
   - 类型: Cloudflare 托管证书
   - 覆盖范围: `*.engvloglab.com`
   - 有效期: 自动续期

2. **自定义证书（如需要）**
   - 提供商: Let's Encrypt
   - 自动续期: 是
   - 安装位置: Vercel

### 安全头部配置

已在 `next.config.js` 和 `vercel.json` 中配置以下安全头部：

```javascript
{
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

## CDN 配置

### Cloudflare 缓存规则

1. **静态资源**
```
URL 匹配: assets.engvloglab.com/*
缓存级别: 标准
边缘缓存 TTL: 7 天
浏览器缓存 TTL: 1 天
```

2. **媒体文件**
```
URL 匹配: media.engvloglab.com/*
缓存级别: 标准
边缘缓存 TTL: 30 天
浏览器缓存 TTL: 1 天
```

### 页面规则

1. **强制 HTTPS**
```
URL 匹配: *engvloglab.com/*
设置: 始终使用 HTTPS
```

2. **缓存级别**
```
URL 匹配: assets.engvloglab.com/*
设置: 缓存级别: 标准
```

## 监控设置

1. **域名健康检查**
   - 检查频率: 60 秒
   - 检查端点: /api/health
   - 通知设置: 已配置到告警系统

2. **SSL 证书监控**
   - 自动检查证书有效期
   - 提前 30 天发送续期提醒

## 维护说明

1. **证书续期**
   - Cloudflare 托管证书自动续期
   - Let's Encrypt 证书通过 Vercel 自动续期

2. **DNS 记录更新**
   - 更新 DNS 记录时需要同时更新 Vercel 项目设置
   - 确保 Cloudflare 代理状态正确配置

3. **缓存清理**
   - 通过 Cloudflare Dashboard 执行
   - 可使用 API 进行程序化清理

4. **紧急联系人**
   - DNS 管理员: [联系方式]
   - SSL 证书管理员: [联系方式]
   - CDN 管理员: [联系方式]