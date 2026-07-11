import { NextRequest, NextResponse } from 'next/server';
import { extractFromDescription } from '@/lib/gemini';

// ═══════════════════════════════════════════
// POST /api/ai/extract — AI Extraction Endpoint
// ═══════════════════════════════════════════

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute per IP
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.' },
        { status: 429 }
      );
    }

    // Parse body
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description requise (champ "description" manquant).' },
        { status: 400 }
      );
    }

    if (description.trim().length < 10) {
      return NextResponse.json(
        { error: 'La description doit contenir au moins 10 caractères.' },
        { status: 400 }
      );
    }

    if (description.length > 10_000) {
      return NextResponse.json(
        { error: 'La description ne peut pas dépasser 10 000 caractères.' },
        { status: 400 }
      );
    }

    // Extract with AI (Gemini → OpenRouter cascade)
    const result = await extractFromDescription(description.trim());

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[API /ai/extract] Error:', message);

    return NextResponse.json(
      { error: `Extraction AI échouée: ${message}` },
      { status: 502 }
    );
  }
}
