"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from '@privy-io/react-auth';
import { Loading } from "@/components/ui/loading";

export default function Home() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  // Redirect to /home immediately when the app loads
  useEffect(() => {
    if (ready) {
      router.replace("/home");
    }
  }, [ready, router]);

  // Show loading while redirecting
  return (
    <div className="flex flex-col min-h-screen">
      <Loading message="loading app" className="flex-1" />
    </div>
  );
}
