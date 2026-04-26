import LandingPage from "@/app/landing/landing"
import { getSession } from "@/lib/auth"
import config from "@/lib/config"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getSession()
  
    return <LandingPage />
  

  //redirect("/dashboard")
}

export const dynamic = "force-dynamic"
