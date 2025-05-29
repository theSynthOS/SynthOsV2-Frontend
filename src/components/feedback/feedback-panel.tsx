// // "use client";

// // import { useState } from "react";
// // import { ArrowLeft, MessageCircle, CheckCircle, X } from "lucide-react";
// // import { useTheme } from "next-themes";

// // interface FeedbackPanelProps {
// //   isOpen: boolean;
// //   onClose: () => void;
// // }

// // const PROTOCOL_OPTIONS = [
// //   "Aave",
// //   "Uniswap",
// //   "Compound",
// //   "Curve",
// //   "Balancer",
// //   "Other",
// // ];
// // const STRATEGY_OPTIONS = [
// //   "Lending",
// //   "Yield Farming",
// //   "Staking",
// //   "Liquidity Provisioning",
// //   "Leverage",
// //   "Other",
// // ];

// // export default function FeedbackPanel({ isOpen, onClose }: FeedbackPanelProps) {
// //   const { theme } = useTheme();
// //   const [isExiting, setIsExiting] = useState(false);
// //   const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
// //   const [protocolOther, setProtocolOther] = useState("");
// //   const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
// //   const [strategyOther, setStrategyOther] = useState("");
// //   const [rating, setRating] = useState(5);
// //   const [submitted, setSubmitted] = useState(false);
// //   const [showTelegram, setShowTelegram] = useState(false);
// //   const [isTelegramExiting, setIsTelegramExiting] = useState(false);

// //   const handleGoBack = () => {
// //     setIsExiting(true);
// //     setTimeout(() => {
// //       onClose();
// //       setIsExiting(false);
// //     }, 300);
// //   };

// //   const handleMultiSelect = (option: string, selected: string[], setSelected: (v: string[]) => void) => {
// //     if (selected.includes(option)) {
// //       setSelected(selected.filter((item) => item !== option));
// //     } else {
// //       setSelected([...selected, option]);
// //     }
// //   };

// //   const handleSubmit = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     setSubmitted(true);
// //     setTimeout(() => {
// //       setShowTelegram(true);
// //       setSubmitted(false);
// //       setSelectedProtocols([]);
// //       setProtocolOther("");
// //       setSelectedStrategies([]);
// //       setStrategyOther("");
// //       setRating(5);
// //     }, 1000);
// //   };

// //   const handleTelegramClose = () => {
// //     setIsTelegramExiting(true);
// //     setTimeout(() => {
// //       setShowTelegram(false);
// //       setIsTelegramExiting(false);
// //     }, 300);
// //   };

// //   const canSubmit =
// //     selectedProtocols.length > 0 &&
// //     selectedStrategies.length > 0 &&
// //     (!selectedProtocols.includes("Other") || protocolOther.trim().length > 0) &&
// //     (!selectedStrategies.includes("Other") || strategyOther.trim().length > 0) &&
// //     !submitted;

// //   if (!isOpen) return null;

// //   return (
// //     <div className="fixed inset-0 z-50 flex">
// //       {/* Backdrop */}
// //       <div
// //         className={`fixed inset-0 ${theme === "dark" ? "bg-black/20" : "bg-gray-900/10"} backdrop-blur-[2px]`}
// //         style={{
// //           animation: isExiting ? "fadeOut 0.3s ease-out" : "fadeIn 0.3s ease-out",
// //         }}
// //         onClick={handleGoBack}
// //       />

// //       {/* Panel */}
// //       <div
// //         className="relative ml-auto h-full w-full max-w-2xl flex flex-col shadow-2xl"
// //         style={{
// //           animation: isExiting ? "slideOut 0.3s ease-out" : "slideIn 0.3s ease-out",
// //           borderRadius: "16px 0 0 16px",
// //           boxShadow: theme === "dark"
// //             ? "0 0 40px rgba(0,0,0,0.3)"
// //             : "0 0 40px rgba(0,0,0,0.1)",
// //         }}
// //       >
// //         {/* HEADER (sticks to top) */}
// //         <div
// //           className={`flex items-center justify-between px-8 pt-10 pb-8 bg-opacity-90 sticky top-0 z-10
// //             ${theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-white text-black"}`}
// //           style={{ borderTopLeftRadius: 16, borderTopRightRadius: 0 }}
// //         >
// //           <button
// //             onClick={handleGoBack}
// //             className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
// //             aria-label="Go back"
// //           >
// //             <ArrowLeft className="h-7 w-7" />
// //           </button>
// //           <h1 className="text-2xl font-bold flex items-center gap-2">
// //             <MessageCircle className="h-7 w-7" /> Feedback
// //           </h1>
// //           <div className="w-10 h-10"></div>
// //         </div>

