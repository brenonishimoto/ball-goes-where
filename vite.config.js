import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const readJsonBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (!chunks.length) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const buildNeonSqlEndpoint = (databaseUrl) => {
  const parsedUrl = new URL(databaseUrl)
  const regionHost = parsedUrl.hostname.split('.').slice(1).join('.')

  return `https://api.${regionHost}/sql`
}

const splitSqlStatements = (sql) => {
  const statements = []
  let currentStatement = ''
  let inSingleQuote = false
  let inDoubleQuote = false
  let dollarQuoteTag = null

  for (let index = 0; index < sql.length; index += 1) {
    const currentCharacter = sql[index]

    if (dollarQuoteTag) {
      if (sql.slice(index, index + dollarQuoteTag.length) === dollarQuoteTag) {
        currentStatement += dollarQuoteTag
        index += dollarQuoteTag.length - 1
        dollarQuoteTag = null
      } else {
        currentStatement += currentCharacter
      }

      continue
    }

    if (!inSingleQuote && !inDoubleQuote && currentCharacter === '$') {
      const remainingSql = sql.slice(index)
      const tagMatch = remainingSql.match(/^\$[A-Za-z0-9_]*\$/)

      if (tagMatch) {
        dollarQuoteTag = tagMatch[0]
        currentStatement += dollarQuoteTag
        index += dollarQuoteTag.length - 1
        continue
      }
    }

    if (!inDoubleQuote && currentCharacter === "'" && sql[index - 1] !== '\\') {
      inSingleQuote = !inSingleQuote
      currentStatement += currentCharacter
      continue
    }

    if (!inSingleQuote && currentCharacter === '"' && sql[index - 1] !== '\\') {
      inDoubleQuote = !inDoubleQuote
      currentStatement += currentCharacter
      continue
    }

    if (!inSingleQuote && !inDoubleQuote && currentCharacter === ';') {
      const trimmedStatement = currentStatement.trim()

      if (trimmedStatement) {
        statements.push(trimmedStatement)
      }

      currentStatement = ''
      continue
    }

    currentStatement += currentCharacter
  }

  const trimmedStatement = currentStatement.trim()

  if (trimmedStatement) {
    statements.push(trimmedStatement)
  }

  return statements
}

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const sanitizeAuthUserRow = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.createdAt ?? row.created_at,
  updatedAt: row.updatedAt ?? row.updated_at,
})

const hashPassword = (password, saltHex) => {
  const salt = Buffer.from(saltHex, 'hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${saltHex}$${derivedKey}`
}

const verifyPassword = (password, storedPassword) => {
  if (!storedPassword) {
    return false
  }

  const [scheme, saltHex, hashHex] = String(storedPassword).split('$')

  if (scheme !== 'scrypt' || !saltHex || !hashHex) {
    return false
  }

  return hashPassword(password, saltHex) === storedPassword
}

const createAuthToken = (payload, secret) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')
  return `${encodedPayload}.${signature}`
}

