# Linux 部署说明

这份文档是 Linux 部署的快捷版。  
更完整、更详细、包含反向代理与常见报错排查的版本请直接看仓库根目录 [README.md](../README.md) 中的“Linux 详细部署教程”。

## 1. 安装 Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl git docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
newgrp docker
```

## 2. 拉取项目

```bash
git clone <your-repo-url> /opt/ti.luogu.me
cd /opt/ti.luogu.me
```

## 3. 复制并修改 `.env`

```bash
cp .env.example .env
```

分域部署示例：

```env
TZ=Asia/Shanghai

MARIADB_ROOT_PASSWORD=请改成强密码
MARIADB_DATABASE=luogu_ti
MARIADB_USER=app
MARIADB_PASSWORD=请改成强密码

API_BIND_HOST=127.0.0.1
API_PORT=3000
WEB_BIND_HOST=127.0.0.1
WEB_PORT=5173

NPM_REGISTRY=https://registry.npmmirror.com

VITE_API_BASE_URL=https://api.ti.luogu.me
PUBLIC_API_BASE_URL=https://api.ti.luogu.me
WEB_BASE_URL=https://ti.luogu.me
CPOAUTH_BASE_URL=https://auth.luogu.me
```

同域 `/api` 反代示例：

```env
TZ=Asia/Shanghai

MARIADB_ROOT_PASSWORD=请改成强密码
MARIADB_DATABASE=luogu_ti
MARIADB_USER=app
MARIADB_PASSWORD=请改成强密码

API_BIND_HOST=127.0.0.1
API_PORT=3000
WEB_BIND_HOST=127.0.0.1
WEB_PORT=5173

NPM_REGISTRY=https://registry.npmmirror.com

VITE_API_BASE_URL=
PUBLIC_API_BASE_URL=
WEB_BASE_URL=https://ti.luogu.me
CPOAUTH_BASE_URL=https://auth.luogu.me
```

说明：

- 如果服务器能稳定访问官方源，可把 `NPM_REGISTRY` 改成 `https://registry.npmjs.org`
- 如果前面有 Nginx / Caddy，建议 `API_BIND_HOST=127.0.0.1`、`WEB_BIND_HOST=127.0.0.1`
- 若 `VITE_API_BASE_URL` 留空，前端会使用同源 `/api`，由 `web` 容器内 Nginx 转发到 `api`

## 4. 启动

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

查看日志：

```bash
docker compose -f docker-compose.prod.yml logs -f mariadb
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

## 5. 初始化后台 Admin Token

```bash
docker compose -f docker-compose.prod.yml exec mariadb mariadb -uapp -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"
```

```sql
INSERT INTO admin_tokens (token, created_by_uid)
VALUES ('AbCdEfGhIjKlMnOpQrStUvWxYz123456', 'root');
```

登录地址：

- `https://ti.luogu.me/auth/login`

## 6. 更新部署

```bash
cd /opt/ti.luogu.me
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
