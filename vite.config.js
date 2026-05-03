import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'

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

const queryNeon = async (databaseUrl, query, params = []) => {
  const cleanDatabaseUrl = String(databaseUrl || '').replace(/^['\"]|['\"]$/g, '')

  const response = await fetch(buildNeonSqlEndpoint(cleanDatabaseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Neon-Connection-String': cleanDatabaseUrl,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true',
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
          const statements = sql
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)

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
          const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
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

      if (requestUrl.pathname === '/api/users/sync' || requestUrl.pathname.startsWith('/api/users/')) {
        const sendJson = (statusCode, payload) => {
          response.statusCode = statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(payload))
        }

        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.setHeader('Access-Control-Allow-Origin', '*')
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
          response.end()
          return
        }

        const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL

        if (!databaseUrl) {
          sendJson(500, { error: 'DATABASE_URL não configurado.' })
          return
        }

        try {
          if (request.method === 'POST' && requestUrl.pathname === '/api/users/sync') {
            const body = await readJsonBody(request)
            const clerkId = body.clerkId?.trim()

            if (!clerkId) {
              sendJson(400, { error: 'clerkId é obrigatório.' })
              return
            }

            const email = body.email?.trim() || null
            const name = body.name?.trim() || null
            const avatarUrl = body.avatarUrl?.trim() || null

            const [row] = await queryNeon(
              databaseUrl,
              `
              INSERT INTO users (clerk_id, email, name, avatar_url, updated_at)
              VALUES ($1, $2, $3, $4, now())
              ON CONFLICT (clerk_id)
              DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                avatar_url = EXCLUDED.avatar_url,
                updated_at = now()
              RETURNING id, clerk_id, email, name, avatar_url, created_at, updated_at
            `,
              [clerkId, email, name, avatarUrl]
            )

            sendJson(200, {
              id: row.id,
              clerkId: row.clerk_id,
              email: row.email,
              name: row.name,
              avatarUrl: row.avatar_url,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            })
            return
          }

          if (request.method === 'GET' && requestUrl.pathname.startsWith('/api/users/')) {
            const clerkId = decodeURIComponent(requestUrl.pathname.replace('/api/users/', ''))

            const rows = await queryNeon(
              databaseUrl,
              `
              SELECT id, clerk_id, email, name, avatar_url, created_at, updated_at
              FROM users
              WHERE clerk_id = $1
              LIMIT 1
            `,
              [clerkId]
            )

            if (!rows.length) {
              sendJson(404, { error: 'Usuário não encontrado.' })
              return
            }

            const row = rows[0]
            sendJson(200, {
              id: row.id,
              clerkId: row.clerk_id,
              email: row.email,
              name: row.name,
              avatarUrl: row.avatar_url,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            })
            return
          }

          sendJson(404, { error: 'Rota não encontrada.' })
          return
        } catch (error) {
          sendJson(500, {
            error: error instanceof Error ? error.message : 'Erro ao acessar o Neon.',
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
