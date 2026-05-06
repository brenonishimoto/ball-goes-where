import crypto from 'crypto'
import {
  createAuthToken,
  hashPassword,
  normalizeEmail,
  queryNeon,
  readJsonBody,
  resolveDatabaseUrl,
  sanitizeAuthUserRow,
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
    const name = String(body.name || '').trim()
    const email = normalizeEmail(body.email)
    const password = String(body.password || '').trim()

    if (name.length < 2) {
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

    const [row] = await queryNeon(
      databaseUrl,
      `
      INSERT INTO neon_auth."user" (name, email, "emailVerified", password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, "createdAt", "updatedAt"
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

    sendJson(response, 200, { token, user })
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('duplicate key')) {
      sendJson(response, 409, { error: 'Esse usuário já existe.' })
      return
    }

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao registrar usuário.',
    })
  }
}
