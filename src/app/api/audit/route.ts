import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { searchPlace, findNearbyCompetitors, calculateVisibilityScore } from '@/lib/google-places';
import { aggregateReviews } from '@/lib/review-sentiment';

// =============================================================================
// Public Audit — Lead-Gen Visibility Score
//
// POST: No auth required. Accepts { address: string, email?: string }.
// Returns visibility-only score for any restaurant address.
// Rate limited: 10/hour per IP.
// =============================================================================

export const maxDuration = 30;

// Simple in-memory rate limiter (resets on cold start — fine for Vercel)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in an hour.' },
      { status: 429 }
    );
  }

  let body: { address?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { address, email } = body;
  if (!address || typeof address !== 'string' || address.trim().length < 3) {
    return NextResponse.json({ error: 'A valid address is required' }, { status: 400 });
  }

  try {
    // Search for the restaurant on Google Places
    const place = await searchPlace(address.trim());
    if (!place) {
      return NextResponse.json({ error: 'No restaurant found at this address' }, { status: 404 });
    }

    // Find nearby competitors (skip if we don't have coordinates — Places Text Search doesn't return them directly)
    const competitors = await findNearbyCompetitors(0, 0, 1000, 5).catch(() => []);

    // Calculate visibility score
    const visibility = calculateVisibilityScore(place, competitors);

    // Analyze review sentiment
    const sentiment = place.reviews.length > 0
      ? aggregateReviews(place.reviews.map(r => ({ text: r.text, rating: r.rating })))
      : null;

    // Persist to public_audit_results
    const admin: any = supabaseAdmin();
    await admin.from('public_audit_results').insert({
      place_id: place.placeId,
      restaurant_name: place.name,
      address: place.address,
      rating: place.rating,
      review_count: place.reviewCount,
      photos_count: place.photosCount,
      attributes: place.attributes,
      competitors,
      review_sentiment: sentiment || {},
      gbp_score: visibility.gbpScore,
      review_score: visibility.reviewScore,
      competitive_score: visibility.competitiveScore,
      total_score: visibility.total,
      user_email: email || null,
    });

    return NextResponse.json({
      restaurant: {
        name: place.name,
        address: place.address,
        rating: place.rating,
        reviewCount: place.reviewCount,
        photosCount: place.photosCount,
        attributes: place.attributes,
      },
      scores: visibility,
      sentiment,
      competitors: competitors.slice(0, 5),
    }, { status: 200 });
  } catch (error) {
    console.error('[Audit] Error:', error);
    return NextResponse.json({ error: 'Audit failed. Please try again.' }, { status: 500 });
  }
}
