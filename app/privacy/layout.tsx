import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JobAZ – CV, Jobs & Interview Training',
  description: 'Privacy Policy for JobAZ. Learn how we collect, use, and protect your information.',
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

