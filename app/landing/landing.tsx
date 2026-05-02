import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import Image from "next/image"
import Link from "next/link"
import { selfHostedGetStartedAction } from "../(auth)/actions"


export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <header className="py-6 px-4 md:px-8 bg-white/90 backdrop-blur-xl shadow-lg border-b border-gradient-to-r from-pink-200 to-indigo-200 fixed w-full z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Image
                src="/logo/ensias.jpg"
                alt="Logo"
                width={32}
                height={32}
                className="h-8 group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-indigo-600 rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300" />
            </div>
            <ColoredText className="text-2xl font-bold">Invoice IDP</ColoredText>
          </Link>
          <div className="flex items-center gap-3">
            <form action={selfHostedGetStartedAction}>
              <button
                type="submit"
                className="cursor-pointer font-bold px-5 py-2 rounded-full bg-gradient-to-r from-pink-600 to-indigo-600 text-white hover:from-pink-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-xs md:text-sm"
              >
                Get Started ✨
              </button>
            </form>
           
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 via-purple-100/30 to-indigo-100/50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-pink-400 to-indigo-400 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full opacity-10 blur-3xl animate-pulse" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block px-6 py-3 rounded-full border-2 border-pink-600/50 text-sm font-medium mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
              🚀 Under Active Development
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-gray-900 via-pink-700 to-indigo-700 bg-clip-text text-transparent pb-2">
              Let AI finally care about your data, scan your invoices and analyze your expenses
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto font-medium">
              IA-powered invoice and receipt data processing pipeline. Save time, reduce errors and get insights from your financial documents. 
            </p>
            <div className="flex gap-4 justify-center text-sm md:text-lg">

              <form action={selfHostedGetStartedAction}>
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold rounded-full hover:from-pink-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 border-2 border-white/20"
              >
                Get Started ✨
              </button>
            </form>
            
              <Link
                href="mailto:elmehdihassani2001@gmail.com"
                className="px-8 py-4 border-2 border-gradient-to-r from-pink-300 to-indigo-300 text-gray-800 font-bold rounded-full hover:bg-gradient-to-r hover:from-pink-50 hover:to-indigo-50 transition-all duration-300 hover:scale-105 bg-white/80"
              >
                Contact Us 💌
              </Link>
            </div>
          </div>
          <div className="relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-gradient-to-r from-pink-200 to-indigo-200">
            <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 via-purple-500/5 to-indigo-500/10 z-10" />
            <video className="w-full h-auto" autoPlay loop muted playsInline poster="/landing/ai-scanner-big.webp">
              <source src="/landing/landingV.mp4" type="video/mp4" />
              <Image src="/landing/ai-scanner-big.webp" alt="TaxHacker" width={1728} height={1080} priority />
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-indigo-50/50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="flex flex-col gap-3 mb-4">
              <span className="text-6xl font-bold bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Process invoices in seconds, not hours
              </span>
              <span className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Save you time, money and nerves
              </span>
            </h2>
          </div>

          {/* AI Scanner Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-pink-50/30 to-indigo-50/30 p-8 rounded-3xl shadow-xl ring-2 ring-gradient-to-r from-pink-200 to-indigo-200 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold mb-4 shadow-lg">
                🤖 IA-Powered
              </div>
              <h3 className="text-2xl font-boldSelf mb-4 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Analyze financial documents with AI
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3 text-lg">✨</span>
                  Upload your receipts or invoices for automatic recognition
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3 text-lg">✨</span>
                  Extract key information like dates, items, and vendors
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3 text-lg">✨</span>
                  Works with any language and any photo quality
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3 text-lg">✨</span>
                  Automatically organize everything into a structured database
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3 text-lg">✨</span>
                  Bulk upload and analyze multiple files at once
                </li>
              </ul>
            </div>
            <div className="flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-gradient-to-r from-blue-200 to-indigo-200 hover:scale-105 transition-all duration-500">
              <Image src="/landing/ai-scanner.webp" alt="AI Document Analyzer" width={1900} height={1524} />
            </div>
          </div>

       

          {/* Transaction Table Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-pink-50/30 to-rose-50/30 p-8 rounded-3xl shadow-xl ring-2 ring-gradient-to-r from-pink-200 to-rose-200 hover:shadow-2xl transition-all duration-500 group flex-row-reverse">
            <div className="flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-gradient-to-r from-pink-200 to-rose-200 hover:scale-105 transition-all duration-500">
              <Image src="/landing/transactions.webp" alt="Transactions Table" width={2000} height={1279} />
            </div>
            <div className="flex-1  min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white text-sm font-bold mb-4 shadow-lg">
                🔍 Filters & Categories
              </div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-700 to-rose-700 bg-clip-text text-transparent">
                Organize your transactions using fully customizable categories
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-pink-600 mr-3 text-lg">📊</span>
                  Absolute freedom to create custom categories
                </li>
                <li className="flex items-center">
                  <span className="text-pink-600 mr-3 text-lg">📊</span>
                  Add, edit and manage your transactions
                </li>
                <li className="flex items-center">
                  <span className="text-pink-600 mr-3 text-lg">📊</span>
                  Filter by any column, category or date range
                </li>
                <li className="flex items-center">
                  <span className="text-pink-600 mr-3 text-lg">📊</span>
                  Customize which columns to show in the table
                </li>
                <li className="flex items-center">
                  <span className="text-pink-600 mr-3 text-lg">📊</span>
                  Import transactions from CSV
                </li>
              </ul>
            </div>
          </div>

          {/* Invoice Generator */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 p-8 rounded-3xl shadow-xl ring-2 ring-gradient-to-r from-purple-200 to-indigo-200 hover:shadow-2xl transition-all duration-500 group">
            <div className="max-w-sm flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-gradient-to-r from-purple-200 to-indigo-200 hover:scale-105 transition-all duration-500">
              <Image src="/landing/invoice-generator.webp" alt="Invoice Generator" width={1800} height={1081} />
            </div>
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold mb-4 shadow-lg">
                📋 Invoice Generator
              </div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                Create custom invoices
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-purple-600 mr-3 text-lg">📄</span>
                  Advanced invoice generator to create any invoice in any language
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-3 text-lg">📄</span>
                  Edit any field, even labels and titles
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-3 text-lg">📄</span>
                  Export invoices to PDF or as transactions
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-3 text-lg">📄</span>
                  Save invoices as templates to reuse them later
                </li>
  
              </ul>
            </div>
          </div>

          

          {/* Data Export */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 p-8 rounded-3xl shadow-xl ring-2 ring-gradient-to-r from-orange-200 to-amber-200 hover:shadow-2xl transition-all duration-500 group flex-row-reverse">
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-bold mb-4 shadow-lg">
                📦 Self-hosting & Data Export
              </div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                Your Data — Your Rules
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">📤</span>
                  Deploy your own instance for 100% privacy
                </li>
                <li className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">📤</span>
                  Export your structured data to CSV 
                </li>
                <li className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">📤</span>
                  Full-text search across documents and invoices
                </li>
                <li className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">📤</span>
                  Download full data archive to migrate to another service. We don't take away or limit what you do with
                  your data
                </li>
              </ul>
            </div>
            <div className="flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-gradient-to-r from-orange-200 to-amber-200 hover:scale-105 transition-all duration-500">
              <Image src="/landing/export.webp" alt="Export" width={1200} height={1081} />
            </div>
          </div>
        </div>
      </section>

   

          {/* Stay Tuned / GitHub CTA */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-2xl shadow-sm ring-1 ring-gray-100">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-semibold mb-4">Stay Tuned</h3>
              <p className="text-gray-600 mb-6">
                We&apos;re working hard on making the model useful for everyone. Star and watch our GitHub repo to get
                notified about new features and releases.
              </p>
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="https://github.com/HM2021MH/idp_invoice"
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-full hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                  >
                    Open GitHub repo
                  </a>
                </div>
              </div>
            </div>
          </div>
        

      <footer className="py-8 px-8 bg-gradient-to-r from-pink-50 to-indigo-50 border-t-2 border-gradient-to-r from-pink-200 to-indigo-200">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          Made with ❤️ in Berlin by{" "}
          <Link
            href="https://github.com/HM2021MH"
            className="underline font-semibold hover:text-pink-600 transition-colors"
          >
            @HM2021MH
          </Link>
        </div>

        <section className="py-12 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`mailto:elmehdihassani2001@gmail.com`}
                className="text-sm text-gray-600 hover:text-pink-600 font-medium transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="https://github.com/HM2021MH/idp_invoice"
                target="_blank"
                className="text-sm text-gray-600 hover:text-pink-600 font-medium transition-colors"
              >
                Source Code
              </Link>
            </div>
          </div>
        </section>
      </footer>
    </div>
  )
}