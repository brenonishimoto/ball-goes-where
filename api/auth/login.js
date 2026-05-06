import {
  createAuthToken,
  getDatabaseHost,
  logAuthEvent,
  normalizeEmail,
  queryNeon,
  readJsonBody,
  resolveDatabaseUrl,
  sanitizeAuthUserRow,
  verifyPassword,
} from '../../../src/server/auth.js'

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
  const route = 'auth.login'

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
    const email = normalizeEmail(body.email)
    const password = String(body.password || '').trim()

    logAuthEvent('info', route, requestId, 'payload parsed', {
      email: body.email ? 'provided' : 'missing',
      password: password ? 'provided' : 'missing',
    })

    if (!email || !password) {
      logAuthEvent('error', route, requestId, 'validation failed', {
        reason: 'missing email or password',
      })
      sendJson(response, 400, { error: 'Email e senha são obrigatórios.' })
      return
    }

    logAuthEvent('info', route, requestId, 'querying neon user table', {
      email: email,
    })

    const rows = await queryNeon(
      databaseUrl,
      `
      SELECT id, name, email, password, "createdAt", "updatedAt"
      FROM neon_auth."user"
      WHERE email = $1
      LIMIT 1
    `,
      [email]
    )

    if (!rows.length) {
      logAuthEvent('error', route, requestId, 'user not found', {
        email,
      })
      sendJson(response, 401, { error: 'Usuário ou senha inválidos.' })
      return
    }

    const row = rows[0]

    if (!verifyPassword(password, row.password)) {
      logAuthEvent('error', route, requestId, 'password verification failed', {
        email,
        userId: row.id,
      })
      sendJson(response, 401, { error: 'Usuário ou senha inválidos.' })
      return
    }

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

    logAuthEvent('info', route, requestId, 'login success', {
      userId: user.id,
      email: user.email,
      durationMs: Date.now() - startedAt,
    })

    sendJson(response, 200, { token, user })
  } catch (error) {
    logAuthEvent('error', route, requestId, 'login failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao autenticar usuário.',
    })
  }
}
