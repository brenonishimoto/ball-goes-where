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
        SELECT total_score, phase1_score, phase2_score, phase3_score, calculated_at, updated_at
        FROM public.user_scores
        WHERE user_id = $1
        LIMIT 1
      `,
        [payload.sub]
      )

      const score = rows.length
        ? rows[0]
        : { total_score: 0, phase1_score: 0, phase2_score: 0, phase3_score: 0, calculated_at: null, updated_at: null }

      sendJson(response, 200, score)
      return
    }

    const body = await readJsonBody(request)
    const totalScore = Number(body.totalScore) || 0
    const phase1Score = Number(body.phase1Score ?? body.phase1 ?? 0) || 0
    const phase2Score = Number(body.phase2Score ?? body.phase2 ?? 0) || 0
    const phase3Score = Number(body.phase3Score ?? body.phase3 ?? 0) || 0

    const rows = await queryNeon(
      databaseUrl,
      `
      INSERT INTO public.user_scores (user_id, total_score, phase1_score, phase2_score, phase3_score, calculated_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, now(), now())
      ON CONFLICT (user_id) DO UPDATE
      SET total_score = EXCLUDED.total_score,
          phase1_score = EXCLUDED.phase1_score,
          phase2_score = EXCLUDED.phase2_score,
          phase3_score = EXCLUDED.phase3_score,
          updated_at = now()
      RETURNING total_score, phase1_score, phase2_score, phase3_score, calculated_at, updated_at
    `,
      [payload.sub, totalScore, phase1Score, phase2Score, phase3Score]
    )

    const savedScore = rows.length
      ? rows[0]
      : { total_score: totalScore, phase1_score: phase1Score, phase2_score: phase2Score, phase3_score: phase3Score }

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
