'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center border border-violet-600/30">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-50">
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Last updated: October 2025
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 rounded-2xl p-8 md:p-12 border border-slate-800/60 space-y-8"
        >
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-300 leading-relaxed">
              At JobAZ, we respect your privacy. This policy outlines how we collect, use, and protect your information when you use our website and services.
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                1. Data We Collect
              </h2>
              <p className="text-slate-300 leading-relaxed">
                We collect minimal personal information such as your email (only if voluntarily provided) and anonymous usage data to improve site performance.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                2. Cookies
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Our website uses essential cookies to ensure proper functionality. You can disable cookies through your browser settings at any time.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                3. How We Use Data
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Data is used solely for improving the user experience and maintaining service quality. We do not sell, rent, or share your data with third parties.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                4. Your Rights
              </h2>
              <p className="text-slate-300 leading-relaxed">
                You can request deletion or correction of your data at any time by contacting us through the support page.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                5. Security
              </h2>
              <p className="text-slate-300 leading-relaxed">
                We apply modern encryption and secure protocols (SSL) to protect all user information.
              </p>
            </section>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/"
            className="text-violet-400 hover:text-violet-300 hover:underline inline-flex items-center gap-2 transition-colors"
          >
            ← Back to JobAZ
          </Link>
        </motion.div>
      </div>
    </div>
  )
}



