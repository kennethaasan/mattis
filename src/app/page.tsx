import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Mattis Stats Application</h1>
      <p className="text-lg mb-4">
        Welcome to the new Next.js + TypeScript application.
      </p>
      <Button>Get Started</Button>
    </main>
  );
}
