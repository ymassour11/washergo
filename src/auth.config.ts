import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js config WITHOUT providers that use Node.js modules.
 * This is safe to import in Edge runtime (middleware).
 */
export const authConfig = {
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  providers: [], // Providers added in auth.ts (Node.js runtime only)
} satisfies NextAuthConfig;
