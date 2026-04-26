import { X } from "lucide-react"
import Link from "next/link"
import { getSelfHostedUser } from "@/models/users"
import { redirect } from "next/navigation"
import config from "@/lib/config"
import LandingPage from "@/app/landing/landing"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (config.selfHosted.isEnabled) {
    const user = await getSelfHostedUser()
    if (!user) {
      return <LandingPage />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative">
      <Link
        href="/"
        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <span className="text-gray-300 font-bold text-xl">
          <X />
        </span>
      </Link>
      <div className="flex-grow flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}