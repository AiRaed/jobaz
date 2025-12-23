import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JobAZ – CV, Jobs & Interview Training',
  description: 'Generate personalized Cover Letters that match your CV style.',
}

export default function CoverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