// //         {/* SCROLLABLE CONTENT */}
// //         <div
// //           className={`flex-1 min-h-0 px-8 pb-15 pt-0 overflow-y-auto hide-scrollbar ${
// //             theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-white text-black"
// //           }`}
// //         >
// //           <form className="flex flex-col space-y-8" onSubmit={handleSubmit} id="feedback-form">
// //             {/* Q1 */}
// //             <div>
// //               <label className="block font-semibold mb-2">1. What DeFi protocol do you want to see?</label>
// //               <div className="flex flex-col gap-2 pb-2">
// //                 {PROTOCOL_OPTIONS.map((option) => (
// //                   <label key={option} className={`flex items-center px-3 py-1 rounded-full border cursor-pointer transition-colors
// //                     ${selectedProtocols.includes(option)
// //                       ? (theme === "dark"
// //                           ? "bg-purple-600 border-purple-500 text-white"
// //                           : "bg-purple-100 border-purple-500 text-purple-600")
// //                       : (theme === "dark"
// //                           ? "bg-gray-800 border-gray-700 text-gray-200"
// //                           : "bg-gray-100 border-gray-300 text-gray-700")}
// //                   `}>
// //                     <input
// //                       type="checkbox"
// //                       className="mr-2 accent-purple-600"
// //                       checked={selectedProtocols.includes(option)}
// //                       onChange={() => handleMultiSelect(option, selectedProtocols, setSelectedProtocols)}
// //                     />
// //                     {option}
// //                   </label>
// //                 ))}
// //               </div>
// //               {selectedProtocols.includes("Other") && (
// //                 <input
// //                   type="text"
// //                   className="mt-2 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
// //                   placeholder="Other protocol..."
// //                   value={protocolOther}
// //                   onChange={e => setProtocolOther(e.target.value)}
// //                 />
// //               )}
// //             </div>
// //             {/* Q2 */}
// //             <div>
// //               <label className="block font-semibold mb-2">2. What DeFi strategy do you want to see?</label>
// //               <div className="flex flex-col gap-2 pb-2">
// //                 {STRATEGY_OPTIONS.map((option) => (
// //                   <label key={option} className={`flex items-center px-3 py-1 rounded-full border cursor-pointer transition-colors
// //                     ${selectedStrategies.includes(option)
// //                       ? (theme === "dark"
// //                           ? "bg-purple-600 border-purple-500 text-white"
// //                           : "bg-purple-100 border-purple-600 text-purple-700")
// //                       : (theme === "dark"
// //                           ? "bg-gray-800 border-gray-700 text-gray-200"
// //                           : "bg-gray-100 border-gray-300 text-gray-700")}
// //                   `}>
// //                     <input
// //                       type="checkbox"
// //                       className="mr-2 accent-purple-600"
// //                       checked={selectedStrategies.includes(option)}
// //                       onChange={() => handleMultiSelect(option, selectedStrategies, setSelectedStrategies)}
// //                     />
// //                     {option}
// //                   </label>
// //                 ))}
// //               </div>
// //               {selectedStrategies.includes("Other") && (
// //                 <input
// //                   type="text"
// //                   className="mt-2 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
// //                   placeholder="Other strategy..."
// //                   value={strategyOther}
// //                   onChange={e => setStrategyOther(e.target.value)}
// //                 />
// //               )}
// //             </div>
// //             {/* Q3 */}
// //             <div>
// //               <label className="block font-semibold mb-2">3. How do you like our app?</label>
// //               <div className="flex flex-col items-center gap-2">
// //                 <div className="relative w-full flex flex-col items-center" style={{ minHeight: 40 }}>
// //                   <div
// //                     style={{
// //                       position: 'absolute',
// //                       left: `calc(${(rating - 1) / 9 * 100}% - 16px)`,
// //                       top: 0,
// //                       transition: 'left 0.1s',
// //                       width: 32,
// //                       textAlign: 'center',
// //                       pointerEvents: 'none',
// //                     }}
// //                     className="font-bold text-purple-600 text-lg select-none"
// //                   >
// //                     {rating}
// //                   </div>
// //                   <div className="flex items-center w-full gap-4 mt-6">
// //                     <span className="text-sm">1</span>
// //                     <input
// //                       type="range"
// //                       min={1}
// //                       max={10}
// //                       value={rating}
// //                       onChange={e => setRating(Number(e.target.value))}
// //                       className="flex-1 accent-purple-600"
// //                     />
// //                     <span className="text-sm">10</span>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </form>
// //         </div>

