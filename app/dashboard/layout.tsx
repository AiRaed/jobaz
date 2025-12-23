import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JobAZ – CV, Jobs & Interview Training',
  description: 'Your JobAZ dashboard. Manage your CV, find jobs, and track your applications.',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

