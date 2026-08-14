'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback': () => void
          'error-callback': () => void
        }
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'

export default function TurnstileWidget({
  onToken,
  onError,
}: {
  onToken: (token: string) => void
  onError: (message: string) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [siteKey] = useState(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '')

  useEffect(() => {
    if (!siteKey) {
      onError('Captcha site key is not configured.')
      return
    }

    let cancelled = false

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => {
          onToken('')
          onError('Captcha expired. Please verify again.')
        },
        'error-callback': () => {
          onToken('')
          onError('Captcha failed to load. Please try again.')
        },
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = TURNSTILE_SCRIPT_ID
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
      script.addEventListener('load', renderWidget)
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [onError, onToken, siteKey])

  return <div ref={containerRef} />
}
