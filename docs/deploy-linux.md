# Linux 部署说明

以下步骤适用于 Ubuntu / Debian 一类 Linux 服务器。

## 1. 安装基础环境

```bash
sudo apt update
sudo apt install -y git curl docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

安装 `pnpm`（仅在需要本机调试时使用）：

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## 2. 拉取项目

```bash
git clone <your-repo-url> /home/ti
cd /home/ti
```

## 3. 配置生产环境变量

```bash
cp .env.example .env
```

将 `.env` 至少改成：

```env
TZ=Asia/Shanghai

MARIADB_ROOT_PASSWORD=请改成强密码
MARIADB_DATABASE=luogu_ti
MARIADB_USER=app
MARIADB_PASSWORD=请改成强密码

API_PORT=3000
WEB_PORT=5173

VITE_API_BASE_URL=https://api.ti.luogu.me
PUBLIC_API_BASE_URL=https://api.ti.luogu.me
WEB_BASE_URL=https://ti.luogu.me
CPOAUTH_BASE_URL=https://auth.luogu.me
```

## 4. 启动生产环境

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

查看日志：

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

## 5. 反向代理

建议：

- `api.ti.luogu.me` -> `http://127.0.0.1:3000`
- `ti.luogu.me` -> `http://127.0.0.1:5173`

并在反代层配置 HTTPS 证书。

## 6. 首次后台登录（Admin Token）

进入数据库容器：

```bash
docker exec -it app-mariadb mariadb -uapp -p luogu_ti
```

插入一条 32 位字母数字 token：

```sql
INSERT INTO admin_tokens (token, created_by_uid)
VALUES ('AbCdEfGhIjKlMnOpQrStUvWxYz123456', 'root');
```

然后访问：

- `https://ti.luogu.me/auth/login`

在登录页下方使用 `Admin Token` 登录后台，完成 CPOAuth 配置。

## 7. 更新部署

```bash
cd /home/ti
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
