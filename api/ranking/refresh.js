import {
  getDatabaseHost,
  logAuthEvent,
  queryNeon,
  resolveDatabaseUrl,
  verifyAuthToken,
} from '../../src/server/auth.js'
import { INITIAL_GAMES } from '../../src/services/gameService.js'
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
      SELECT user_id, phase2_predictions, updated_at
      FROM public.user_predictions
    `
    )

    const predictionsByUserId = new Map(
      predictions.map((row) => [
        row.user_id,
        { games: normalizeGames(row.phase2_predictions), updatedAt: row.updated_at },
      ])
    )

    const updates = []

    for (const user of users) {
      const predictionRow = predictionsByUserId.get(user.id)
      const games = predictionRow ? enrichGames(predictionRow.games) : []
      const scorePayload = scoringService.calculateScorePayload(games)

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
          Number(scorePayload.phase2Score ?? 0) || 0,
        ]
      )

      updates.push({
        userId: user.id,
        totalScore: Number(scorePayload.totalScore) || 0,
        phase1Score: Number(scorePayload.phase1Score) || 0,
        phase2Score: Number(scorePayload.phase2Score) || 0,
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
