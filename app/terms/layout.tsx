import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JobAZ – CV, Jobs & Interview Training',
  description: 'Terms & Conditions for JobAZ. Review our service terms and conditions.',
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

