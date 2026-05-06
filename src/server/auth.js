import crypto from 'crypto'
import { neon } from '@neondatabase/serverless'

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

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
  const sql = neon(cleanDatabaseUrl)
  const rows = await sql.query(query, params)
  return rows ?? []
}

export const readJsonBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (!chunks.length) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
