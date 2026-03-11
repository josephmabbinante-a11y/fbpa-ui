import { Request, Response } from 'express';
import { buildRoute } from '../services/route.service';

function badRequest(res: Response, message: string): Response {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message,
    },
  });
}

export async function getRoute(req: Request, res: Response): Promise<Response> {
  try {
    const { origin, destination, volatilityIndex, capacityScore } = req.body || {};

    if (!origin || !destination) {
      return badRequest(res, 'origin and destination are required');
    }

    const route = await buildRoute({
      origin: String(origin),
      destination: String(destination),
      volatilityIndex: Number(volatilityIndex || 0),
      capacityScore: Number(capacityScore || 0),
    });

    return res.json(route);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Route calculation failed';
    return res.status(500).json({
      error: {
        code: 'ROUTE_CALCULATION_FAILED',
        message,
      },
    });
  }
}
