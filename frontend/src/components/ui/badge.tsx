import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Security severity variants
        critical: "border-transparent bg-nova-red-100 text-nova-red-800 dark:bg-nova-red-900/20 dark:text-nova-red-300",
        high: "border-transparent bg-nova-orange-100 text-nova-orange-800 dark:bg-nova-orange-900/20 dark:text-nova-orange-300",
        medium: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
        low: "border-transparent bg-nova-green-100 text-nova-green-800 dark:bg-nova-green-900/20 dark:text-nova-green-300",
        info: "border-transparent bg-nova-blue-100 text-nova-blue-800 dark:bg-nova-blue-900/20 dark:text-nova-blue-300",
        // Status variants
        success: "border-transparent bg-nova-green-100 text-nova-green-800 dark:bg-nova-green-900/20 dark:text-nova-green-300",
        warning: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
        error: "border-transparent bg-nova-red-100 text-nova-red-800 dark:bg-nova-red-900/20 dark:text-nova-red-300",
        // Special variants
        gradient: "border-transparent bg-gradient-to-r from-nova-blue-600 to-nova-green-600 text-white",
        glow: "border-transparent bg-primary text-primary-foreground shadow-glow",
        glass: "glass text-foreground border-white/20",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-2xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
}

function Badge({ 
  className, 
  variant, 
  size, 
  icon, 
  removable = false, 
  onRemove, 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
          type="button"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
