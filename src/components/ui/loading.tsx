import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({ message = "logging in", className = "" }: LoadingProps) {
  const { theme } = useTheme();

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 
            size={32} 
            className={`${
              theme === "dark" ? "text-[#FFCA59]" : "text-[#8266E6]"
            }`}
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={`text-lg font-medium tracking-wide ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
          
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
} 