# ti.luogu.me

项目包含：

- `web/`：Vue 3 + Vite 前端
- `server/`：Node.js + Express + MariaDB + Redis 后端
- `docker-compose.yml`：本地开发基础设施（MariaDB / Redis）
- `docker-compose.prod.yml`：Linux 生产部署

## 一本地开发（推荐）

### 1. 准备环境

- Node.js 20+
- `pnpm`
- MariaDB / MySQL
- Redis

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置后端环境变量

```bash
cp server/.env.example server/.env
```

按实际数据库 / Redis 修改 `server/.env`。

默认本地开发配置：

- API：`http://localhost:3000`
- Web：`http://localhost:5173`
- MariaDB：`127.0.0.1:3306`
- Redis：`127.0.0.1:6379`

### 4. 启动项目

```bash
pnpm dev
```

或分别启动：

```bash
pnpm run dev:api
pnpm run dev:web
```

## 二使用 Docker 启动本地数据库 / Redis

如果本机没有 MariaDB / Redis，可以直接启动基础设施：

```bash
cp .env.example .env
pnpm run dev:infra
```

默认暴露端口：

- MariaDB：`127.0.0.1:3307`
- Redis：`127.0.0.1:6380`

这时把 `server/.env` 改成：

```env
DB_HOST=127.0.0.1
DB_PORT=3307
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
```

停止基础设施：

```bash
pnpm run dev:infra:down
```

## 三生产部署（Linux）

生产环境请使用：

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

更完整的 Linux 部署步骤见：`docs/deploy-linux.md`

该部署方式会：

- 使用 `server/Dockerfile` 构建后端产物
- 使用 `web/Dockerfile` 构建前端静态资源
- 使用 Nginx 在容器内托管前端 SPA
- 使用 Docker 内部网络连接 MariaDB / Redis / API / Web

## 四常用命令

```bash
pnpm build
pnpm -C server run typecheck
pnpm -C web exec vue-tsc --noEmit
docker compose ps
docker compose logs -f mariadb
docker compose logs -f redis
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```
