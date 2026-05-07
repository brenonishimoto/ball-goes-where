import {
  getDatabaseHost,
  logAuthEvent,
  queryNeon,
  readJsonBody,
  resolveDatabaseUrl,
  verifyAuthToken,
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
  const route = 'ranking.scores.me'

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
    response.end()
    return
  }

  if (request.method !== 'GET' && request.method !== 'PUT') {
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
      error: 'URL do banco não configurada.',
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
      sendJson(response, 401, { error: 'Sessão inválida ou expirada.' })
      return
    }

    if (request.method === 'GET') {
      const rows = await queryNeon(
        databaseUrl,
        `
        SELECT total_score, phase02_score, calculated_at, updated_at
        FROM public.user_scores
        WHERE user_id = $1
        LIMIT 1
      `,
        [payload.sub]
      )

      const score = rows.length
        ? rows[0]
        : { total_score: 0, phase02_score: 0, calculated_at: null, updated_at: null }

      sendJson(response, 200, score)
      return
    }

    const body = await readJsonBody(request)
    const totalScore = Number(body.totalScore) || 0
    const phase02Score = Number(body.phase02) || 0

    const rows = await queryNeon(
      databaseUrl,
      `
      INSERT INTO public.user_scores (user_id, total_score, phase02_score, calculated_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      ON CONFLICT (user_id) DO UPDATE
      SET total_score = EXCLUDED.total_score,
          phase02_score = EXCLUDED.phase02_score,
          updated_at = now()
      RETURNING total_score, phase02_score, calculated_at, updated_at
    `,
      [payload.sub, totalScore, phase02Score]
    )

    const savedScore = rows.length ? rows[0] : { total_score: totalScore, phase02_score: phase02Score }

    sendJson(response, 200, savedScore)
  } catch (error) {
    logAuthEvent('error', route, requestId, 'ranking request failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao atualizar ranking.',
    })
  }
}
