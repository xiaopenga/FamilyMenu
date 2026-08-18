# 今天吃什么（FamilyMenu）

一个面向家庭使用的菜单管理与智能推荐小程序，支持菜单录入、多种点菜方式（手动勾选 / 随机抽选 / AI 智能推荐），并带有记忆功能避免近期重复。

## ✨ 功能特性

### 菜品管理
- 菜品的增删改查，支持图片上传
- 标签管理（口味、类型、场景、难度）
- 餐次分类（早餐 / 午餐 / 晚餐）
- 菜品详情页，支持食材、步骤、抖音链接

### 点菜中心
- 美团点餐风格的左右联动列表
- 手动勾选加入今日点餐
- 随机抽选（支持按标签筛选，自动排除最近 3 天吃过的菜）
- 今日点餐管理（增删、清空、分享给家人）
- 历史记录日历视图

### AI 智能推荐
- 基于 DeepSeek API 的对话式推荐
- 真流式输出（打字机效果）
- Function Calling 工具调用（查询菜品库、查询历史记录）
- 库里的菜品一键加入今日点餐
- AI 生成的新菜谱一键保存到菜品库
- 历史对话管理，支持继续对话 / 新建对话

## 🛠 技术栈

### 前端
- **框架**：uni-app + Vue 3 + TypeScript
- **状态管理**：Pinia
- **UI 组件**：uView Plus
- **图片处理**：SmartImage 组件（wx.downloadFile 绕过内网穿透警告）

### 后端
- **框架**：NestJS
- **ORM**：Prisma 5.x
- **数据库**：MySQL 8.0
- **认证**：JWT
- **AI**：DeepSeek API（兼容 OpenAI 格式，支持 Function Calling）

### 部署
- 本地 MacBook + 花生壳内网穿透
- 微信小程序体验版

## 📁 项目结构

```
FamilyMenu/
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── ai/              # AI 推荐模块（对话、工具调用、流式输出）
│   │   ├── dish/            # 菜品模块
│   │   ├── tag/             # 标签模块
│   │   ├── history/         # 历史记录模块
│   │   ├── user/            # 用户模块（微信登录）
│   │   ├── upload/          # 图片上传模块
│   │   ├── common/          # 公共模块（守卫、拦截器、过滤器）
│   │   ├── prisma.service.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma    # 数据库 Schema
│   ├── uploads/             # 上传图片存储目录
│   └── .env                 # 环境变量（不提交 git）
│
└── frontend/                # 前端项目
    └── src/
        ├── pages/
        │   ├── index/       # 首页（菜品列表，左右联动）
        │   ├── dish/        # 菜品详情、新增/编辑
        │   ├── menu/        # 今日点餐
        │   ├── history/     # 历史记录（日历视图）
        │   ├── ai/          # AI 推荐（聊天、历史对话）
        │   └── mine/        # 我的页面
        ├── components/      # 公共组件（SmartImage）
        ├── api/             # API 封装
        ├── utils/           # 工具函数（request、auth）
        └── pages.json       # 页面配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- pnpm
- Docker（运行 MySQL）
- 微信开发者工具

### 后端启动

```bash
cd backend

# 安装依赖
pnpm install

# 启动 MySQL（Docker）
docker run -d --name mysql-familymenu \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=familymenu \
  -p 3306:3306 \
  mysql:8.0

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入微信 AppID/Secret、JWT Secret、DeepSeek API Key

# 数据库迁移
npx prisma migrate dev

# 启动开发服务器
pnpm run start:dev
```

### 前端启动

```bash
cd frontend

# 安装依赖
pnpm install

# 配置环境变量
# 编辑 .env.development，设置 VITE_API_BASE_URL=http://localhost:3000

# 启动开发服务
pnpm run dev:mp-weixin
```

然后用微信开发者工具打开 `frontend/dist/dev/mp-weixin` 目录。

### 环境变量说明

**后端 `.env`**
```env
DATABASE_URL="mysql://root:123456@localhost:3306/familymenu"
WECHAT_APPID="你的小程序AppID"
WECHAT_SECRET="你的小程序AppSecret"
JWT_SECRET="自定义JWT密钥"
DEEPSEEK_API_KEY="你的DeepSeek API Key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"
```

**前端 `.env.development`**
```env
VITE_API_BASE_URL=http://localhost:3000
```

**前端 `.env.production`**
```env
VITE_API_BASE_URL=https://你的花生壳域名
```

## 🤖 AI Agent 架构

本项目实现了一个轻量级的点餐 AI Agent：

```
用户输入 → 后端 → DeepSeek LLM（AI 大脑）
                    ↓
              AI 决定调用工具
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
    查菜品库工具         查历史记录工具
          ↓                   ↓
          └─────────┬─────────┘
                    ↓
              LLM 整理结果
                    ↓
              流式返回（SSE）
                    ↓
                前端聊天界面
```

### 工具列表
1. **search_dishes**：查询菜品库，支持按关键词（菜名、描述、标签名）、标签 ID、餐次筛选
2. **get_recent_history**：查询最近 N 天吃过的菜品，用于避免重复推荐

## 📝 开发记录

### 第一周：基础功能
- 环境搭建、数据库设计、微信登录
- 菜品 CRUD、标签管理、图片上传
- 列表页、详情页、新增/编辑页

### 第二周：点菜中心
- 餐次分类、列表页左右联动
- 今日点餐、随机抽选、记忆系统
- 历史记录日历视图
- tabBar、我的页面

### 第三周：AI 推荐
- DeepSeek API 接入、Function Calling
- 对话管理、流式输出（打字机效果）
- 推荐菜品卡片、新菜谱保存
- 历史对话管理

## ⚠️ 注意事项

- `.env` 文件包含敏感信息，已加入 `.gitignore`，不要提交到 git
- 微信小程序正式版需要配置合法域名（request、uploadFile、downloadFile）
- 花生壳免费版有流量和带宽限制，适合个人使用
- MySQL Json 字段不支持 `array_contains`，餐次筛选用字符串包含匹配

## 📄 License

MIT
