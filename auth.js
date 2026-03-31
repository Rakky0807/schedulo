/**
 * auth.js (root)
 * NextAuth v5 configuration.
 * Handles Google OAuth (with Calendar scope) + email/password credentials.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongoClient";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    // ── Google OAuth with Calendar read/write scope ──────────────────────
    Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  allowDangerousEmailAccountLinking: true,
  authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent", // forces refresh_token on every login
        },
      },
    }),

    // ── Email / Password credentials ─────────────────────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // Persist extra fields (Google tokens, username) into the JWT
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at * 1000;
      }
      return token;
    },

    // Expose token fields to the client-side session object
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }
      return session;
    },

    // Auto-assign a username on first OAuth sign-in
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await connectDB();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          // Derive a unique username from the Google email prefix
          const base = user.email.split("@")[0].replace(/[^a-z0-9]/gi, "");
          let username = base.toLowerCase();
          let counter = 1;
          while (await User.findOne({ username })) {
            username = `${base}${counter++}`;
          }
          await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            username,
            googleAccessToken: account.access_token,
            googleRefreshToken: account.refresh_token,
          });
        } else {
          // Refresh stored Google tokens on subsequent logins
          await User.findOneAndUpdate(
            { email: user.email },
            {
              googleAccessToken: account.access_token,
              ...(account.refresh_token && {
                googleRefreshToken: account.refresh_token,
              }),
            }
          );
        }
      }
      return true;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
