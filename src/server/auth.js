import crypto from 'crypto'

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

export const resolveDatabaseUrl = (env = process.env) => {
  return env.DATABASE_URL || env.NEON_DATABASE_URL || env.NEON_URL || ''
}

export const sanitizeAuthUserRow = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.createdAt ?? row.created_at,
  updatedAt: row.updatedAt ?? row.updated_at,
})

export const hashPassword = (password, saltHex) => {
  const salt = Buffer.from(saltHex, 'hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${saltHex}$${derivedKey}`
}

export const verifyPassword = (password, storedPassword) => {
  if (!storedPassword) {
    return false
  }

  const [scheme, saltHex, hashHex] = String(storedPassword).split('$')

  if (scheme !== 'scrypt' || !saltHex || !hashHex) {
    return false
  }

  return hashPassword(password, saltHex) === storedPassword
}

export const createAuthToken = (payload, secret) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')
  return `${encodedPayload}.${signature}`
}

export const verifyAuthToken = (token, secret) => {
  if (!token || !token.includes('.')) {
    return null
  }

  const [encodedPayload, signature] = token.split('.')
  const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')

  if (signature !== expectedSignature) {
    return null
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  const nowInSeconds = Math.floor(Date.now() / 1000)

  if (payload.exp && payload.exp < nowInSeconds) {
    return null
  }

  return payload
}

export const queryNeon = async (databaseUrl, query, params = []) => {
  const cleanDatabaseUrl = String(databaseUrl || '').replace(/^['\"]|['\"]$/g, '')

  try {
    const parsedUrl = new URL(cleanDatabaseUrl)
    const apiHost = parsedUrl.hostname.replace(/^[^.]+\./, 'api.')
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 10000)

    try {
      const response = await fetch(`https://${apiHost}/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Neon-Connection-String': cleanDatabaseUrl,
          'Neon-Raw-Text-Output': 'true',
          'Neon-Array-Mode': 'true',
        },
        body: JSON.stringify({ query, params }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Neon HTTP error (${response.status}) for host ${apiHost}: ${errorText}`)
      }

      const payload = await response.json()
      return payload.rows ?? payload ?? []
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Timeout ao consultar Neon no host ${new URL(cleanDatabaseUrl).hostname}.`)
    }

    throw new Error(
      error instanceof Error ? `Falha ao consultar o Neon: ${error.message}` : 'Falha ao consultar o Neon.'
    )
  }
}

export const readJsonBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (!chunks.length) {
    return {}
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')

  try {
    return JSON.parse(rawBody)
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Corpo JSON invalido: ${error.message}`
        : 'Corpo JSON invalido.'
    )
  }
}
