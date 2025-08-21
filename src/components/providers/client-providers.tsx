"use client";

import { ReactNode } from "react";
// import PullToRefresh from "@/components/features/pull-to-refresh";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import Header from "@/components/features/header";
import Navbar from "@/components/features/navigation";
import { ThemeBackground } from "@/components/ui/theme-background";
import { Toaster } from "@/components/toast-sonner";

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Check if current page is the landing page
  const isLandingPage = pathname === "/";

  // Handle refresh action for global pull-to-refresh
  const handleGlobalRefresh = async () => {
    // Simulate API call or data refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Refresh the current page
    router.refresh();
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ThemeBackground className="min-h-screen">
        {/* Only show header on non-landing pages */}
        {!isLandingPage && (
          <div className="z-50">
            <Header />
          </div>
        )}

        <main className={`${!isLandingPage ? "pb-24" : ""}`}>
          {/* <PullToRefresh onRefresh={handleGlobalRefresh}> */}
          {children}
          {/* </PullToRefresh> */}
        </main>

        {/* Only show navbar on non-landing pages */}
        {!isLandingPage && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <Navbar />
          </div>
        )}
        <Toaster />
      </ThemeBackground>
    </ThemeProvider>
  );
}
