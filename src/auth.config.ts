import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.clinicId = user.clinicId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.clinicId = token.clinicId as string | null
      }
      return session
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // Public routes - no auth required
      const publicRoutes = ["/login", "/s/"]
      const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
      )

      // API routes that don't require auth
      const publicApiRoutes = [
        "/api/auth",
        "/api/surveys/submit",
        "/api/reviews/click",
      ]
      const isPublicApi = publicApiRoutes.some((route) =>
        pathname.startsWith(route)
      )

      if (isPublicRoute || isPublicApi || pathname === "/") {
        return true
      }

      if (!isLoggedIn) {
        return false // Redirects to signIn page
      }

      // Role-based access control
      const role = auth?.user?.role

      // /admin/* requires system_admin
      if (pathname.startsWith("/admin") && role !== "system_admin") {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }

      // /dashboard/* requires clinic_admin or system_admin
      if (
        pathname.startsWith("/dashboard") &&
        role !== "clinic_admin" &&
        role !== "system_admin"
      ) {
        return Response.redirect(new URL("/login", nextUrl))
      }

      return true
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig
