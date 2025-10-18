import * as React from "react"

import { cn } from "@/lib/utils"

export interface ChartTooltipContentProps {
  payload: any[]
  label: string
  config?: any
}

export function ChartTooltipContent({ payload, label, config }: ChartTooltipContentProps) {
  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
      <div className="mb-2 text-sm font-bold">{label}</div>
      <ul className="grid gap-1">
        {payload.map((item, i) => {
          const label = config?.[item.dataKey]?.label || item.dataKey
          const color = config?.[item.dataKey]?.color || item.color

          return (
            <li key={i} className="grid grid-cols-[1fr_1fr] items-center gap-x-2 text-xs">
              <span className="text-muted-foreground">{label}:</span>
              <span className="font-medium">
                {item.value}
                {config?.[item.dataKey]?.unit}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: any
}

function ChartContainer({ className, config, children, ...props }: ChartContainerProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { config })
        }
        return child
      })}
    </div>
  )
}

export { ChartContainer }

export const Chart = () => null
export const ChartTooltip = () => null
