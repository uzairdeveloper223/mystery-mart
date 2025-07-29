"use client"

import { Button } from "@/components/ui/button"
import { Heart, ExternalLink } from "lucide-react"

interface DonateButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
  showIcon?: boolean
  text?: string
}

export function DonateButton({
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  text = "Support Developer",
}: DonateButtonProps) {
  const handleDonate = () => {
    window.open("https://buymeacoffee.com/uzairxdev2w", "_blank", "noopener,noreferrer")
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDonate}
      className={`${className} bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0`}
    >
      {showIcon && <Heart className="h-4 w-4 mr-2" />}
      {text}
      <ExternalLink className="h-3 w-3 ml-2" />
    </Button>
  )
}
