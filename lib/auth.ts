import config from "@/lib/config"
import { getSelfHostedUser, getUserByEmail, getUserById, SELF_HOSTED_USER } from "@/models/users"
import { User } from "@/prisma/client"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "./db"


export type UserProfile = {
  id: string
  name: string
  email: string
  avatar?: string
  membershipPlan: string
  storageUsed: number
  storageLimit: number
  aiBalance: number
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  appName: config.app.title,
  baseURL: config.app.baseURL,
  secret: config.auth.secret,

  session: {
    strategy: "jwt",
    expiresIn: 180 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 365 * 24 * 60 * 60,
    },
  },

  advanced: {
    cookiePrefix: "taxhacker",
    database: {
      generateId: "uuid",
    },
  },

  plugins: [
    nextCookies(), // keep this
  ],
})

export async function getSession() {
  if (config.selfHosted.isEnabled) {
    const user = await getSelfHostedUser()
    return user ? { user } : null
  }

  return await auth.api.getSession({
    headers: await headers(),
  })
}

export async function getCurrentUser(): Promise<User> {
  if (config.selfHosted.isEnabled) {
    const user = await getSelfHostedUser()
    if (user) {
      return user
    } else {
      redirect(config.selfHosted.redirectUrl)
    }
  }

  // Try to return user from session
  const session = await getSession()
  if (session && session.user) {
    const user = await getUserById(session.user.id)
    if (user) {
      return user
    }
  }

  // No session or user found
  redirect("/dashboard")
}

export function isSubscriptionExpired(user: User) {
  if (config.selfHosted.isEnabled) {
    return false
  }
  return user.membershipExpiresAt && user.membershipExpiresAt < new Date()
}

export function isAiBalanceExhausted(user: User) {
  if (config.selfHosted.isEnabled || user.membershipPlan === SELF_HOSTED_USER.membershipPlan) {
    return false
  }
  return user.aiBalance <= 0
}
