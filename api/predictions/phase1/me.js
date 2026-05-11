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

    logAuthEvent('info', route, requestId, 'request completed', {
      method: request.method,
      userId: payload.sub,
      duration: Date.now() - startedAt,
    })

    sendJson(response, 200, { phase1_predictions: savedPredictions })
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