// //         {/* Fixed Submit Button */}
// //         <div className="sticky bottom-0 left-0 w-full max-w-2xl px-8 pb-8 pt-4 bg-opacity-90 z-20"
// //             style={{
// //                 background: theme === "dark"
// //                 ? "linear-gradient(to top, #0f0b22 90%, transparent)"
// //                 : "linear-gradient(to top, #fff 90%, transparent)",
// //                 borderBottomLeftRadius: 16,
// //                 borderBottomRightRadius: 0,
// //             }}
// //             >
// //             <button
// //                 type="submit"
// //                 form="feedback-form"
// //                 className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-lg transition-colors duration-200
// //                 ${canSubmit
// //                     ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
// //                     : "bg-gray-200 text-gray-400 cursor-not-allowed"}
// //                 `}
// //                 disabled={!canSubmit}
// //             >
// //                 {submitted ? <CheckCircle className="h-5 w-5" /> : null}
// //                 {submitted ? "Thank you!" : "Submit Feedback"}
// //             </button>
// //             </div>
// //       </div>

// //       {/* Telegram Modal */}
// //       {showTelegram && (
// //         <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
// //             <div
// //             className={`bg-white dark:bg-[#18103a] rounded-xl p-8 shadow-lg flex flex-col items-center gap-4 transition-all duration-300 ${
// //                 isTelegramExiting
// //                 ? "opacity-0 translate-y-8"
// //                 : "opacity-100 translate-y-0"
// //             }`}
// //             style={{
// //                 minWidth: 320,
// //                 maxWidth: 400,
// //             }}
// //             >
// //             <h2 className="text-xl font-bold mb-2 text-center">
// //                 Thank you for your feedback!
// //             </h2>
// //             <p className="mb-4 text-center">
// //                 Join our community for updates and discussion:
// //             </p>
// //             <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
// //                 <a
// //                 href="https://t.me/+x8mewakKNJNmY2Nl"
// //                 target="_blank"
// //                 rel="noopener noreferrer"
// //                 className="flex items-center justify-center px-5 py-2 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors w-full sm:w-auto whitespace-nowrap"
// //                 >
// //                 <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
// //                     <path d="M9.04 14.66l-.38 3.78c.54 0 .77-.23 1.05-.51l2.52-2.38 5.23 3.81c.96.53 1.64.25 1.88-.89l3.4-16.03c.31-1.47-.54-2.05-1.48-1.7L2.27 9.52c-1.44.58-1.43 1.42-.25 1.8l4.13 1.29L17.72 6.18c.48-.28.92-.13.56.15"/>
// //                 </svg>
// //                 Join Telegram
// //                 </a>
// //                 <a
// //                 href="https://x.com/SynthOS__" 
// //                 target="_blank"
// //                 rel="noopener noreferrer"
// //                 className="flex items-center justify-center px-5 py-2 rounded-full bg-black text-white font-semibold hover:bg-gray-900 transition-colors w-full sm:w-auto whitespace-nowrap"
// //                 >
// //                 <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 mr-2">
// //                     <g>
// //                     <path fill="currentColor" d="M18.89 3.11A8.94 8.94 0 0021 6.09c-.34.15-.71.27-1.1.32a4.41 4.41 0 001.93-2.44 8.94 8.94 0 01-2.83 1.08 4.49 4.49 0 00-7.67 4.09A12.73 12.73 0 013 4.64a4.48 4.48 0 001.39 5.98c-.31-.01-.6-.09-.86-.24v.02c0 2.17 1.54 3.97 3.6 4.38a4.54 4.54 0 01-2.05.08 4.49 4.49 0 004.19 3.12A9.01 9.01 0 013 19.54a12.79 12.79 0 006.92 2.03c8.32 0 12.88-6.89 12.88-12.87 0-.2-.01-.41-.02-.61A9.17 9.17 0 0024 4.59a9.2 9.2 0 01-2.64.72 4.53 4.53 0 001.98-2.5"/>
// //                     </g>
// //                 </svg>
// //                 Follow us on X
// //                 </a>
// //             </div>
// //             <button
// //                 onClick={handleTelegramClose}
// //                 className="mt-4 text-gray-500 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
// //             >
// //                 Close
// //             </button>
// //             </div>
// //         </div>
// //         )}


// //     </div>
// //   );
// // }

// // // Hide horizontal scroll for the form content
// // // Add this to your global CSS or module CSS:
// // /*
// // .hide-scrollbar::-webkit-scrollbar { display: none; }
// // .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
// // */



