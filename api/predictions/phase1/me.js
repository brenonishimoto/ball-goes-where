import {
  getDatabaseHost,
  logAuthEvent,
  queryNeon,
  readJsonBody,
  resolveDatabaseUrl,
  verifyAuthToken,
} from '../../../src/server/auth.js'
import { PHASE1_RESULTS } from '../../../src/services/phase1Results.js'
import { calculatePhase1TotalScore } from '../../../src/services/phase1Scoring.js'

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

const syncPhase1Score = async (databaseUrl, userId, phase1Predictions) => {
  const phase1Score = calculatePhase1TotalScore(phase1Predictions, PHASE1_RESULTS)
  const currentRows = await queryNeon(
    databaseUrl,
    `
    SELECT phase2_score, phase3_score
    FROM public.user_scores
    WHERE user_id = $1
    LIMIT 1
  `,
    [userId]
  )

  const phase2Score = Number(currentRows[0]?.phase2_score) || 0
  const phase3Score = Number(currentRows[0]?.phase3_score) || 0
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
  const route = 'predictions.phase1.me'

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
        SELECT phase1_predictions
        FROM public.user_predictions
        WHERE user_id = $1
        LIMIT 1
      `,
        [payload.sub]
      )

      const phase1_predictions = rows.length ? normalizePredictions(rows[0].phase1_predictions) : {}

      sendJson(response, 200, { phase1_predictions })
      return
    }

    if (request.method === 'PUT') {
      const isPhase1Locked = true
      if (isPhase1Locked) {
        sendJson(response, 403, { error: 'A Fase 1 está encerrada para novos palpites.' })
        return
      }

      const body = await readJsonBody(request)
      const phase1_predictions = normalizePredictions(body.phase1_predictions)

      const rows = await queryNeon(
        databaseUrl,
        `
        UPDATE public.user_predictions
        SET phase1_predictions = $2::jsonb,
            updated_at = now()
        WHERE user_id = $1
        RETURNING phase1_predictions
      `,
        [payload.sub, JSON.stringify(phase1_predictions)]
      )

      if (rows.length === 0) {
        await queryNeon(
          databaseUrl,
          `
          INSERT INTO public.user_predictions (user_id, phase1_predictions, updated_at)
          VALUES ($1, $2::jsonb, now())
        `,
          [payload.sub, JSON.stringify(phase1_predictions)]
        )
      }

      const savedPredictions = rows.length ? normalizePredictions(rows[0].phase1_predictions) : phase1_predictions

      try {
        await syncPhase1Score(databaseUrl, payload.sub, savedPredictions)
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

      sendJson(response, 200, { phase1_predictions: savedPredictions })
      return
    }
  } catch (error) {
    logAuthEvent('error', route, requestId, 'unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      method: request.method,
      duration: Date.now() - startedAt,
    })

    sendJson(response, 500, {
      error: 'Falha ao processar requisição.',
    })
  }
}
