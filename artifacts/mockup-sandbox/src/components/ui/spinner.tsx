import { Loader2Icon } from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...(props as Omit<React.ComponentProps<typeof Loader2Icon>, "ref">)}
    />
  )
}

export { Spinner }
