"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client, scrollSepolia, wallets } from "@/client";

export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();
  const account = useActiveAccount();
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  // Check authentication state on initial load
  useEffect(() => {
    if (account?.address) {
      // If user is already connected, redirect to home
      router.replace("/home");
    }
    setInitialAuthChecked(true);
  }, [account, router]);

  // Handle wallet connected
  const handleWalletConnected = () => {
    // Redirect directly to home page after wallet connection
    router.push("/home");
  };

  // Show loading state if we haven't checked auth yet
  if (!initialAuthChecked) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
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
        
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 ${
        theme === "dark" ? "bg-[#0f0b22]" : "bg-[#f0eef9]"
      }`}
    >
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
    </div>
  );
}
