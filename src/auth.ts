import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT sessions: required for the credentials provider, no session-table reads.
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordOk) return null;

        // Admin bootstrap: the account whose email matches ADMIN_EMAIL is
        // promoted at sign-in (solves the first-admin chicken-and-egg,
        // matching listing-studio's pattern). The Owner sets
        // ADMIN_BOOTSTRAP_ENABLED=false once the real admin account exists.
        let role = user.role;
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
        const bootstrapEnabled = process.env.ADMIN_BOOTSTRAP_ENABLED !== "false";
        if (bootstrapEnabled && adminEmail && user.email === adminEmail && role !== "ADMIN") {
          await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
          role = "ADMIN";
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role,
        };
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "USER" | "ADMIN";
      return session;
    },
  },
});
