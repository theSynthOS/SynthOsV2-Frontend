"use client";

import { ReactNode } from "react";
import PullToRefresh from "@/components/features/pull-to-refresh";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { PointsProvider } from "@/contexts/PointsContext";
import Header from "@/components/features/header";
import Navbar from "@/components/features/navigation";

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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <PointsProvider>
        {/* Only show header on non-landing pages */}
        {!isLandingPage && (
          <div className="fixed top-0 left-0 right-0 bg-[#0f0b22] z-50">
            <Header />
          </div>
        )}

        <PullToRefresh onRefresh={handleGlobalRefresh}>
          {children}
        </PullToRefresh>

        {/* Only show navbar on non-landing pages */}
        {!isLandingPage && (
          <div className="fixed bottom-0 left-0 right-0">
            <Navbar />
          </div>
        )}
      </PointsProvider>
    </ThemeProvider>
  );
}
