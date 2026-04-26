"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { DEFAULT_CURRENCIES, DEFAULT_SETTINGS } from "@/models/defaults"
import { selfHostedGetStartedAction } from "../actions"
import { FormSelect } from "@/components/forms/simple"
import { PROVIDERS } from "@/lib/llm-providers"

type Props = {
  defaultProvider: string
  defaultApiKeys: Record<string, string>
}

export default function SelfHostedSetupFormClient({ defaultProvider, defaultApiKeys }: Props) {
  const [provider, setProvider] = useState(defaultProvider)
  const selected = PROVIDERS.find(p => p.key === provider)!
  const getDefaultApiKey = useCallback((providerKey: string) => defaultApiKeys[providerKey] ?? "", [defaultApiKeys])

  const [apiKey, setApiKey] = useState(getDefaultApiKey(provider))
  const userTyped = useRef(false)

  useEffect(() => {
    if (!userTyped.current) {
      setApiKey(getDefaultApiKey(provider))
    }
    userTyped.current = false
  }, [provider, getDefaultApiKey])

  return (
    <form action={selfHostedGetStartedAction}>
      <Button type="submit" className="w-auto p-6">
        Get Started
      </Button>
    </form>
  )
}