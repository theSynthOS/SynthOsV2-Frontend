"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface ProtocolChartProps {
  protocolId?: string
}

export default function ProtocolChart({ protocolId = "aave" }: ProtocolChartProps) {
  // Generate some random APY data that trends upward
  const generateData = () => {
    // Different starting points and volatility for each protocol
    let startValue = 4
    let volatility = 0.5

    if (protocolId === "fx") {
      startValue = 8
      volatility = 0.6
    } else if (protocolId === "quill") {
      startValue = 10
      volatility = 0.7
    }

    const data = []
    let value = startValue + Math.random() * 2

    for (let i = 0; i < 100; i++) {
      // Add some volatility but with an upward trend
      const change = (Math.random() - 0.45) * volatility
      value = Math.max(2, value + change)

      data.push({
        time: i,
        apy: value,
      })
    }

    return data
  }

  const data = generateData()

  return (
    <ChartContainer
      config={{
        apy: {
          label: "APY",
          color: "hsl(142, 76%, 60%)",
        },
      }}
      className="h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="apy"
            stroke="hsl(142, 76%, 60%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
