import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-turquoise-600 p-12 text-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">HaloPSA AI</span>
        </Link>

        <div>
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium">
              "HaloPSA AI has completely transformed how our team handles
              tickets. What used to take 5 minutes now takes 5 seconds."
            </p>
            <footer className="text-white/80">
              <p className="font-semibold">Sarah Mitchell</p>
              <p className="text-sm">Service Desk Manager, TechStream Solutions</p>
            </footer>
          </blockquote>
        </div>

        <p className="text-sm text-white/60">
          &copy; {new Date().getFullYear()} HaloPSA AI. All rights reserved.
        </p>
      </div>

      {/* Right side - Auth form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
