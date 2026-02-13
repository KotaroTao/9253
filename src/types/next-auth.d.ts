import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      clinicId: string | null
      staffId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    clinicId: string | null
    staffId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    clinicId: string | null
    staffId: string | null
  }
}
