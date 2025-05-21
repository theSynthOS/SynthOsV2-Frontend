"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import CustomConnectWallet from "@/components/CustomConnectWallet"
import Image from "next/image"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { MoveRight } from "lucide-react"

// Define user path types
type UserPath = "none" | "experienced" | "new"
type OnboardingStep = 
  | "welcome"
  | "path-selection" 
  | "wallet-connection" 
  | "wallet-analysis" 
  | "preferences" 
  | "quiz" 
  | "generating-preferences"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, address } = useAuth()
  const { theme } = useTheme()
  const [userPath, setUserPath] = useState<UserPath>("none")
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("welcome")
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [initialAuthChecked, setInitialAuthChecked] = useState(false)
  const [profile, setProfile] = useState<{title: string, description: string} | null>(null)
  
  // Check authentication state on initial load and redirect if needed
  useEffect(() => {
    if (isAuthenticated && !initialAuthChecked) {
      router.replace("/home")
    }
    setInitialAuthChecked(true)
  }, [isAuthenticated, router, initialAuthChecked])
  
  // Log authentication state changes
  useEffect(() => {
    console.log("Landing page auth state:", { isAuthenticated, address })
    // Remove automatic redirection from generating-preferences step
    // Let users click the Continue to Dashboard button themselves
  }, [isAuthenticated, address, router, onboardingStep])
  
  // Update profile when onboarding step changes to preferences
  useEffect(() => {
    if (onboardingStep === "preferences") {
      setProfile(getInvestorProfile())
    }
  }, [onboardingStep, userPath, quizAnswers])
  
  // Save profile to localStorage when it changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem("investor_profile", JSON.stringify(profile))
    }
  }, [profile])
  
  // Proceed to path selection
  const proceedToPathSelection = () => {
    setOnboardingStep("path-selection")
  }
  
  // Handle path selection
  const selectPath = (path: UserPath) => {
    setUserPath(path)
    setOnboardingStep("wallet-connection")
  }

  // Handle wallet connected
  const handleWalletConnected = () => {
    if (userPath === "experienced") {
      setOnboardingStep("wallet-analysis")
      // Simulate AI analysis with timeout
      setTimeout(() => {
        setOnboardingStep("preferences")
      }, 3000)
    } else if (userPath === "new") {
      setOnboardingStep("quiz")
    }
  }

  // Get investor profile based on quiz answers
  const getInvestorProfile = () => {
    if (userPath === "experienced") {
      return {
        title: "Experienced Strategist",
        description: "You're most active on Scroll, mostly farming stablecoins with a moderate risk profile."
      }
    } else {
      // For new users, determine profile based on quiz answers
      const level = quizAnswers.level || "";
      const preference = quizAnswers.preference || "";
      const action = quizAnswers.action || "";
      
      if (level === "Intermediate" && preference === "stable" && action === "auto") {
        return {
          title: "Cautious Newbie",
          description: "Beginner who wants income and minimal involvement."
        }
      } else if (level === "Intermediate" && preference === "stable" && action === "scroll") {
        return {
          title: "Guided Learner",
          description: "Beginner seeking steady returns with some input."
        }
      } else if (level === "Intermediate" && preference === "stable" && action === "multiple") {
        return {
          title: "Hands-On Rookie",
          description: "Beginner who wants full control over their investments."
        }
      } else if (level === "Intermediate" && preference === "mixed" && action === "auto") {
        return {
          title: "Passive Climber",
          description: "Beginner aiming for long-term growth, hands-off."
        }
      } else if (level === "Intermediate" && preference === "mixed" && action === "mixed") {
        return {
          title: "Growth Trainee",
          description: "Beginner wanting growth and occasional feedback."
        }
      } else if (level === "Advanced" && preference === "mixed" && action === "control") {
        return {
          title: "Manual Explorer",
          description: "Beginner ready to learn through control and action."
        }
      } else if (level === "Intermediate" && preference === "growth" && action === "auto") {
        return {
          title: "Auto Dabbler",
          description: "Beginner excited about quick wins but wants autopilot."
        }
      } else if (level === "Intermediate" && preference === "growth" && action === "mixed") {
        return {
          title: "Curious Hustler",
          description: "Beginner exploring returns actively with minor input."
        }
      } else {
        return {
          title: "Degen Learner",
          description: "You are familiar with DeFi, exploring returns actively with minor input."
        }
      }
    }
  }

  // Handle quiz completed
  const handleQuizCompleted = () => {
    setOnboardingStep("generating-preferences")
    // Simulate AI analysis with timeout
    setTimeout(() => {
      setOnboardingStep("preferences")
    }, 3000)
  }

  // Handle back button click
  const handleBackClick = () => {
    if (onboardingStep === "path-selection") {
      setOnboardingStep("welcome")
    } else if (onboardingStep === "wallet-connection") {
      setUserPath("none")
      setOnboardingStep("path-selection")
    } else if (onboardingStep === "quiz") {
      setOnboardingStep("wallet-connection")
    }
  }

  // Determine what to render based on current step
  const renderContent = () => {
    // Check if user needs to connect wallet
    if ((onboardingStep === "quiz" || onboardingStep === "wallet-analysis" || 
         onboardingStep === "preferences" || onboardingStep === "generating-preferences") && 
        !isAuthenticated) {
      // Force wallet connection if not authenticated
      return renderWalletConnection()
    }
    
    switch(onboardingStep) {
      case "welcome":
        return renderWelcome()
      case "path-selection":
        return renderPathSelection()
      case "wallet-connection":
        return renderWalletConnection()
      case "wallet-analysis":
        return renderWalletAnalysis()
      case "preferences":
        return renderPreferences()
      case "quiz":
        return renderQuiz()
      case "generating-preferences":
        return renderGeneratingPreferences()
      default:
        return renderWelcome()
    }
  }

  // Render welcome screen
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
        className={`text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
      >
        SynthOS
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className={`text-xl font-bold mb-12 max-w-md text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}
      >
        We curate complex crypto APYs into simple plans that fit you.
      </motion.div>
      
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        whileHover={{ scale: 1.05 }}
        onClick={proceedToPathSelection}
        className="bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-6 rounded-lg flex"
      >
        Get Started <MoveRight className="w-6 h-6 ml-2" />
      </motion.button>
    </motion.div>
  )

  // Show loading state if we haven't checked auth yet
  if (!initialAuthChecked) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-[#0f0b22]' : 'bg-white'}`}>
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1, opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  // Render path selection step
  const renderPathSelection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center"
    >
      <h2 className={`text-2xl font-bold mb-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        Choose your path:
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => selectPath("experienced")}
          className={`flex-1 p-4 rounded-lg border-2 ${
            theme === 'dark' 
              ? 'border-purple-600 hover:bg-purple-900/30' 
              : 'border-purple-400 hover:bg-purple-100'
          }`}
        >
          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Experienced Investor
          </div>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => selectPath("new")}
          className={`flex-1 p-4 rounded-lg border-2 ${
            theme === 'dark' 
              ? 'border-green-600 hover:bg-green-900/30' 
              : 'border-green-400 hover:bg-green-100'
          }`}
        >
          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            New to DeFi
          </div>
        </motion.button>
      </div>
    </motion.div>
  )

  // Render wallet connection step
  const renderWalletConnection = () => {
    const message = userPath === "experienced"
      ? "We'll analyze your wallet activity to customize your plan."
      : "Don't worry, we won't require any funds or transactions."
      
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <div className={`text-xl mb-6 max-w-md font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Sign in to get started</div>
        <div className={`text-lg mb-6 max-w-md ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          {message}
        </div>
        <div className="mt-2">
          <CustomConnectWallet onConnected={handleWalletConnected} />
        </div>
      </motion.div>
    )
  }

  // Render wallet analysis step (for experienced investors)
  const renderWalletAnalysis = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center text-center max-w-md"
    >
      <div className={`text-xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        Analyzing your wallet...
      </div>
      <div className="w-full max-w-sm">
        <div className={`h-2 w-full rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5 }}
            className="h-full bg-green-500 rounded-full"
          ></motion.div>
        </div>
      </div>
      <div className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Examining transaction history, protocol interactions, and asset preferences...
      </div>
    </motion.div>
  )

  // Render preferences step (for both experienced investors and new users)
  const renderPreferences = () => {
    const currentProfile = profile || { title: "", description: "" }
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          Here's what we found:
        </div>
        <div className={`p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-purple-900/20 text-white' : 'bg-purple-100 text-black'}`}>
          <p className="mb-2 text-lg font-bold">You are a <span className="text-purple-400">{currentProfile.title}</span></p>
          <p>{currentProfile.description}</p>
        </div>
        <div className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          We'll use these insights to personalize your experience
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => router.push("/home")}
          className="bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-5 rounded-lg"
        >
          Continue to Dashboard
        </motion.button>
      </motion.div>
    )
  }

  // Render quiz step (for new users)
  const renderQuiz = () => {
    const questions = [
      {
        id: "level",
        question: "How familiar are you with DeFi or crypto investing?",
        options: [
          { value: "Beginner", label: "I'm new to DeFi" },
          { value: "Intermediate", label: "I've used Defi before" },
          { value: "Advanced", label: "I know what I'm doing, I just want speed" }
        ]
      },
      {
        id: "preference",
        question: "Do you prefer stable returns or big growth?",
        options: [
          { value: "stable", label: "Stable, predictable returns" },
          { value: "growth", label: "High growth potential" },
          { value: "mixed", label: "A mix of both" }
        ]
      },
      {
        id: "action",
        question: "How hands on do you want to be with your investments?",
        options: [
          { value: "auto", label: "Set it and forget it, I want everything automated" },
          { value: "mixed", label: "I like to check occasionally and tweak things" },
          { value: "control", label: "I want full control and frequent updates" }
        ]
      }
    ]

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          Let us curate your investment feed
        </div>
        
        <div className="w-full">
          {questions.map((q, index) => (
            <div key={q.id} className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-[#2e165e]' : 'bg-[#d4f5d4]'}`}>
              <div className={`mb-3 font-medium text-left ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {q.question}
              </div>
              <div className="flex flex-col gap-2">
                {q.options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setQuizAnswers(prev => ({...prev, [q.id]: option.value}))
                    }}
                    className={`p-3 text-left rounded-md transition-colors ${
                      quizAnswers[q.id] === option.value
                        ? theme === 'dark'
                          ? 'bg-[#8e27c5] text-white'
                          : 'bg-green-600 text-white'
                        : theme === 'dark'
                          ? 'bg-[#410688] hover:bg-[#7c05bd] text-white'
                          : 'bg-white hover:bg-green-700/50 text-black'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleQuizCompleted}
          disabled={Object.keys(quizAnswers).length < 3}
          className={`mt-2 font-medium py-3 px-5 rounded-lg ${
            Object.keys(quizAnswers).length < 3
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          Generate My Profile
        </motion.button>
      </motion.div>
    )
  }

  // Render generating preferences step (for new users)
  const renderGeneratingPreferences = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center text-center max-w-md"
    >
      <div className={`text-xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        Creating your personalized profile...
      </div>
      <div className="w-full max-w-sm">
        <div className={`h-2 w-full rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5 }}
            className="h-full bg-green-500 rounded-full"
          ></motion.div>
        </div>
      </div>
      <div className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Analyzing your preferences and determining your investor profile...
      </div>
    </motion.div>
  )
  
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${theme === 'dark' ? 'bg-[#0f0b22]' : 'bg-white'}`}>
      {/* Only show logo on screens after welcome but not on welcome screen */}
      {onboardingStep !== "welcome" && onboardingStep !== "path-selection" && (
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
      {onboardingStep !== "welcome" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-8 text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
          onClick={handleBackClick}
        >
          {onboardingStep === "wallet-analysis" || onboardingStep === "preferences" || 
           onboardingStep === "generating-preferences" ? null : "← Go back"}
        </motion.button>
      )}
    </div>
  )
}
