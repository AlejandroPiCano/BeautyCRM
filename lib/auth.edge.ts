import NextAuth from "next-auth";

export const { auth, handlers } = NextAuth({
  providers: [],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
  },
});
