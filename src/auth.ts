import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

function baseUsernameFromEmail(email: string) {
  return email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
}

async function ensureUniqueUsername(base: string) {
  const username = base || `user${Date.now()}`;
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? username : `${username}${suffix}`;
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
    suffix += 1;
  }
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toString().toLowerCase().trim();
      const password = credentials?.password?.toString();

      if (!email || !password) return null;

      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user || !user.passwordHash) return null;

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        username: user.username,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret",
  pages: {
    signIn: "/auth/sign-in",
  },
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = (user as { username?: string | null }).username ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      const existing = await prisma.user.findUnique({ where: { id: user.id } });
      if (existing?.username) return;
      const base = baseUsernameFromEmail(user.email);
      const username = await ensureUniqueUsername(base);
      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      });
    },
  },
};

export const getAuthSession = async () => {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
};
