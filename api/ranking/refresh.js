import {
  getDatabaseHost,
  logAuthEvent,
  queryNeon,
  resolveDatabaseUrl,
  verifyAuthToken,
} from '../../src/server/auth.js'
import { INITIAL_GAMES } from '../../src/services/gameService.js'
import { PHASE1_RESULTS } from '../../src/services/phase1Results.js'
import { calculatePhase1TotalScore } from '../../src/services/phase1Scoring.js'
import { PHASE3_RESULTS } from '../../src/services/phase3Results.js'
import { scoringService } from '../../src/services/scoringService.js'
import { calculatePhase3TotalScore } from '../../src/services/phase3Scoring.js'

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

const normalizeObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return normalizeObject(parsed)
    } catch {
      return {}
    }
  }

  return {}
}

const buildOfficialLookup = () => new Map(INITIAL_GAMES.map((game) => [game.id, game]))

const enrichGames = (games) => {
  const officialGamesById = buildOfficialLookup()

  return games.map((game) => {
    const officialGame = officialGamesById.get(game.id)

    if (!officialGame) {
      return game
    }

    return {
      ...officialGame,
      ...game,
      officialM: game.officialM ?? officialGame.officialM ?? null,
      officialV: game.officialV ?? officialGame.officialV ?? null,
    }
  })
}

export default async function handler(request, response) {
  const requestId = makeRequestId()
  const startedAt = Date.now()
  const route = 'ranking.refresh'

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

    const users = await queryNeon(
      databaseUrl,
      `
      SELECT id, name, email
      FROM neon_auth."user"
      ORDER BY name ASC, email ASC
    `
    )

    const predictions = await queryNeon(
      databaseUrl,
      `
      SELECT user_id, phase1_predictions, phase2_predictions, phase3_predictions, updated_at
      FROM public.user_predictions
    `
    )

    const predictionsByUserId = new Map(
      predictions.map((row) => [
        row.user_id,
        {
          phase1Predictions: normalizeObject(row.phase1_predictions),
          games: normalizeGames(row.phase2_predictions),
          phase3Predictions: normalizeObject(row.phase3_predictions),
          updatedAt: row.updated_at,
        },
      ])
    )

    const updates = []

    for (const user of users) {
      const predictionRow = predictionsByUserId.get(user.id)
      const games = predictionRow ? enrichGames(predictionRow.games) : []
      const scorePayload = scoringService.calculateScorePayload(games)
      const phase1Score = predictionRow
        ? calculatePhase1TotalScore(predictionRow.phase1Predictions, PHASE1_RESULTS)
        : 0
      const phase2Score = Number(scorePayload.phase2Score) || 0
      const phase3Score = predictionRow
        ? calculatePhase3TotalScore(predictionRow.phase3Predictions, PHASE3_RESULTS)
        : 0
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
          user.id,
          totalScore,
          phase1Score,
          phase2Score,
          phase3Score,
        ]
      )

      updates.push({
        userId: user.id,
        totalScore,
        phase1Score,
        phase2Score,
        phase3Score,
        hasPredictions: Boolean(predictionRow),
      })
    }

    sendJson(response, 200, {
      refreshed: updates.length,
      updatedUsers: updates.length,
    })
  } catch (error) {
    logAuthEvent('error', route, requestId, 'ranking refresh failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Erro ao atualizar ranking.',
    })
  }
}
