import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { INITIAL_GAMES } from './src/services/gameService.js'
import { scoringService } from './src/services/scoringService.js'

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

const normalizeGames = (value) => {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

const normalizePredictions = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const predictionValues = { ...value }
    delete predictionValues[0]
    delete predictionValues[1]
    return predictionValues
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return normalizePredictions(parsed)
    } catch {
      return {}
    }
  }

  return {}
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

            // Criar entrada no ranking com score 0
            try {
              await queryNeon(
                databaseUrl,
                `
                INSERT INTO public.user_scores (user_id, total_score, phase1_score, phase2_score, calculated_at, updated_at)
                VALUES ($1, 0, 0, 0, now(), now())
                ON CONFLICT (user_id) DO NOTHING
              `,
                [row.id]
              )
            } catch (err) {
              // Falha ao criar score não bloqueia o registro
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

      if (requestUrl.pathname === '/api/predictions/me') {
        const sendJson = (statusCode, payload) => {
          response.statusCode = statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.setHeader('Access-Control-Allow-Origin', '*')
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
          response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
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
          const bearerToken = getBearerToken(request)
          const payload = verifyAuthToken(bearerToken, authSecret)

          if (!payload?.sub) {
            sendJson(401, { error: 'Sessão inválida ou expirada.' })
            return
          }

          if (request.method === 'GET') {
            const rows = await queryNeon(
              databaseUrl,
              `
              SELECT phase2_predictions
              FROM public.user_predictions
              WHERE user_id = $1
              LIMIT 1
            `,
              [payload.sub]
            )

            sendJson(200, { games: rows.length ? rows[0].phase2_predictions ?? [] : [] })
            return
          }

          if (request.method === 'PUT') {
            const body = await readJsonBody(request)
            const games = Array.isArray(body.games) ? body.games : []

            const rows = await queryNeon(
              databaseUrl,
              `
              INSERT INTO public.user_predictions (user_id, phase2_predictions, updated_at)
              VALUES ($1, $2::jsonb, now())
              ON CONFLICT (user_id) DO UPDATE
              SET phase2_predictions = EXCLUDED.phase2_predictions,
                  updated_at = now()
              RETURNING phase2_predictions
            `,
              [payload.sub, JSON.stringify(games)]
            )

            sendJson(200, { games: rows.length ? rows[0].phase2_predictions ?? games : games })
            return
          }

          sendJson(405, { error: 'Método não permitido.' })
          return
        } catch (error) {
          sendJson(500, {
            error: error instanceof Error ? error.message : 'Erro ao consultar palpites.',
          })
          return
        }
      }

      if (requestUrl.pathname === '/api/predictions/phase1/me') {
        const sendJson = (statusCode, payload) => {
          response.statusCode = statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.setHeader('Access-Control-Allow-Origin', '*')
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
          response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
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
          const bearerToken = getBearerToken(request)
          const payload = verifyAuthToken(bearerToken, authSecret)

          if (!payload?.sub) {
            sendJson(401, { error: 'Sessão inválida ou expirada.' })
            return
          }

          if (request.method === 'GET') {
            const rows = await queryNeon(
              databaseUrl,
              `
              SELECT phase1_predictions
              FROM public.user_predictions
              WHERE user_id = $1
              LIMIT 1
            `,
              [payload.sub]
            )

            const phase1_predictions = rows.length ? normalizePredictions(rows[0].phase1_predictions) : {}
            sendJson(200, { phase1_predictions })
            return
          }

          if (request.method === 'PUT') {
            const body = await readJsonBody(request)
            const phase1_predictions = normalizePredictions(body.phase1_predictions)

            await queryNeon(
              databaseUrl,
              `
              INSERT INTO public.user_predictions (user_id, phase1_predictions, updated_at)
              VALUES ($1, $2::jsonb, now())
              ON CONFLICT (user_id) DO UPDATE
              SET phase1_predictions = EXCLUDED.phase1_predictions,
                  updated_at = now()
            `,
              [payload.sub, JSON.stringify(phase1_predictions)]
            )

            sendJson(200, { phase1_predictions })
            return
          }

          sendJson(405, { error: 'Método não permitido.' })
          return
        } catch (error) {
          sendJson(500, {
            error: error instanceof Error ? error.message : 'Erro ao consultar palpites da Fase 1.',
          })
          return
        }
      }

      if (requestUrl.pathname === '/api/ranking/leaderboard') {
        const sendJson = (statusCode, payload) => {
          response.statusCode = statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.setHeader('Access-Control-Allow-Origin', '*')
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
          response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
          response.end()
          return
        }

        const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL

        if (!databaseUrl) {
          sendJson(500, { error: 'DATABASE_URL não configurado.' })
          return
        }

        try {
          if (request.method === 'GET') {
            const rows = await queryNeon(
              databaseUrl,
              `
              SELECT
                u.id as user_id,
                u.name,
                u.email,
                COALESCE(us.total_score, 0) as total_score,
                COALESCE(us.updated_at, now()) as updated_at,
                ROW_NUMBER() OVER (ORDER BY COALESCE(us.total_score, 0) DESC, COALESCE(us.updated_at, now()) DESC) as position
              FROM neon_auth."user" u
              LEFT JOIN public.user_scores us ON u.id = us.user_id
              ORDER BY COALESCE(us.total_score, 0) DESC, COALESCE(us.updated_at, now()) DESC
              LIMIT 100
            `
            )

            const leaderboard = rows.map((row) => ({
              position: Number(row.position) || 0,
              userId: row.user_id,
              name: row.name,
              email: row.email,
              totalScore: Number(row.total_score) || 0,
              updatedAt: row.updated_at,
            }))

            sendJson(200, { leaderboard })
            return
          }

          sendJson(405, { error: 'Método não permitido.' })
          return
        } catch (error) {
          sendJson(500, {
            error: error instanceof Error ? error.message : 'Erro ao buscar ranking.',
          })
          return
        }
      }

      if (requestUrl.pathname === '/api/ranking/refresh') {
        const sendJson = (statusCode, payload) => {
          response.statusCode = statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.setHeader('Access-Control-Allow-Origin', '*')
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
          response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
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
          const bearerToken = getBearerToken(request)
          const payload = verifyAuthToken(bearerToken, authSecret)

          if (!payload?.sub) {
            sendJson(401, { error: 'Sessão inválida ou expirada.' })
            return
          }

          const officialGamesById = new Map(INITIAL_GAMES.map((game) => [game.id, game]))
          const users = await queryNeon(
            databaseUrl,
            `
            SELECT id
            FROM neon_auth."user"
            ORDER BY id ASC
          `
          )

          const predictions = await queryNeon(
            databaseUrl,
            `
            SELECT user_id, phase2_predictions
            FROM public.user_predictions
          `
          )

          const predictionsByUserId = new Map(
            predictions.map((row) => [row.user_id, normalizeGames(row.phase2_predictions)])
          )

          let refreshed = 0

          for (const user of users) {
            const savedGames = predictionsByUserId.get(user.id) || []
            const enrichedGames = savedGames.map((game) => {
              const officialGame = officialGamesById.get(game.id)
              if (!officialGame) return game
              return {
                ...officialGame,
                ...game,
                officialM: game.officialM ?? officialGame.officialM ?? null,
                officialV: game.officialV ?? officialGame.officialV ?? null,
              }
            })

            const scorePayload = scoringService.calculateScorePayload(enrichedGames)

            await queryNeon(
              databaseUrl,
              `
              INSERT INTO public.user_scores (user_id, total_score, phase1_score, phase2_score, calculated_at, updated_at)
              VALUES ($1, $2, $3, $4, now(), now())
              ON CONFLICT (user_id) DO UPDATE
              SET total_score = EXCLUDED.total_score,
                  phase1_score = EXCLUDED.phase1_score,
                  phase2_score = EXCLUDED.phase2_score,
                  calculated_at = now(),
                  updated_at = now()
            `,
              [
                user.id,
                Number(scorePayload.totalScore) || 0,
                Number(scorePayload.phase1Score) || 0,
                Number(scorePayload.phase2Score) || 0,
              ]
            )

            refreshed += 1
          }

          sendJson(200, { refreshed })
          return
        } catch (error) {
          sendJson(500, {
            error: error instanceof Error ? error.message : 'Erro ao atualizar ranking.',
          })
          return
        }
      }

      if (requestUrl.pathname === '/api/ranking/scores/me') {
        const sendJson = (statusCode, payload) => {
          response.statusCode = statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.setHeader('Access-Control-Allow-Origin', '*')
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
          response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
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
          const bearerToken = getBearerToken(request)
          const payload = verifyAuthToken(bearerToken, authSecret)

          if (!payload?.sub) {
            sendJson(401, { error: 'Sessão inválida ou expirada.' })
            return
          }

          if (request.method === 'PUT') {
            const body = await readJsonBody(request)
            const totalScore = Number(body.totalScore || 0)
            const phase1Score = Number(body.phase1Score ?? body.phase1 ?? 0)
            const phase2Score = Number(body.phase2Score ?? body.phase02 ?? body.phase2 ?? 0)

            const rows = await queryNeon(
              databaseUrl,
              `
              INSERT INTO public.user_scores (user_id, total_score, phase1_score, phase2_score, calculated_at, updated_at)
              VALUES ($1, $2, $3, $4, now(), now())
              ON CONFLICT (user_id) DO UPDATE
              SET total_score = EXCLUDED.total_score,
                  phase1_score = EXCLUDED.phase1_score,
                  phase2_score = EXCLUDED.phase2_score,
                  updated_at = now()
              RETURNING total_score, phase1_score, phase2_score, calculated_at, updated_at
            `,
              [payload.sub, totalScore, phase1Score, phase2Score]
            )

            const savedScore = rows.length
              ? rows[0]
              : {
                  total_score: totalScore,
                  phase1_score: phase1Score,
                  phase2_score: phase2Score,
                }

            sendJson(200, {
              success: true,
              total_score: savedScore.total_score,
              phase1_score: savedScore.phase1_score,
              phase2_score: savedScore.phase2_score,
            })
            return
          }

          sendJson(405, { error: 'Método não permitido.' })
          return
        } catch (error) {
          sendJson(500, {
            error: error instanceof Error ? error.message : 'Erro ao atualizar score.',
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
