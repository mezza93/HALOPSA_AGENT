/**
 * NextAuth.js v5 Configuration
 *
 * Supports:
 * - Google OAuth
 * - Email/Password credentials
 * - Prisma adapter for database sessions
 * - Role-based access control
 */

import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { createDefaultApiKeyForUser } from './api-keys';

// Extend session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
      plan: 'FREE' | 'PRO' | 'ENTERPRISE' | 'UNLIMITED';
    } & DefaultSession['user'];
  }

  interface User {
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    plan: 'FREE' | 'PRO' | 'ENTERPRISE' | 'UNLIMITED';
  }
}

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig['adapter'],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/onboarding',
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // SECURITY: Disabled dangerous email account linking
      // This prevents account takeover attacks where an attacker
      // could link their Google account to an existing user's email
    }),

    // Email/Password
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true,
            plan: true,
            isActive: true,
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session, account }) {
      // Initial sign in - user object is only available on sign in
      if (user) {
        token.id = user.id;
        token.role = user.role || 'USER';
        token.plan = user.plan || 'FREE';
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // For credentials provider, ensure we have all required fields
      if (account?.provider === 'credentials' && user) {
        token.sub = user.id;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'USER' | 'ADMIN' | 'SUPER_ADMIN';
        session.user.plan = token.plan as 'FREE' | 'PRO' | 'ENTERPRISE' | 'UNLIMITED';
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth, update last login
      if (account?.provider !== 'credentials' && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch((error) => {
          // P2025: Record not found - user doesn't exist yet (first OAuth sign in)
          // This is expected for new OAuth users before the adapter creates them
          if (error?.code !== 'P2025') {
            console.error('Failed to update last login time:', error);
          }
        });
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Log new user creation
      console.log(`New user created: ${user.email}`);

      // Create default API key with 1M monthly token limit for OAuth users
      if (user.id) {
        try {
          await createDefaultApiKeyForUser(user.id);
          console.log(`Default API key created for user: ${user.email}`);
        } catch (error) {
          console.error(`Failed to create API key for user ${user.email}:`, error);
        }
      }
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

// Helper to check if user is admin
export function isAdmin(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

// Helper to check if user is super admin
export function isSuperAdmin(role: string | undefined): boolean {
  return role === 'SUPER_ADMIN';
}
