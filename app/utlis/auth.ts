
// @ts-ignore
import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongooseClient";
import type { JWT } from "next-auth/jwt";
import type { Session, User, Account, Profile } from "next-auth";
import UserModel from "@/database/schema/UserModel";
import { connectDB } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {

    async signIn({ user, account, profile }: {
      user: User;
      account?: Account | null;
      profile?: Profile;
    }) {
      await connectDB();
      if (user.email) {
        await UserModel.updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name,
              image: user.image,
            },
          },
          { upsert: true }
        );
      }
      return true;
    },

    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export const { handlers, auth, signIn, signOut } = handler;
export default handler;
