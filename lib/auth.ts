import { PrismaAdapter } from "@auth/prisma-adapter"
import { type DefaultSession, type NextAuth } from "next-auth"
import type { Adapter } from "next-auth/adapters"
import type { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import { compare } from "bcrypt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    email?: string | null
    name?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    email?: string | null
    name?: string | null
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user",
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true }
          })

          if (!existingUser) {
            // Create new user and account
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                role: "user",
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                  }
                }
              }
            })
            return true
          }

          // If user exists but no Google account linked, create the link
          const hasGoogleAccount = existingUser.accounts.some(
            acc => acc.provider === "google"
          )
          
          if (!hasGoogleAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              }
            })
          }
          return true
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      return true
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name ?? null
        session.user.email = token.email ?? null
        session.user.role = token.role
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      }

      if (user) {
        token.id = user.id
        token.role = user.role
      }

      return token
    },
  },
} satisfies NextAuth

