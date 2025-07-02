"use client";

import { ReactNode } from "react";
// import PullToRefresh from "@/components/features/pull-to-refresh";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { PointsProvider } from "@/contexts/PointsContext";
import Header from "@/components/features/header";
import Navbar from "@/components/features/navigation";
import { ThemeBackground } from "@/components/ui/theme-background";

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
    <ThemeProvider attribute="class">
      <PointsProvider>
        <ThemeBackground className="min-h-screen">
          {/* Only show header on non-landing pages */}
          {!isLandingPage && (
            <div className="fixed top-0 left-0 right-0 z-50">
              <Header />
            </div>
          )}

          <main className={`${!isLandingPage ? "pt-16 pb-20" : ""}`}>
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
        </ThemeBackground>
      </PointsProvider>
    </ThemeProvider>
  );
}