// "use client";

// import { useState } from "react";
// import { ArrowLeft, MessageCircle, CheckCircle } from "lucide-react";
// import { useTheme } from "next-themes";

// interface FeedbackPanelProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const PROTOCOL_OPTIONS = [
//   "Aave",
//   "Uniswap",
//   "Compound",
//   "Curve",
//   "Balancer",
//   "Other",
// ];
// const STRATEGY_OPTIONS = [
//   "Lending",
//   "Yield Farming",
//   "Staking",
//   "Liquidity Provisioning",
//   "Leverage",
//   "Other",
// ];

// export default function FeedbackPanel({ isOpen, onClose }: FeedbackPanelProps) {
//   const { theme } = useTheme();
//   const [isExiting, setIsExiting] = useState(false);
//   const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
//   const [protocolOther, setProtocolOther] = useState("");
//   const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
//   const [strategyOther, setStrategyOther] = useState("");
//   const [rating, setRating] = useState(5);
//   const [submitted, setSubmitted] = useState(false);
//   const [showTelegram, setShowTelegram] = useState(false);
//   const [isTelegramExiting, setIsTelegramExiting] = useState(false);

//   const handleGoBack = () => {
//     setIsExiting(true);
//     setTimeout(() => {
//       onClose();
//       setIsExiting(false);
//     }, 300);
//   };

//   const handleMultiSelect = (
//     option: string,
//     selected: string[],
//     setSelected: (v: string[]) => void
//   ) => {
//     if (selected.includes(option)) {
//       setSelected(selected.filter((item) => item !== option));
//     } else {
//       setSelected([...selected, option]);
//     }
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//      // 1. Collect feedback data from the form state
//     const feedbackData = {
//         protocols: selectedProtocols.includes("Other")
//         ? [
//             ...selectedProtocols.filter((p) => p !== "Other"),
//             protocolOther.trim(),
//             ].filter(Boolean) // remove empty
//         : selectedProtocols,
//         strategies: selectedStrategies.includes("Other")
//         ? [
//             ...selectedStrategies.filter((s) => s !== "Other"),
//             strategyOther.trim(),
//             ].filter(Boolean)
//         : selectedStrategies,
//         rating,
//     };

//     // 2. Log the data to the console
//     console.log("Feedback Data:", feedbackData);

//     // 3. Continue with your existing logic (show modal, reset fields, etc)
//     setSubmitted(true);
//     setTimeout(() => {
//         setShowTelegram(true);
//         setSubmitted(false);
//         setSelectedProtocols([]);
//         setProtocolOther("");
//         setSelectedStrategies([]);
//         setStrategyOther("");
//         setRating(5);
//     }, 1000);
    
//     setSubmitted(true);
//     setTimeout(() => {
//       setShowTelegram(true);
//       setSubmitted(false);
//       setSelectedProtocols([]);
//       setProtocolOther("");
//       setSelectedStrategies([]);
//       setStrategyOther("");
//       setRating(5);
//     }, 1000);
//   };

//   const handleTelegramClose = () => {
//     setIsTelegramExiting(true);
//     setTimeout(() => {
//       setShowTelegram(false);
//       setIsTelegramExiting(false);
//     }, 300);
//   };

//   const canSubmit =
//     selectedProtocols.length > 0 &&
//     selectedStrategies.length > 0 &&
//     (!selectedProtocols.includes("Other") || protocolOther.trim().length > 0) &&
//     (!selectedStrategies.includes("Other") || strategyOther.trim().length > 0) &&
//     !submitted;

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex">
//       {/* Backdrop */}
//       <div
//         className={`fixed inset-0 ${
//           theme === "dark" ? "bg-black/30" : "bg-gray-900/20"
//         } backdrop-blur-[2px]`}
//         style={{
//           animation: isExiting ? "fadeOut 0.3s ease-out" : "fadeIn 0.3s ease-out",
//         }}
//         onClick={handleGoBack}
//       />

//       {/* Panel */}
//       <div
//         className="relative ml-auto h-full w-full max-w-2xl flex flex-col shadow-2xl bg-white dark:bg-[#0f0b22] rounded-none sm:rounded-l-2xl"
//         style={{
//           animation: isExiting ? "slideOut 0.3s ease-out" : "slideIn 0.3s ease-out",
//         }}
//       >
//         {/* HEADER */}
//         <div
//           className={`flex items-center justify-between px-4 sm:px-8 pt-6 sm:pt-10 pb-6 sm:pb-8 sticky top-0 z-10 ${
//             theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-white text-black"
//           }`}
//           style={{ borderTopLeftRadius: '1rem' }}
//         >
//           <button
//             onClick={handleGoBack}
//             className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
//             aria-label="Go back"
//           >
//             <ArrowLeft className="h-7 w-7" />
//           </button>
//           <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
//             <MessageCircle className="h-7 w-7" /> Feedback
//           </h1>
//           <div className="w-10 h-10"></div>
//         </div>

