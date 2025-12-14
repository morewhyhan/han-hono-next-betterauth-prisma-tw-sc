import { PrismaClient } from '../generated/prisma'

// 创建全局Prisma Client实例
let prisma: PrismaClient

// 确保只创建一个Prisma Client实例
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}
