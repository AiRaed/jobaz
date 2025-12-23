import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps = {}) {
  return (
    <img
      src="/logo.png"
      alt="JobAZ Logo"
      className={cn("h-10 md:h-14 lg:h-16 object-contain select-none", className)}
      draggable="false"
    />
  );
}

