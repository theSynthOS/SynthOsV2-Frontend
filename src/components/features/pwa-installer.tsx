"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { heavyHaptic, successHaptic, lightHaptic } from "@/lib/haptic-utils";

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Register service worker with a delay to not block initial render
    if ("serviceWorker" in navigator) {
      setTimeout(() => {
        navigator.serviceWorker.register("/sw.js");
      }, 2000); // Delay registration by 2 seconds
    }

    // Handle install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setShowInstallButton(true);
    });

    // Handle installed
    window.addEventListener("appinstalled", () => {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      // Hide install button
      setShowInstallButton(false);
    });
  }, []);

  const handleInstallClick = () => {
    heavyHaptic();
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        successHaptic();
      } else {
        lightHaptic();
      }
      // Clear the deferredPrompt variable
      setDeferredPrompt(null);
      // Hide install button
      setShowInstallButton(false);
    });
  };

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 px-4 xl:hidden">
      <button
        onClick={handleInstallClick}
        className="bg-green-400 text-black font-semibold py-3 px-6 rounded-lg flex items-center shadow-lg"
      >
        <Download className="w-5 h-5 mr-2" />
        Install SynthOS
      </button>
    </div>
  );
}
