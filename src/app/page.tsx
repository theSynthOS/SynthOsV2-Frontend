"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useTheme } from "next-themes";
import { Loading } from "@/components/ui/loading";

export default function Home() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to /home immediately when the app loads
  useEffect(() => {
    if (ready) {
      router.replace("/home");
    }
  }, [ready, router]);

  // Show loading while redirecting
  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-300 ${
        mounted && theme === "dark" ? "bg-[#0B0424]" : "bg-[#F0EEF9]"
      }`}
    >
      <Loading message="Fetching Yields..." className="flex-1" />
    </div>
  );
}
