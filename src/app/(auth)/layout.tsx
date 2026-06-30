import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background bg-grain text-foreground">
      <header className="flex items-center justify-center py-8">
        <Link
          href="/"
          className="font-serif text-lg tracking-wide text-foreground transition-colors hover:text-gold"
        >
          New Life Tagum
        </Link>
      </header>
      <main
        id="main"
        className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
