import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// 使用已有的单例模式获取Prisma Client
import { getPrismaClient } from "./db";

export const auth = betterAuth({
    database: prismaAdapter(getPrismaClient(), {
        provider: "sqlite", // 或 "mysql", "postgresql", ...等
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
});