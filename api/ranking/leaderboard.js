import {
  getDatabaseHost,
  logAuthEvent,
  queryNeon,
  resolveDatabaseUrl,
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

export default async function handler(request, response) {
  const requestId = makeRequestId()
  const startedAt = Date.now()
  const route = 'ranking.leaderboard'

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

    const rows = await queryNeon(
      databaseUrl,
      `
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        COALESCE(us.total_score, 0) as total_score,
        COALESCE(us.phase1_score, 0) as phase1_score,
        COALESCE(us.phase2_score, 0) as phase2_score,
        COALESCE(us.updated_at, now()) as updated_at,
        ROW_NUMBER() OVER (
          ORDER BY COALESCE(us.total_score, 0) DESC, COALESCE(us.updated_at, now()) DESC
        ) as position
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
      phase1Score: Number(row.phase1_score) || 0,
      phase2Score: Number(row.phase2_score) || 0,
      updatedAt: row.updated_at,
    }))

    sendJson(response, 200, { leaderboard })
  } catch (error) {
    logAuthEvent('error', route, requestId, 'leaderboard request failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao buscar ranking.',
    })
  }
}
