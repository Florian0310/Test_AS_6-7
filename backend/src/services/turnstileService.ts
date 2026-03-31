const toBoolean = (value: string | undefined): boolean => value === 'true' || value === '1'

type TurnstileResponse = {
  success?: boolean
  'error-codes'?: string[]
}

export type TurnstileVerificationResult = {
  success: boolean
  mode: 'verified' | 'bypass'
  message?: string
}

export const verifyTurnstileToken = async (args: {
  token?: string
  remoteIp?: string
}): Promise<TurnstileVerificationResult> => {
  const secret = String(process.env.TURNSTILE_SECRET_KEY || '').trim()
  const bypassForDev =
    toBoolean(process.env.TURNSTILE_BYPASS_FOR_DEV) || process.env.NODE_ENV !== 'production'

  if (!secret) {
    if (bypassForDev) {
      return {
        success: true,
        mode: 'bypass',
        message: 'Turnstile im Entwicklungsmodus uebergangen.',
      }
    }

    return {
      success: false,
      mode: 'verified',
      message: 'Turnstile ist nicht konfiguriert.',
    }
  }

  if (!args.token) {
    return {
      success: false,
      mode: 'verified',
      message: 'Turnstile-Token fehlt.',
    }
  }

  const payload = new URLSearchParams()
  payload.set('secret', secret)
  payload.set('response', args.token)

  if (args.remoteIp) {
    payload.set('remoteip', args.remoteIp)
  }

  let response: Response

  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    })
  } catch (_error) {
    return {
      success: false,
      mode: 'verified',
      message: 'Turnstile-Pruefung konnte nicht erreicht werden.',
    }
  }

  if (!response.ok) {
    return {
      success: false,
      mode: 'verified',
      message: `Turnstile-Pruefung fehlgeschlagen (${response.status}).`,
    }
  }

  const data = (await response.json()) as TurnstileResponse

  if (data.success) {
    return {
      success: true,
      mode: 'verified',
    }
  }

  const reason = Array.isArray(data['error-codes']) && data['error-codes'].length
    ? data['error-codes'].join(', ')
    : 'ungueltiger Token'

  return {
    success: false,
    mode: 'verified',
    message: `Turnstile-Pruefung nicht bestanden: ${reason}`,
  }
}
