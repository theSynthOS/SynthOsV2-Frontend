"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CustomConnectWallet from "@/components/CustomConnectWallet";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";

// Define onboarding steps
type OnboardingStep = "welcome" | "wallet-analysis" | "preferences";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, address } = useAuth();
  const { theme } = useTheme();
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("welcome");
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const [profile, setProfile] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Check authentication state and onboarding status on initial load
  useEffect(() => {
    if (isAuthenticated) {
      // Check if this user has completed onboarding before
      const completedAddresses = JSON.parse(
        localStorage.getItem("completed_onboarding_addresses") || "[]"
      );

      // Only redirect to home if they've completed onboarding before AND they're on the initial welcome step
      if (
        address &&
        completedAddresses.includes(address) &&
        onboardingStep === "welcome"
      ) {
        // If this wallet address has completed onboarding, redirect to home
        router.replace("/home");
      }
    }
    setInitialAuthChecked(true);
  }, [isAuthenticated, router, address, onboardingStep]);

  // Log authentication state changes
  useEffect(() => {
    console.log("Landing page auth state:", { isAuthenticated, address });
  }, [isAuthenticated, address]);

  // Update profile when onboarding step changes to preferences
  useEffect(() => {
    if (onboardingStep === "preferences") {
      setProfile({
        title: "New to DeFi",
        description:
          "You're just getting started with DeFi. We'll help you navigate the ecosystem safely.",
      });
    }
  }, [onboardingStep]);

  // Save profile to localStorage when it changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem("investor_profile", JSON.stringify(profile));
    }
  }, [profile]);

  // Handle wallet connected
  const handleWalletConnected = () => {
    // If wallet is connected, proceed with wallet analysis
    setOnboardingStep("wallet-analysis");
    // Simulate AI analysis with timeout
    setTimeout(() => {
      setOnboardingStep("preferences");
    }, 3000);
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
      !isAuthenticated
    ) {
      // Force wallet connection if not authenticated
      return renderWelcome();
    }

    switch (onboardingStep) {
      case "welcome":
        return renderWelcome();
      case "wallet-analysis":
        return renderWalletAnalysis();
      case "preferences":
        return renderPreferences();
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
        className={`text-xl font-bold mb-12 max-w-md text-center ${
          theme === "dark" ? "text-white" : "text-black"
        }`}
      >
        Invest with confidence using personalized yield plans.
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-2"
      >
        <CustomConnectWallet onConnected={handleWalletConnected} />
      </motion.div>
    </motion.div>
  );

  // Show loading state if we haven't checked auth yet
  if (!initialAuthChecked) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          theme === "dark" ? "bg-[#0f0b22]" : "bg-white"
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
            theme === "dark" ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5 }}
            className="h-full bg-green-500 rounded-full"
          ></motion.div>
        </div>
      </div>
      <div
        className={`mt-4 text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Examining transaction history, protocol interactions, and asset
        preferences...
      </div>
    </motion.div>
  );

  // Render preferences step
  const renderPreferences = () => {
    const currentProfile = profile || {
      title: "New to DeFi",
      description:
        "You're just getting started with DeFi. We'll help you navigate the ecosystem safely.",
    };

    const handleContinueToDashboard = () => {
      if (address) {
        // Get existing completed addresses
        const completedAddresses = JSON.parse(
          localStorage.getItem("completed_onboarding_addresses") || "[]"
        );

        // Add current address if not already included
        if (!completedAddresses.includes(address)) {
          completedAddresses.push(address);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div
          className={`text-xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          Here's what we found:
        </div>
        <div
          className={`p-4 rounded-lg mb-4 ${
            theme === "dark"
              ? "bg-purple-900/20 text-white"
              : "bg-purple-100 text-black"
          }`}
        >
          <p className="mb-2 text-lg font-bold">
            You are{" "}
            <span className="text-purple-400">{currentProfile.title}</span>
          </p>
          <p>{currentProfile.description}</p>
        </div>
        <div className="flex flex-col ">
          <div
            className={`text-sm mb-6 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            AI-powered results tailored to your wallet activity
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleContinueToDashboard}
          className="bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-5 rounded-lg"
        >
          Continue to Dashboard
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 ${
        theme === "dark" ? "bg-[#0f0b22]" : "bg-white"
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

      {/* Back button when appropriate */}
      {onboardingStep === "wallet-analysis" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-8 text-sm ${
            theme === "dark"
              ? "text-gray-400 hover:text-gray-300"
              : "text-gray-500 hover:text-gray-600"
          }`}
          onClick={handleBackClick}
        >
          ← Go back
        </motion.button>
      )}
    </div>
  );
}
