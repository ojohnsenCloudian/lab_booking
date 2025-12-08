"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { ConnectionInfo } from "@prisma/client"

interface ConnectionInfoDisplayProps {
  connectionInfo: ConnectionInfo
}

export function ConnectionInfoDisplay({ connectionInfo }: ConnectionInfoDisplayProps) {
  const { toast } = useToast()
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set())

  const values = connectionInfo.values as Record<string, any>

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedFields(new Set([...copiedFields, key]))
      toast({
        title: "Copied!",
        description: `${key} copied to clipboard`,
      })
      setTimeout(() => {
        setCopiedFields((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy value",
        variant: "destructive",
      })
    }
  }

  const formatLabel = (key: string) => {
    // Convert snake_case or camelCase to Title Case
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  const renderField = (key: string, value: any) => {
    const label = formatLabel(key)
    const displayValue = String(value)

    return (
      <div key={key} className="flex items-center justify-between border-b py-3 last:border-0">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-mono text-sm break-all">{displayValue}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleCopy(key, displayValue)}
          className="ml-4"
        >
          {copiedFields.has(key) ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/50 p-4">
        <p className="mb-4 text-sm font-medium">Connection Information</p>
        <div className="space-y-2">
          {Object.entries(values).map(([key, value]) => renderField(key, value))}
        </div>
      </div>
    </div>
  )
}

