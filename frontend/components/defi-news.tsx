"use client"

import { MessageSquare, Repeat2, Heart, Share } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface NewsItem {
  id: string
  author: string
  handle: string
  avatar: string
  content: string
  time: string
  likes: number
  retweets: number
  comments: number
  isVerified?: boolean
}

export default function DefiNews() {
  const [newsItems] = useState<NewsItem[]>([
    {
      id: "1",
      author: "DeFi Pulse",
      handle: "@defipulse",
      avatar: "/dynamic-programming-concept.png",
      content:
        "AAVE v3 liquidity mining program launches with boosted rewards for stablecoin suppliers. APYs reaching up to 8% for USDC deposits! #DeFi #AAVE",
      time: "2h",
      likes: 142,
      retweets: 38,
      comments: 12,
      isVerified: true,
    },
    {
      id: "2",
      author: "FX Protocol",
      handle: "@fxprotocol",
      avatar: "/fx-protocol-logo.png",
      content:
        "We're excited to announce our new ETH/USDC liquidity pool with enhanced yield farming rewards. Early depositors will receive bonus FX tokens! 🚀",
      time: "5h",
      likes: 89,
      retweets: 24,
      comments: 7,
      isVerified: true,
    },
    {
      id: "3",
      author: "Quill Finance",
      handle: "@quillfinance",
      avatar: "/quill-finance-logo.png",
      content:
        "Quill Vault V2 is coming next week with improved auto-compounding strategies and lower fees. Current APY projections at 14-16% for ETH vaults.",
      time: "1d",
      likes: 215,
      retweets: 76,
      comments: 31,
      isVerified: true,
    },
  ])

  return (
    <div className="px-4 py-2">
      <div className="flex items-center mb-2">
        <MessageSquare className="w-5 h-5 mr-2 text-white" />
        <h2 className="text-xl font-bold">DeFi Updates</h2>
      </div>
      <div className="space-y-4">
        {newsItems.map((item) => (
          <div key={item.id} className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                <Image src={item.avatar || "/placeholder.svg"} alt={item.author} width={40} height={40} />
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-semibold">{item.author}</span>
                  {item.isVerified && (
                    <span className="ml-1 text-blue-400">
                      <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                      </svg>
                    </span>
                  )}
                  <span className="text-gray-400 ml-1">
                    {item.handle} · {item.time}
                  </span>
                </div>
                <p className="mt-1">{item.content}</p>
                <div className="flex mt-3 text-gray-400 text-sm">
                  <div className="flex items-center mr-4">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span>{item.comments}</span>
                  </div>
                  <div className="flex items-center mr-4">
                    <Repeat2 className="w-4 h-4 mr-1" />
                    <span>{item.retweets}</span>
                  </div>
                  <div className="flex items-center mr-4">
                    <Heart className="w-4 h-4 mr-1" />
                    <span>{item.likes}</span>
                  </div>
                  <div className="flex items-center">
                    <Share className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
