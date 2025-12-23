import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 mt-auto" data-no-translate>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-70">
          <p>© 2024 AI CV Generator Pro. Built with Next.js & OpenAI.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-violet-600 dark:hover:text-violet-400 hover:underline transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-violet-600 dark:hover:text-violet-400 hover:underline transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
