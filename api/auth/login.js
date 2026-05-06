import {
  createAuthToken,
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

const sendJson = (response, statusCode, payload) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

export default async function handler(request, response) {
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
    sendJson(response, 500, {
      error: 'URL do banco não configurada. Defina DATABASE_URL, NEON_DATABASE_URL, NEON_URL, POSTGRES_URL ou POSTGRES_PRISMA_URL no Vercel.',
    })
    return
  }

  try {
    const body = await readJsonBody(request)
    const email = normalizeEmail(body.email)
    const password = String(body.password || '').trim()

    if (!email || !password) {
      sendJson(response, 400, { error: 'Email e senha são obrigatórios.' })
      return
    }

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
      sendJson(response, 401, { error: 'Usuário ou senha inválidos.' })
      return
    }

    const row = rows[0]

    if (!verifyPassword(password, row.password)) {
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

    sendJson(response, 200, { token, user })
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao autenticar usuário.',
    })
  }
}
