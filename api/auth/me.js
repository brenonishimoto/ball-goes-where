import {
  queryNeon,
  resolveDatabaseUrl,
  sanitizeAuthUserRow,
  verifyAuthToken,
} from '../../../src/server/auth.js'

export const config = {
  runtime: 'nodejs',
}

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
    sendJson(response, 500, {
      error: 'URL do banco não configurada. Defina DATABASE_URL, NEON_DATABASE_URL, NEON_URL, POSTGRES_URL ou POSTGRES_PRISMA_URL no Vercel.',
    })
    return
  }

  try {
    const bearerToken = getBearerToken(request)
    const payload = verifyAuthToken(bearerToken, authSecret)

    if (!payload?.sub) {
      sendJson(response, 401, { error: 'Sessão inválida ou expirada.' })
      return
    }

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
      sendJson(response, 401, { error: 'Usuário não encontrado.' })
      return
    }

    sendJson(response, 200, { user: sanitizeAuthUserRow(rows[0]) })
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao consultar sessão.',
    })
  }
}
