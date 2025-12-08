"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function CopyAccessCodeButton({ accessCode }: { accessCode: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accessCode)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Access code copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy access code",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}

