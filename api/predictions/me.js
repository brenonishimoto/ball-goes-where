import {
  getDatabaseHost,
  logAuthEvent,
  queryNeon,
  readJsonBody,
  resolveDatabaseUrl,
  verifyAuthToken,
} from '../../src/server/auth.js'
import { scoringService } from '../../src/services/scoringService.js'

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

export default async function handler(request, response) {
  const requestId = makeRequestId()
  const startedAt = Date.now()
  const route = 'predictions.me'

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
      sendJson(response, 401, { error: 'Sessão inválida ou expirada.' })
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

      const games = rows.length ? normalizeGames(rows[0].phase2_predictions) : []

      sendJson(response, 200, { games })
      return
    }

    const body = await readJsonBody(request)
    const incomingGames = normalizeGames(body.games)

    // Importante: o PUT do front pode enviar um array "parcial".
    // Para não apagar palpites de outros jogos/grupos, fazemos merge no backend
    // preservando o JSON atual e aplicando apenas placarM/placarV por id.
    const currentRows = await queryNeon(
      databaseUrl,
      `
      SELECT phase2_predictions
      FROM public.user_predictions
      WHERE user_id = $1
      LIMIT 1
      `,
      [payload.sub]
    )

    const currentGames = currentRows.length
      ? normalizeGames(currentRows[0].phase2_predictions)
      : []

    const byId = new Map(
      currentGames
        .filter((g) => g && typeof g === 'object' && typeof g.id === 'number')
        .map((g) => [g.id, g])
    )

    // aplica delta vindo do payload
    for (const g of incomingGames) {
      if (!g || typeof g !== 'object' || typeof g.id !== 'number') continue

      const existing = byId.get(g.id)
      if (!existing) continue

      const toNullableNumber = (v) => {
        if (v === '' || v === null || v === undefined) return null
        const n = Number(v)
        return Number.isFinite(n) ? n : null
      }

      existing.placarM = toNullableNumber(g.placarM)
      existing.placarV = toNullableNumber(g.placarV)
    }

    const mergedGames = currentGames.map((g) => {
      if (!g || typeof g !== 'object' || typeof g.id !== 'number') return g
      return byId.get(g.id) ?? g
    })

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
      [payload.sub, JSON.stringify(mergedGames)]
    )

    const savedGames = rows.length ? normalizeGames(rows[0].phase2_predictions) : mergedGames

    try {
      const scorePayload = scoringService.calculateScorePayload(savedGames)
      const currentScoreRows = await queryNeon(
        databaseUrl,
        `
        SELECT phase1_score, phase3_score
        FROM public.user_scores
        WHERE user_id = $1
        LIMIT 1
      `,
        [payload.sub]
      )
      const phase1Score = Number(currentScoreRows[0]?.phase1_score) || 0
      const phase2Score = Number(scorePayload.phase2Score) || 0
      const phase3Score = Number(currentScoreRows[0]?.phase3_score) || 0
      const totalScore = phase1Score + phase2Score + phase3Score

      await queryNeon(
        databaseUrl,
        `
        INSERT INTO public.user_scores (user_id, total_score, phase1_score, phase2_score, phase3_score, calculated_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, now(), now())
        ON CONFLICT (user_id) DO UPDATE
        SET total_score = EXCLUDED.total_score,
            phase1_score = EXCLUDED.phase1_score,
            phase2_score = EXCLUDED.phase2_score,
            phase3_score = EXCLUDED.phase3_score,
            calculated_at = now(),
            updated_at = now()
      `,
        [
          payload.sub,
          totalScore,
          phase1Score,
          phase2Score,
          phase3Score,
        ]
      )
    } catch (scoreError) {
      logAuthEvent('error', route, requestId, 'score sync failed', {
        error: scoreError instanceof Error ? scoreError.message : String(scoreError),
      })
    }

    sendJson(response, 200, { games: savedGames })
  } catch (error) {
    logAuthEvent('error', route, requestId, 'predictions request failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao consultar palpites.',
    })
  }
}
