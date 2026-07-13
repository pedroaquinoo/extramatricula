"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload as UploadIcon, Check } from "lucide-react"
import { toast } from "sonner"

export function ShareAppButton() {
  const [isCopied, setIsCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.origin
    const shareData = {
      title: "Extramatrícula",
      text: "Monte sua grade antes de se matricular",
      url,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }

      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      toast.success("Link copiado para a área de transferência!")
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error("Erro ao compartilhar")
    }
  }

  return (
    <Button
      size="lg"
      variant="default"
      className="w-full sm:w-auto"
      onClick={handleShare}
    >
      {isCopied ? <Check className="size-4" /> : <UploadIcon className="size-4" />}
      {isCopied ? "Copiado!" : "Compartilhar com amigos"}
    </Button>
  )
}
