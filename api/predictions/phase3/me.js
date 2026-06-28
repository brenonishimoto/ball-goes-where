import {
  getDatabaseHost,
  logAuthEvent,
  queryNeon,
  readJsonBody,
  resolveDatabaseUrl,
  verifyAuthToken,
} from '../../../src/server/auth.js'
import { PHASE3_RESULTS } from '../../../src/services/phase3Results.js'
import { calculatePhase3TotalScore } from '../../../src/services/phase3Scoring.js'
import { PHASE3_MATCHES, isPhase3MatchStarted } from '../../../src/services/phase3Bracket.js'

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

const normalizePredictions = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
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

const syncPhase3Score = async (databaseUrl, userId, phase3Predictions) => {
  const phase3Score = calculatePhase3TotalScore(phase3Predictions, PHASE3_RESULTS)
  const currentRows = await queryNeon(
    databaseUrl,
    `
    SELECT phase1_score, phase2_score
    FROM public.user_scores
    WHERE user_id = $1
    LIMIT 1
  `,
    [userId]
  )

  const phase1Score = Number(currentRows[0]?.phase1_score) || 0
  const phase2Score = Number(currentRows[0]?.phase2_score) || 0
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
    [userId, totalScore, phase1Score, phase2Score, phase3Score]
  )
}

export default async function handler(request, response) {
  const requestId = makeRequestId()
  const startedAt = Date.now()
  const route = 'predictions.phase3.me'

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
    response.end()
    return
  }

  if (request.method !== 'GET' && request.method !== 'PUT') {
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const databaseUrl = resolveDatabaseUrl()
  const authSecret = process.env.AUTH_SECRET || 'dev-auth-secret-change-this'

  if (!databaseUrl) {
    logAuthEvent('error', route, requestId, 'missing database url', {
      method: request.method,
    })
    sendJson(response, 500, {
      error: 'URL do banco nao configurada.',
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
      sendJson(response, 401, { error: 'Sessao invalida ou expirada.' })
      return
    }

    if (request.method === 'GET') {
      const rows = await queryNeon(
        databaseUrl,
        `
        SELECT phase3_predictions
        FROM public.user_predictions
        WHERE user_id = $1
        LIMIT 1
      `,
        [payload.sub]
      )

      const phase3_predictions = rows.length ? normalizePredictions(rows[0].phase3_predictions) : {}

      sendJson(response, 200, { phase3_predictions })
      return
    }

    const body = await readJsonBody(request)
    const incomingPredictions = normalizePredictions(body.phase3_predictions)

    const currentRows = await queryNeon(
      databaseUrl,
      `
      SELECT phase3_predictions
      FROM public.user_predictions
      WHERE user_id = $1
      LIMIT 1
      `,
      [payload.sub]
    )

    const existingPredictions = currentRows.length
      ? normalizePredictions(currentRows[0].phase3_predictions)
      : {}

    const mergedPredictions = {}

    for (const match of PHASE3_MATCHES) {
      const matchIdStr = String(match.id)
      const existing = existingPredictions[matchIdStr] || {}
      const incoming = incomingPredictions[matchIdStr] || {}

      if (isPhase3MatchStarted(match)) {
        // Locked: keep existing
        mergedPredictions[matchIdStr] = {
          mandante: String(existing.mandante ?? existing.teamA ?? ''),
          visitante: String(existing.visitante ?? existing.teamB ?? ''),
          placarM: existing.placarM === null || existing.placarM === undefined ? (existing.scoreA === null || existing.scoreA === undefined ? '' : String(existing.scoreA)) : String(existing.placarM),
          placarV: existing.placarV === null || existing.placarV === undefined ? (existing.scoreB === null || existing.scoreB === undefined ? '' : String(existing.scoreB)) : String(existing.placarV),
          winner: existing.winner === 'A' || existing.winner === 'B' ? existing.winner : '',
        }
      } else {
        // Allowed: accept incoming
        const mandante = incoming.mandante ?? incoming.teamA ?? '';
        const visitante = incoming.visitante ?? incoming.teamB ?? '';
        const placarM = incoming.placarM ?? incoming.scoreA ?? '';
        const placarV = incoming.placarV ?? incoming.scoreB ?? '';

        mergedPredictions[matchIdStr] = {
          mandante: String(mandante),
          visitante: String(visitante),
          placarM: placarM === null || placarM === undefined ? '' : String(placarM),
          placarV: placarV === null || placarV === undefined ? '' : String(placarV),
          winner: incoming.winner === 'A' || incoming.winner === 'B' ? incoming.winner : '',
        }
      }
    }

    const rows = await queryNeon(
      databaseUrl,
      `
      INSERT INTO public.user_predictions (user_id, phase3_predictions, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
      SET phase3_predictions = EXCLUDED.phase3_predictions,
          updated_at = now()
      RETURNING phase3_predictions
    `,
      [payload.sub, JSON.stringify(mergedPredictions)]
    )

    const savedPredictions = rows.length ? normalizePredictions(rows[0].phase3_predictions) : mergedPredictions

    try {
      await syncPhase3Score(databaseUrl, payload.sub, savedPredictions)
    } catch (scoreError) {
      logAuthEvent('error', route, requestId, 'score sync failed', {
        error: scoreError instanceof Error ? scoreError.message : String(scoreError),
      })
    }

    logAuthEvent('info', route, requestId, 'request completed', {
      method: request.method,
      userId: payload.sub,
      duration: Date.now() - startedAt,
    })

    sendJson(response, 200, { phase3_predictions: savedPredictions })
  } catch (error) {
    logAuthEvent('error', route, requestId, 'unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      method: request.method,
      duration: Date.now() - startedAt,
    })

    sendJson(response, 500, {
      error: 'Falha ao processar requisicao.',
    })
  }
}
