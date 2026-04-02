FROM node:20-alpine AS build

WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=${NPM_REGISTRY}
RUN npm install -g pnpm@9.15.4

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm install --frozen-lockfile

COPY src ./src
COPY scripts ./scripts
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=${NPM_REGISTRY}
RUN npm install -g pnpm@9.15.4

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["pnpm", "start"]
