# 个人博客系统

基于 Cloudflare Workers + D1 + Vue 3 构建的简约个人博客系统。

# 我自己布置好的网址：
https://782130.xyz/


## 数据库设计

### users 表 - 用户

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### categories 表 - 分类

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### tags 表 - 标签

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### posts 表 - 文章

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  category_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### post_tags 表 - 文章标签关联

```sql
CREATE TABLE post_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### settings 表 - 系统设置

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);
```

## API 接口

### 公开接口

#### 文章相关

| 方法 | 路径                | 说明                                     |
| ---- | ------------------- | ---------------------------------------- |
| GET  | /api/posts          | 获取文章列表（支持分页、搜索、分类筛选） |
| GET  | /api/posts/:slug    | 获取文章详情                             |
| GET  | /api/posts/:id/tags | 获取文章标签                             |

#### 分类标签

| 方法 | 路径            | 说明         |
| ---- | --------------- | ------------ |
| GET  | /api/categories | 获取分类列表 |
| GET  | /api/tags       | 获取标签列表 |

#### 其他

| 方法 | 路径            | 说明         |
| ---- | --------------- | ------------ |
| GET  | /api/settings   | 获取网站设置 |
| POST | /api/auth/login | 用户登录     |

### 管理接口（需要认证）

#### 文章管理

| 方法   | 路径                 | 说明         |
| ------ | -------------------- | ------------ |
| GET    | /api/admin/posts     | 获取所有文章 |
| POST   | /api/admin/posts     | 创建文章     |
| GET    | /api/admin/posts/:id | 获取文章详情 |
| PUT    | /api/admin/posts/:id | 更新文章     |
| DELETE | /api/admin/posts/:id | 删除文章     |

#### 分类管理

| 方法   | 路径                      | 说明         |
| ------ | ------------------------- | ------------ |
| GET    | /api/admin/categories     | 获取分类列表 |
| POST   | /api/admin/categories     | 创建分类     |
| PUT    | /api/admin/categories/:id | 更新分类     |
| DELETE | /api/admin/categories/:id | 删除分类     |

#### 标签管理

| 方法   | 路径                | 说明         |
| ------ | ------------------- | ------------ |
| GET    | /api/admin/tags     | 获取标签列表 |
| POST   | /api/admin/tags     | 创建标签     |
| PUT    | /api/admin/tags/:id | 更新标签     |
| DELETE | /api/admin/tags/:id | 删除标签     |

## 本地开发

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
```

### 配置 D1 数据库

```bash
# 创建 D1 数据库
wrangler d1 create blog

# 在 wrangler.toml 中配置数据库 ID
```

### 初始化数据库

```bash
# 连接到远程数据库执行 SQL
wrangler d1 execute blog --remote --file=./schema.sql
```

### 启动开发服务器

```bash
# 终端 1：启动后端（连接远程 D1）
wrangler dev --remote

# 终端 2：启动前端
cd frontend
npm run dev
```

访问 http://localhost:3000

## 部署

### 1. 构建前端

```bash
cd frontend
npm run build
```

### 2. 部署到 Cloudflare

```bash
cd ..
wrangler deploy
```

### 3. 绑定自定义域名

在 Cloudflare 控制台配置域名，或修改 wrangler.toml：

```toml
routes = [
  { pattern = "your-domain.com/*", zone_name = "your-domain.com" }
]
```

## 功能特性

### 前台功能

- 文章列表展示（分页）
- 文章搜索
- 分类筛选
- 文章详情（Markdown 渲染）
- 返回顶部
- 响应式设计

### 后台功能

- 文章管理（增删改查）
- 分类管理
- 标签管理
- Markdown 编辑器
- 登录认证

## 安全机制

1. **前端路由守卫** - 未登录用户无法访问后台页面
2. **后端 Token 验证** - 所有管理接口需要有效 Token
3. **CORS 配置** - 允许跨域请求
4. **HTTPS** - Cloudflare 自动提供 HTTPS

## 自定义配置

### 修改网站信息

在数据库 settings 表中配置：

- `nickname` - 昵称
- `email` - 邮箱
- `avatar` - 头像 URL
- `bio` - 个人简介

### 修改网站标题

编辑 `frontend/index.html`：

```html
<title>你的标题</title>
```

### 修改背景图片

将图片放入 `frontend/public/` 目录，然后在 CSS 中引用：

```css
background-image: url('/bg.jpg');
```

