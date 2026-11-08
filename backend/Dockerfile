# ==========================================
# Dockerfile cho DalatAgri Backend (NestJS)
# Đồ án Tốt nghiệp CNTT
# ==========================================

FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt các gói phụ thuộc để build native modules nếu cần
RUN apk add --no-cache python3 make g++

# Sao chép package.json và package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt dependencies và generate Prisma Client
RUN npm ci
RUN npx prisma generate

# Sao chép toàn bộ mã nguồn
COPY . .

# Build dự án NestJS
RUN npm run build

# ==========================================
# Production Image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Cài đặt OpenSSL cần thiết cho Prisma engine trên Alpine
RUN apk add --no-cache openssl

# Sao chép từ stage builder
COPY package*.json ./
COPY prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Áp dụng các migration đã version hóa rồi khởi động NestJS.
# Không dùng `db push` khi startup vì có thể kiểm tra/thay đổi schema ở mỗi lần restart.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
