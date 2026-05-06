import {
  queryNeon,
  getDatabaseHost,
  logAuthEvent,
  resolveDatabaseUrl,
  sanitizeAuthUserRow,
  verifyAuthToken,
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

const getBearerToken = (request) => {
  const rawHeader = request.headers.authorization || ''

  if (!rawHeader.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return rawHeader.slice(7).trim()
}

export default async function handler(request, response) {
  const requestId = makeRequestId()
  const startedAt = Date.now()
  const route = 'auth.me'

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
    response.end()
    return
  }

  if (request.method !== 'GET') {
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

    const bearerToken = getBearerToken(request)
    const payload = verifyAuthToken(bearerToken, authSecret)

    if (!payload?.sub) {
      logAuthEvent('error', route, requestId, 'invalid token', {
        durationMs: Date.now() - startedAt,
      })
      sendJson(response, 401, { error: 'Sessão inválida ou expirada.' })
      return
    }

    logAuthEvent('info', route, requestId, 'loading current user', {
      userId: payload.sub,
    })

    const rows = await queryNeon(
      databaseUrl,
      `
      SELECT id, name, email, "createdAt", "updatedAt"
      FROM neon_auth."user"
      WHERE id = $1
      LIMIT 1
    `,
      [payload.sub]
    )

    if (!rows.length) {
      logAuthEvent('error', route, requestId, 'user not found', {
        userId: payload.sub,
      })
      sendJson(response, 401, { error: 'Usuário não encontrado.' })
      return
    }

    logAuthEvent('info', route, requestId, 'session restored', {
      userId: rows[0].id,
      durationMs: Date.now() - startedAt,
    })

    sendJson(response, 200, { user: sanitizeAuthUserRow(rows[0]) })
  } catch (error) {
    logAuthEvent('error', route, requestId, 'me failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao consultar sessão.',
    })
  }
}
