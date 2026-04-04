FROM node:20-alpine AS build

WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=${NPM_REGISTRY}
RUN npm install -g pnpm@9.15.4

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/tsconfig.json ./server/
RUN pnpm install --filter ./server... --frozen-lockfile

COPY server/src ./server/src
COPY server/scripts ./server/scripts
RUN pnpm -C server build

FROM node:20-alpine AS runner

WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=${NPM_REGISTRY}
RUN npm install -g pnpm@9.15.4

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
RUN pnpm install --filter ./server --prod --frozen-lockfile

COPY --from=build /app/server/dist ./server/dist

EXPOSE 3000

CMD ["pnpm", "-C", "server", "start"]