//         {/* SCROLLABLE CONTENT */}
//         <div
//           className={`flex-1 min-h-0 px-4 sm:px-8 pb-12 pt-0 overflow-y-auto hide-scrollbar ${
//             theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-white text-black"
//           }`}
//         >
//           <form
//             className="flex flex-col space-y-8 text-base sm:text-lg"
//             onSubmit={handleSubmit}
//             id="feedback-form"
//           >
//             {/* Q1 */}
//             <div>
//               <label className="block font-semibold mb-2">
//                 1. What DeFi protocol do you want to see?
//               </label>
//               <div className="flex flex-col gap-2 pb-2">
//                 {PROTOCOL_OPTIONS.map((option) => (
//                   <label
//                     key={option}
//                     className={`flex items-center px-3 py-2 rounded-full border cursor-pointer transition-colors
//                     ${selectedProtocols.includes(option)
//                         ? theme === "dark"
//                           ? "bg-purple-600 border-purple-400 text-white"
//                           : "bg-purple-100 border-purple-500 text-purple-600"
//                         : theme === "dark"
//                           ? "bg-gray-800 border-gray-700 text-gray-200"
//                           : "bg-gray-100 border-gray-300 text-gray-700"
//                       }`}
//                   >
//                     <input
//                       type="checkbox"
//                       className="mr-2 accent-purple-600"
//                       checked={selectedProtocols.includes(option)}
//                       onChange={() =>
//                         handleMultiSelect(
//                           option,
//                           selectedProtocols,
//                           setSelectedProtocols
//                         )
//                       }
//                     />
//                     {option}
//                   </label>
//                 ))}
//               </div>
//               {selectedProtocols.includes("Other") && (
//                 <input
//                   type="text"
//                   className="mt-2 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
//                   placeholder="Other protocol..."
//                   value={protocolOther}
//                   onChange={(e) => setProtocolOther(e.target.value)}
//                 />
//               )}
//             </div>
//             {/* Q2 */}
//             <div>
//               <label className="block font-semibold mb-2">
//                 2. What DeFi strategy do you want to see?
//               </label>
//               <div className="flex flex-col gap-2 pb-2">
//                 {STRATEGY_OPTIONS.map((option) => (
//                   <label
//                     key={option}
//                     className={`flex items-center px-3 py-2 rounded-full border cursor-pointer transition-colors
//                     ${selectedStrategies.includes(option)
//                         ? theme === "dark"
//                           ? "bg-purple-600 border-purple-400 text-white"
//                           : "bg-purple-100 border-purple-600 text-purple-700"
//                         : theme === "dark"
//                           ? "bg-gray-800 border-gray-700 text-gray-200"
//                           : "bg-gray-100 border-gray-300 text-gray-700"
//                       }`}
//                   >
//                     <input
//                       type="checkbox"
//                       className="mr-2 accent-purple-600"
//                       checked={selectedStrategies.includes(option)}
//                       onChange={() =>
//                         handleMultiSelect(
//                           option,
//                           selectedStrategies,
//                           setSelectedStrategies
//                         )
//                       }
//                     />
//                     {option}
//                   </label>
//                 ))}
//               </div>
//               {selectedStrategies.includes("Other") && (
//                 <input
//                   type="text"
//                   className="mt-2 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
//                   placeholder="Other strategy..."
//                   value={strategyOther}
//                   onChange={(e) => setStrategyOther(e.target.value)}
//                 />
//               )}
//             </div>
//             {/* Q3 */}
//             <div>
//               <label className="block font-semibold mb-2">
//                 3. How do you like our app?
//               </label>
//               <div className="flex flex-col items-center gap-2">
//                 <div
//                   className="relative w-full flex flex-col items-center"
//                   style={{ minHeight: 40 }}
//                 >
//                   <div
//                     style={{
//                       position: "absolute",
//                       left: `calc(${(rating - 1) / 9 * 100}% - 16px)`,
//                       top: 0,
//                       transition: "left 0.1s",
//                       width: 32,
//                       textAlign: "center",
//                       pointerEvents: "none",
//                     }}
//                     className="font-bold text-purple-600 text-lg select-none"
//                   >
//                     {rating}
//                   </div>
//                   <div className="flex items-center w-full gap-4 mt-6">
//                     <span className="text-sm">1</span>
//                     <input
//                       type="range"
//                       min={1}
//                       max={10}
//                       value={rating}
//                       onChange={(e) => setRating(Number(e.target.value))}
//                       className="flex-1 accent-purple-600"
//                     />
//                     <span className="text-sm">10</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </form>
//         </div>

