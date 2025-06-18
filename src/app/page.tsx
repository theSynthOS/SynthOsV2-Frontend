"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client, scrollSepolia, wallets } from "@/client";

// Define onboarding steps
type OnboardingStep = "welcome" | "wallet-analysis" | "preferences";

// Define API response types
interface AnalysisDetails {
  totalTransactions: number;
  patterns: string;
  recommendations: string;
}

interface ProfileData {
  experienceLevel: string;
  investmentStrategy: string;
  managementStyle: string;
  profileType: string;
  standardDescription: string;
  personalizedDescription: string;
}

interface WalletAnalysis {
  walletAddress: string;
  analysis: {
    summary: string;
    details: AnalysisDetails;
  };
  profile: ProfileData;
  timestamp: string;
}

export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();
  const account = useActiveAccount();
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("welcome");
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const [profile, setProfile] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [walletAnalysis, setWalletAnalysis] = useState<WalletAnalysis | null>(
    null
  );
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);

  // Check authentication state and onboarding status on initial load
  useEffect(() => {
    if (account?.address) {
      // Check if this user has completed onboarding before
      const completedAddresses = JSON.parse(
        localStorage.getItem("completed_onboarding_addresses") || "[]"
      );

      // Only redirect to home if they've completed onboarding before AND they're on the initial welcome step
      if (
        account.address &&
        completedAddresses.includes(account.address) &&
        onboardingStep === "welcome"
      ) {
        // If this wallet address has completed onboarding, redirect to home
        router.replace("/home");
      }
    } console.log(account);
    setInitialAuthChecked(true);
  }, [account, router, onboardingStep]);

  // Fetch wallet analysis when needed
  useEffect(() => {
    if (onboardingStep === "wallet-analysis" && account?.address) {
      fetchWalletAnalysis(account.address);
    }
  }, [onboardingStep, account]);
  

  // Update profile when wallet analysis is received
  useEffect(() => {
    if (walletAnalysis && walletAnalysis.profile) {
      setProfile({
        title: walletAnalysis.profile.profileType || "New to DeFi",
        description:
          walletAnalysis.profile.personalizedDescription ||
          "You're just getting started with DeFi. We'll help you navigate the ecosystem safely.",
      });
    }
  }, [walletAnalysis]);

  // Save profile to localStorage when it changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem("investor_profile", JSON.stringify(profile));
    }
  }, [profile]);

  // Fetch wallet analysis from API
  const fetchWalletAnalysis = async (walletAddress: string) => {
    try {
      setAnalysisError(null);
      setAnalysisProgress(0);
      setEstimatedTimeLeft(5); // Start with 5 seconds estimate

      // Start progress animation
      const startTime = Date.now();
      const estimatedDuration = 5000; // 5 seconds estimate

      // Update progress periodically
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / estimatedDuration) * 100, 95); // Cap at 95% until complete
        setAnalysisProgress(progress);

        const remainingTime = Math.max(
          Math.ceil((estimatedDuration - elapsed) / 1000),
          0
        );
        setEstimatedTimeLeft(remainingTime);
      }, 100);

      // Call the API
      const response = await fetch(`/api/ai-analyser?address=${walletAddress}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      clearInterval(progressInterval);

      // Set progress to 100% when complete
      setAnalysisProgress(100);
      setWalletAnalysis(data);

      // Proceed to preferences after a short delay
      setTimeout(() => {
        setOnboardingStep("preferences");
      }, 500);
    } catch (error) {
      console.error("Error analyzing wallet:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Failed to analyze wallet"
      );

      // Fallback to basic profile if analysis fails
      setProfile({
        title: "New to DeFi",
        description:
          "You're just getting started with DeFi. We'll help you navigate the ecosystem safely.",
      });

      // Still proceed to preferences after a delay
      setTimeout(() => {
        setOnboardingStep("preferences");
      }, 1500);
    }
  };

  // Handle wallet connected
  const handleWalletConnected = () => {
    // If wallet is connected, proceed with wallet analysis
    setOnboardingStep("wallet-analysis");
  };

  // Handle back button click
  const handleBackClick = () => {
    if (onboardingStep === "wallet-analysis") {
      setOnboardingStep("welcome");
    }
  };

  // Determine what to render based on current step
  const renderContent = () => {
    // Check if user needs to connect wallet for steps that require authentication
    if (
      (onboardingStep === "wallet-analysis" ||
        onboardingStep === "preferences") &&
      !account?.address
    ) {
      // Force wallet connection if not authenticated
      return renderWelcome();
    }

    switch (onboardingStep) {
      case "welcome":
        return renderWelcome();
      case "wallet-analysis":
        return renderWalletAnalysis();
      default:
        return renderWelcome();
    }
  };

  // Render welcome screen with wallet connection
  const renderWelcome = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center text-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Image
          src="/SynthOS-transparent.png"
          alt="SynthOS Logo"
          width={120}
          height={120}
          className="mb-6"
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className={`text-5xl font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-black"
        }`}
      >
        SynthOS
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className={`text-xl font-bold mb-8 max-w-md text-center ${
          theme === "dark" ? "text-white" : "text-black"
        }`}
      >
        Invest with confidence using personalized crypto yield plans
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-2"
      >
        <ConnectButton 
        client={client} 
        onConnect={handleWalletConnected}  
        wallets={wallets}
        theme={theme === "dark" ? "dark" : "light"}
        connectModal={{ size: "compact" }}
        accountAbstraction={{
          chain: scrollSepolia, // replace with the chain you want
          sponsorGas: true,
        }}
      />
      </motion.div>
    </motion.div>
  );

  // Show loading state if we haven't checked auth yet
  if (!initialAuthChecked) {
    return (
      <div
        className={`flex items-center justify-center ${
          theme === "dark" ? "bg-[#0f0b22]" : "bg-[#f0eef9]"
        }`}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1, opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={`text-xl ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  // Render wallet analysis step
  const renderWalletAnalysis = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center text-center max-w-md"
    >
      <div
        className={`text-xl mb-4 ${
          theme === "dark" ? "text-white" : "text-black"
        }`}
      >
        Analyzing your wallet...
      </div>
      <div className="w-full max-w-sm">
        <div
          className={`h-2 w-full rounded-full ${
            theme === "dark" ? "bg-gray-700" : "bg-[#f0eef9]"
          }`}
        >
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-300 ease-linear"
            style={{ width: `${analysisProgress}%` }}
          ></div>
        </div>
      </div>
      <div
        className={`mt-4 text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {analysisError ? (
          <div className="flex items-center justify-center space-x-2 text-red-500">
            <span className="animate-pulse">⚠️</span>
            <span>Error: {analysisError}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="animate-spin">⚡</span>
              <span>
                Analyzing your wallet activity and investment patterns...
              </span>
            </div>
            {estimatedTimeLeft < 100 ? (
              <div className="mt-2 flex items-center space-x-2 font-medium text-purple-500 animate-pulse">
                <span>🤖</span>
                <span>AI analysis in progress...</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );

    const handleContinueToDashboard = () => {
      if (account?.address) {
        // Get existing completed addresses
        const completedAddresses = JSON.parse(
          localStorage.getItem("completed_onboarding_addresses") || "[]"
        );

        // Add current address if not already included
        if (!completedAddresses.includes(account.address)) {
          completedAddresses.push(account.address);
          localStorage.setItem(
            "completed_onboarding_addresses",
            JSON.stringify(completedAddresses)
          );
        }
      }

      // Navigate to dashboard
      router.push("/home");
    };
        
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 ${
        theme === "dark" ? "bg-[#0f0b22]" : "bg-[#f0eef9]"
      }`}
    >
      {/* Only show logo on wallet analysis and preferences steps */}
      {onboardingStep !== "welcome" && (
        <Image
          src="/SynthOS-transparent.png"
          alt="SynthOS Logo"
          width={64}
          height={64}
          className="mb-4"
        />
      )}

      {/* Dynamic content based on current onboarding step */}
      {renderContent()}
    </div>
  );
}
