import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is a mock authorize function for now.
        // In a real app, you would check these against a database.
        if (credentials?.email === "admin@example.com" && credentials?.password === "password") {
          return { id: "1", name: "Admin User", email: "admin@example.com" };
        }
        
        // For testing purposes, allow any login for now if needed, 
        // or return null to fail authentication.
        if (credentials?.email && credentials?.password) {
             return { 
                id: Math.random().toString(), 
                name: credentials.email.split('@')[0], 
                email: credentials.email 
            };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};