//         {/* Fixed Submit Button */}
//         <div
//           className="sticky bottom-0 left-0 w-full px-4 sm:px-8 pb-8 pt-4 bg-opacity-90 z-20"
//           style={{
//             background:
//               theme === "dark"
//                 ? "linear-gradient(to top, #0f0b22 90%, transparent)"
//                 : "linear-gradient(to top, #fff 90%, transparent)",
//             borderBottomLeftRadius: '1rem',
//           }}
//         >
//           <button
//             type="submit"
//             form="feedback-form"
//             className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-base sm:text-lg transition-colors duration-200
//               ${canSubmit
//                 ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
//                 : "bg-gray-200 text-gray-400 cursor-not-allowed"
//               }`}
//             disabled={!canSubmit}
//           >
//             {submitted ? <CheckCircle className="h-5 w-5" /> : null}
//             {submitted ? "Thank you!" : "Submit Feedback"}
//           </button>
//         </div>
//       </div>

//       {/* Telegram Modal */}
//       {showTelegram && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 px-2">
//           <div
//             className={`bg-white dark:bg-[#18103a] rounded-xl p-6 sm:p-8 shadow-xl flex flex-col items-center gap-4 w-full max-w-xs sm:max-w-md transition-all duration-300 ${
//               isTelegramExiting
//                 ? "opacity-0 translate-y-8"
//                 : "opacity-100 translate-y-0"
//             }`}
//           >
//             <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">
//               Thank you for your feedback!
//             </h2>
//             <p className="mb-4 text-center text-base">
//               Join our community for updates and discussion:
//             </p>
//             <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
//               <a
//                 href="https://t.me/+x8mewakKNJNmY2Nl"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center justify-center px-5 py-2 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors w-full sm:w-auto whitespace-nowrap"
//               >
//                 <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M9.04 14.66l-.38 3.78c.54 0 .77-.23 1.05-.51l2.52-2.38 5.23 3.81c.96.53 1.64.25 1.88-.89l3.4-16.03c.31-1.47-.54-2.05-1.48-1.7L2.27 9.52c-1.44.58-1.43 1.42-.25 1.8l4.13 1.29L17.72 6.18c.48-.28.92-.13.56.15"/>
//                 </svg>
//                 Join Telegram
//               </a>
//               <a
//                 href="https://x.com/SynthOS__"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center justify-center px-5 py-2 rounded-full bg-black text-white font-semibold hover:bg-gray-900 transition-colors w-full sm:w-auto whitespace-nowrap"
//               >
//                 <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 mr-2">
//                   <g>
//                     <path fill="currentColor" d="M18.89 3.11A8.94 8.94 0 0021 6.09c-.34.15-.71.27-1.1.32a4.41 4.41 0 001.93-2.44 8.94 8.94 0 01-2.83 1.08 4.49 4.49 0 00-7.67 4.09A12.73 12.73 0 013 4.64a4.48 4.48 0 001.39 5.98c-.31-.01-.6-.09-.86-.24v.02c0 2.17 1.54 3.97 3.6 4.38a4.54 4.54 0 01-2.05.08 4.49 4.49 0 004.19 3.12A9.01 9.01 0 013 19.54a12.79 12.79 0 006.92 2.03c8.32 0 12.88-6.89 12.88-12.87 0-.2-.01-.41-.02-.61A9.17 9.17 0 0024 4.59a9.2 9.2 0 01-2.64.72 4.53 4.53 0 001.98-2.5"/>
//                   </g>
//                 </svg>
//                 Follow us on X
//               </a>
//             </div>
//             <button
//               onClick={handleTelegramClose}
//               className="mt-4 text-gray-500 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors w-full"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Hide horizontal scroll for the form content
// // Add this to your global CSS or module CSS:
// /*
// .hide-scrollbar::-webkit-scrollbar { display: none; }
// .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
// */


"use client";

