import crypto from 'crypto'
import {
  createAuthToken,
  getDatabaseHost,
  hashPassword,
  logAuthEvent,
  normalizeEmail,
  queryNeon,
  readJsonBody,
  resolveDatabaseUrl,
  sanitizeAuthUserRow,
} from '../../src/server/auth.js'

export const config = {
  runtime: 'nodejs',
}

const makeRequestId = () => `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`

const sendJson = (response, statusCode, payload) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

export default async function handler(request, response) {
  const requestId = makeRequestId()
  const startedAt = Date.now()
  const route = 'auth.register'

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    response.end()
    return
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Método não permitido.' })
    return
  }

  const databaseUrl = resolveDatabaseUrl()
  const authSecret = process.env.AUTH_SECRET || 'dev-auth-secret-change-this'

  if (!databaseUrl) {
    logAuthEvent('error', route, requestId, 'missing database url', {
      method: request.method,
    })
    sendJson(response, 500, {
      error: 'URL do banco não configurada. Defina DATABASE_URL, NEON_DATABASE_URL, NEON_URL, POSTGRES_URL ou POSTGRES_PRISMA_URL no Vercel.',
    })
    return
  }

  try {
    logAuthEvent('info', route, requestId, 'request started', {
      method: request.method,
      host: getDatabaseHost(databaseUrl),
    })

    const body = await readJsonBody(request)
    const name = String(body.name || '').trim()
    const email = normalizeEmail(body.email)
    const password = String(body.password || '').trim()

    logAuthEvent('info', route, requestId, 'payload parsed', {
      name: name ? 'provided' : 'missing',
      email: body.email ? 'provided' : 'missing',
      password: password ? 'provided' : 'missing',
    })

    if (name.length < 2) {
      logAuthEvent('error', route, requestId, 'validation failed', {
        reason: 'invalid name',
      })
      sendJson(response, 400, { error: 'O nome precisa ter ao menos 2 caracteres.' })
      return
    }

    if (!email) {
      sendJson(response, 400, { error: 'O email é obrigatório.' })
      return
    }

    if (password.length < 6) {
      sendJson(response, 400, { error: 'A senha precisa ter ao menos 6 caracteres.' })
      return
    }

    const saltHex = crypto.randomBytes(16).toString('hex')
    const passwordHash = hashPassword(password, saltHex)

    logAuthEvent('info', route, requestId, 'creating user', {
      email,
    })

    const [row] = await queryNeon(
      databaseUrl,
      `
      INSERT INTO neon_auth."user" (name, email, "emailVerified", password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email
    `,
      [name, email, false, passwordHash]
    )

    const user = sanitizeAuthUserRow(row)
    const token = createAuthToken(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      authSecret
    )

    logAuthEvent('info', route, requestId, 'register success', {
      userId: user.id,
      email: user.email,
      durationMs: Date.now() - startedAt,
    })

    sendJson(response, 200, { token, user })
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('duplicate key')) {
      logAuthEvent('error', route, requestId, 'duplicate user', {
        durationMs: Date.now() - startedAt,
      })
      sendJson(response, 409, { error: 'Esse usuário já existe.' })
      return
    }

    logAuthEvent('error', route, requestId, 'register failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao registrar usuário.',
    })
  }
}
