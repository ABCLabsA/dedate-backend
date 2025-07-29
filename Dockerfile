# 使用官方 Node.js 镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖（包含 devDependencies，因为需要编译）
RUN pnpm install

# 复制所有源码（包括 prisma 目录）
COPY . .

# 生成 Prisma Client
RUN pnpm prisma generate

# 编译 TypeScript
RUN pnpm build

# 只保留生产依赖（可选，减小镜像体积）
RUN pnpm prune --prod

# 暴露端口
EXPOSE 8002

# 启动生产服务
CMD ["pnpm", "start"]