import { useState } from "react";
import { ArrowLeft, MessageCircle, CheckCircle, X } from "lucide-react";
import { useTheme } from "next-themes";

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROTOCOL_OPTIONS = [
  "Aave",
  "Uniswap",
  "Compound",
  "Curve",
  "Balancer",
  "Other",
];
const STRATEGY_OPTIONS = [
  "Lending",
  "Yield Farming",
  "Staking",
  "Liquidity Provisioning",
  "Leverage",
  "Other",
];

export default function FeedbackPanel({ isOpen, onClose }: FeedbackPanelProps) {
  const { theme } = useTheme();
  const [isExiting, setIsExiting] = useState(false);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  const [protocolOther, setProtocolOther] = useState("");
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [strategyOther, setStrategyOther] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [isTelegramExiting, setIsTelegramExiting] = useState(false);

  const handleGoBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleMultiSelect = (
    option: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    if (selected.includes(option)) {
      setSelected(selected.filter((item) => item !== option));
    } else {
      setSelected([...selected, option]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Collect feedback data from the form state
    const feedbackData = {
      protocols: selectedProtocols.includes("Other")
        ? [
            ...selectedProtocols.filter((p) => p !== "Other"),
            protocolOther.trim(),
          ].filter(Boolean)
        : selectedProtocols,
      strategies: selectedStrategies.includes("Other")
        ? [
            ...selectedStrategies.filter((s) => s !== "Other"),
            strategyOther.trim(),
          ].filter(Boolean)
        : selectedStrategies,
      rating,
    };

    // 2. Log the data to the console
    console.log("Feedback Data:", feedbackData);

    setSubmitted(true);
    setTimeout(() => {
      setShowTelegram(true);
      setSubmitted(false);
      setSelectedProtocols([]);
      setProtocolOther("");
      setSelectedStrategies([]);
      setStrategyOther("");
      setRating(5);
    }, 1000);
  };

  const handleTelegramClose = () => {
    setIsTelegramExiting(true);
    setTimeout(() => {
      setShowTelegram(false);
      setIsTelegramExiting(false);
    }, 300);
  };

  const canSubmit =
    selectedProtocols.length > 0 &&
    selectedStrategies.length > 0 &&
    (!selectedProtocols.includes("Other") || protocolOther.trim().length > 0) &&
    (!selectedStrategies.includes("Other") || strategyOther.trim().length > 0) &&
    !submitted;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${
          theme === "dark" ? "bg-black/30" : "bg-gray-900/20"
        } backdrop-blur-[2px]`}
        style={{
          animation: isExiting ? "fadeOut 0.3s ease-out" : "fadeIn 0.3s ease-out",
        }}
        onClick={handleGoBack}
      />

      {/* Panel as Bottom Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 h-[95vh] w-full max-w-2xl flex flex-col shadow-2xl bg-white dark:bg-[#0f0b22] rounded-t-2xl z-50"
        style={{
            animation: isExiting
            ? "slideOutDown 0.4s ease-in-out forwards"
            : "slideInUp 0.4s ease-in-out forwards",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.14)",
        }}
        >
        {/* HEADER */}
        <div
          className={`flex items-center justify-between px-4 sm:px-8 pt-6 sm:pt-10 pb-6 sm:pb-8 sticky top-0 z-10 ${
            theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-white text-black"
          }`}
          style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}
        >
          <button
            onClick={handleGoBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-7 w-7" /> Feedback
          </h1>
          <div className="w-10 h-10"></div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div
          className={`flex-1 min-h-0 px-4 sm:px-8 pb-12 pt-0 overflow-y-auto hide-scrollbar ${
            theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-white text-black"
          }`}
        >
          <form
            className="flex flex-col space-y-8 text-base sm:text-lg"
            onSubmit={handleSubmit}
            id="feedback-form"
          >
            {/* Q1 */}
            <div>
              <label className="block font-semibold mb-2">
                1. What DeFi protocol do you want to see?
              </label>
              <div className="flex flex-col gap-2 pb-2">
                {PROTOCOL_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className={`flex items-center px-3 py-2 rounded-full border cursor-pointer transition-colors
                    ${selectedProtocols.includes(option)
                        ? theme === "dark"
                          ? "bg-purple-600 border-purple-400 text-white"
                          : "bg-purple-100 border-purple-500 text-purple-600"
                        : theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-gray-200"
                          : "bg-gray-100 border-gray-300 text-gray-700"
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="mr-2 accent-purple-600"
                      checked={selectedProtocols.includes(option)}
                      onChange={() =>
                        handleMultiSelect(
                          option,
                          selectedProtocols,
                          setSelectedProtocols
                        )
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
              {selectedProtocols.includes("Other") && (
                <input
                  type="text"
                  className="mt-2 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                  placeholder="Other protocol..."
                  value={protocolOther}
                  onChange={(e) => setProtocolOther(e.target.value)}
                />
              )}
            </div>
            {/* Q2 */}
            <div>
              <label className="block font-semibold mb-2">
                2. What DeFi strategy do you want to see?
              </label>
              <div className="flex flex-col gap-2 pb-2">
                {STRATEGY_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className={`flex items-center px-3 py-2 rounded-full border cursor-pointer transition-colors
                    ${selectedStrategies.includes(option)
                        ? theme === "dark"
                          ? "bg-purple-600 border-purple-400 text-white"
                          : "bg-purple-100 border-purple-600 text-purple-700"
                        : theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-gray-200"
                          : "bg-gray-100 border-gray-300 text-gray-700"
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="mr-2 accent-purple-600"
                      checked={selectedStrategies.includes(option)}
                      onChange={() =>
                        handleMultiSelect(
                          option,
                          selectedStrategies,
                          setSelectedStrategies
                        )
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
              {selectedStrategies.includes("Other") && (
                <input
                  type="text"
                  className="mt-2 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                  placeholder="Other strategy..."
                  value={strategyOther}
                  onChange={(e) => setStrategyOther(e.target.value)}
                />
              )}
            </div>
            {/* Q3 */}
            <div>
              <label className="block font-semibold mb-2">
                3. How do you like our app?
              </label>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative w-full flex flex-col items-center"
                  style={{ minHeight: 40 }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: `calc(${(rating - 1) / 9 * 100}% - 16px)`,
                      top: 0,
                      transition: "left 0.1s",
                      width: 32,
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                    className="font-bold text-purple-600 text-lg select-none"
                  >
                    {rating}
                  </div>
                  <div className="flex items-center w-full gap-4 mt-6">
                    <span className="text-sm">1</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="flex-1 accent-purple-600"
                    />
                    <span className="text-sm">10</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Submit Button */}
        <div
          className="sticky bottom-0 left-0 w-full px-4 sm:px-8 pb-8 pt-4 bg-opacity-90 z-20"
          style={{
            background:
              theme === "dark"
                ? "linear-gradient(to top, #0f0b22 90%, transparent)"
                : "linear-gradient(to top, #fff 90%, transparent)",
            borderBottomLeftRadius: '1rem',
            borderBottomRightRadius: '1rem',
          }}
        >
          <button
            type="submit"
            form="feedback-form"
            className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-base sm:text-lg transition-colors duration-200
              ${canSubmit
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            disabled={!canSubmit}
          >
            {submitted ? <CheckCircle className="h-5 w-5" /> : null}
            {submitted ? "Thank you!" : "Submit Feedback"}
          </button>
        </div>
      </div>

      {/* Telegram Modal */}
      {showTelegram && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 px-2">
          <div
            className={`bg-white dark:bg-[#18103a] rounded-xl p-6 sm:p-8 shadow-xl flex flex-col items-center gap-4 w-full max-w-xs sm:max-w-md transition-all duration-300 ${
              isTelegramExiting
                ? "opacity-0 translate-y-8"
                : "opacity-100 translate-y-0"
            }`}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">
              Thank you for your feedback!
            </h2>
            <p className="mb-4 text-center text-base">
              Join our community for updates and discussion:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <a
                href="https://t.me/+x8mewakKNJNmY2Nl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-5 py-2 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors w-full sm:w-auto whitespace-nowrap"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.04 14.66l-.38 3.78c.54 0 .77-.23 1.05-.51l2.52-2.38 5.23 3.81c.96.53 1.64.25 1.88-.89l3.4-16.03c.31-1.47-.54-2.05-1.48-1.7L2.27 9.52c-1.44.58-1.43 1.42-.25 1.8l4.13 1.29L17.72 6.18c.48-.28.92-.13.56.15"/>
                </svg>
                Join Telegram
              </a>
              <a
                href="https://x.com/SynthOS__"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-5 py-2 rounded-full bg-black text-white font-semibold hover:bg-gray-900 transition-colors w-full sm:w-auto whitespace-nowrap"
                >
                <svg
                    viewBox="0 0 300 300.251"
                    fill="currentColor"
                    className="h-5 w-5 mr-2"
                    aria-hidden="true"
                >
                    <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66" />
                </svg>
                Follow us on X
                </a>
            </div>
            <button
              onClick={handleTelegramClose}
              className="mt-4 text-gray-500 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hide horizontal scroll for the form content
// Add this to your global CSS or module CSS:
/*
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
*/