const verifyAuthToken = (token, secret) => {
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

const getBearerToken = (request) => {
  const rawHeader = request.headers.authorization || ''

  if (!rawHeader.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return rawHeader.slice(7).trim()
}

const queryNeon = async (databaseUrl, query, params = []) => {
  const cleanDatabaseUrl = String(databaseUrl || '').replace(/^['\"]|['\"]$/g, '')

  const response = await fetch(buildNeonSqlEndpoint(cleanDatabaseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Neon-Connection-String': cleanDatabaseUrl,
      'Neon-Raw-Text-Output': 'true',
    },
    body: JSON.stringify({ query, params }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Neon HTTP error (${response.status}): ${errorText}`)
  }

  const payload = await response.json()
  return payload.rows ?? payload
}

const neonApiPlugin = (env) => ({
  name: 'neon-api-plugin',
  async configureServer(server) {
    // Run migrations once on dev server start (best-effort)
    try {
      const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL
      if (databaseUrl) {
        const sqlPath = path.resolve(process.cwd(), 'sql', 'neon-users.sql')
        if (fs.existsSync(sqlPath)) {
          const sql = fs.readFileSync(sqlPath, 'utf8')
          const statements = splitSqlStatements(sql)

          for (const stmt of statements) {
            try {
              await queryNeon(databaseUrl, stmt)
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn('[neon-api-plugin] Migration statement failed (continuing):', e?.message ?? e)
            }
          }

          // eslint-disable-next-line no-console
          console.log('[neon-api-plugin] Migration statements applied (best-effort)')
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[neon-api-plugin] Migration runner error (continuing):', err?.message ?? err)
    }

    server.middlewares.use(async (request, response, next) => {
      const requestUrl = new URL(request.url, 'http://localhost')

      if (requestUrl.pathname === '/api/_migrate' && request.method === 'POST') {
        const sendJson = (statusCode, payload) => {
          response.statusCode = statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL
        if (!databaseUrl) {
          sendJson(500, { error: 'DATABASE_URL não configurado.' })
          return
        }

        try {
          const sqlPath = path.resolve(process.cwd(), 'sql', 'neon-users.sql')
          if (!fs.existsSync(sqlPath)) {
            sendJson(404, { error: 'Arquivo de migration não encontrado.' })
            return
          }

          const sql = fs.readFileSync(sqlPath, 'utf8')
          const statements = splitSqlStatements(sql)
          const results = []

          for (const stmt of statements) {
            try {
              const res = await queryNeon(databaseUrl, stmt)
              results.push({ statement: stmt.slice(0, 120), ok: true, rows: Array.isArray(res) ? res.length : null })
            } catch (err) {
              results.push({ statement: stmt.slice(0, 120), ok: false, error: String(err?.message ?? err) })
            }
          }

          sendJson(200, { results })
        } catch (err) {
          sendJson(500, { error: String(err?.message ?? err) })
        }

        return
      }

      if (requestUrl.pathname.startsWith('/api/auth')) {
        const sendJson = (statusCode, payload) => {
          response.statusCode = statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.setHeader('Access-Control-Allow-Origin', '*')
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
          response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
          response.end()
          return
        }

        const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL

        if (!databaseUrl) {
          sendJson(500, { error: 'DATABASE_URL não configurado.' })
          return
        }

        const authSecret = env.AUTH_SECRET || process.env.AUTH_SECRET || 'dev-auth-secret-change-this'

        try {
          if (request.method === 'POST' && requestUrl.pathname === '/api/auth/register') {
            const body = await readJsonBody(request)
            const name = String(body.name || '').trim()
            const email = normalizeEmail(body.email)
            const password = String(body.password || '').trim()

            if (name.length < 2) {
              sendJson(400, { error: 'O nome precisa ter ao menos 2 caracteres.' })
              return
            }

            if (!email) {
              sendJson(400, { error: 'O email é obrigatório.' })
              return
            }

            if (password.length < 6) {
              sendJson(400, { error: 'A senha precisa ter ao menos 6 caracteres.' })
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

            sendJson(200, {
              token,
              user,
            })
            return
          }

          if (request.method === 'POST' && requestUrl.pathname === '/api/auth/login') {
            const body = await readJsonBody(request)
            const email = normalizeEmail(body.email)
            const password = String(body.password || '').trim()

            if (!email || !password) {
              sendJson(400, { error: 'Email e senha são obrigatórios.' })
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
              sendJson(401, { error: 'Usuário ou senha inválidos.' })
              return
            }

            const row = rows[0]
            const computedHash = verifyPassword(password, row.password)

            if (!computedHash) {
              sendJson(401, { error: 'Usuário ou senha inválidos.' })
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

            sendJson(200, {
              token,
              user,
            })
            return
          }

          if (request.method === 'GET' && requestUrl.pathname === '/api/auth/me') {
            const bearerToken = getBearerToken(request)
            const payload = verifyAuthToken(bearerToken, authSecret)

            if (!payload?.sub) {
              sendJson(401, { error: 'Sessão inválida ou expirada.' })
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
              sendJson(401, { error: 'Usuário não encontrado.' })
              return
            }

            sendJson(200, { user: sanitizeAuthUserRow(rows[0]) })
            return
          }

          sendJson(404, { error: 'Rota não encontrada.' })
          return
        } catch (error) {
          if (String(error?.message || '').toLowerCase().includes('duplicate key')) {
            sendJson(409, { error: 'Esse usuário já existe.' })
            return
          }

          sendJson(500, {
            error: error instanceof Error ? error.message : 'Erro ao acessar o Neon Auth.',
          })
          return
        }
      }

      next()
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), neonApiPlugin(env)],
  }
})
