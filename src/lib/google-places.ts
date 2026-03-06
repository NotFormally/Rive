// =============================================================================
// Google Places API (New) — Restaurant Visibility Data
//
// Server-side only. Fetches ratings, reviews, photos, attributes, and
// nearby competitors for the Health Score visibility sub-score.
// =============================================================================

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_PLACES_API_KEY env variable');
  return key;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  photosCount: number;
  priceLevel: string | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  businessStatus: string | null;
  types: string[];
  reviews: PlaceReview[];
  attributes: Record<string, boolean>;
};

export type PlaceReview = {
  text: string;
  rating: number;
  relativeTime: string;
  authorName: string;
  language: string;
};

export type NearbyCompetitor = {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  photosCount: number;
  distance: number | null;
};

// ---------------------------------------------------------------------------
// Text Search — find a restaurant by address/name
// ---------------------------------------------------------------------------

export async function searchPlace(query: string): Promise<PlaceDetails | null> {
  const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
        'places.photos',
        'places.priceLevel',
        'places.websiteUri',
        'places.googleMapsUri',
        'places.businessStatus',
        'places.types',
        'places.reviews',
        'places.dineIn',
        'places.delivery',
        'places.takeout',
        'places.reservable',
        'places.servesBreakfast',
        'places.servesLunch',
        'places.servesDinner',
        'places.servesBrunch',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'fr',
      maxResultCount: 1,
      includedType: 'restaurant',
    }),
  });

  if (!res.ok) {
    console.error('[GooglePlaces] Text Search failed:', res.status, await res.text());
    return null;
  }

  const json = await res.json();
  const place = json.places?.[0];
  if (!place) return null;

  return mapPlaceToDetails(place);
}

// ---------------------------------------------------------------------------
// Place Details — get full data for a known place ID
// ---------------------------------------------------------------------------

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const fieldMask = [
    'id',
    'displayName',
    'formattedAddress',
    'rating',
    'userRatingCount',
    'photos',
    'priceLevel',
    'websiteUri',
    'googleMapsUri',
    'businessStatus',
    'types',
    'reviews',
    'dineIn',
    'delivery',
    'takeout',
    'reservable',
    'servesBreakfast',
    'servesLunch',
    'servesDinner',
    'servesBrunch',
  ].join(',');

  const res = await fetch(`${PLACES_API_BASE}/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': fieldMask,
    },
  });

  if (!res.ok) {
    console.error('[GooglePlaces] Place Details failed:', res.status, await res.text());
    return null;
  }

  const place = await res.json();
  return mapPlaceToDetails(place);
}

// ---------------------------------------------------------------------------
// Nearby Search — find competitors within radius
// ---------------------------------------------------------------------------

export async function findNearbyCompetitors(
  lat: number,
  lng: number,
  radiusMeters = 1000,
  maxResults = 10
): Promise<NearbyCompetitor[]> {
  const res = await fetch(`${PLACES_API_BASE}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.rating',
        'places.userRatingCount',
        'places.photos',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes: ['restaurant'],
      maxResultCount: maxResults,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
      rankPreference: 'POPULARITY',
    }),
  });

  if (!res.ok) {
    console.error('[GooglePlaces] Nearby Search failed:', res.status, await res.text());
    return [];
  }

  const json = await res.json();
  return (json.places || []).map((p: Record<string, unknown>) => ({
    placeId: p.id as string,
    name: (p.displayName as Record<string, string>)?.text || '',
    rating: (p.rating as number) || 0,
    reviewCount: (p.userRatingCount as number) || 0,
    photosCount: Array.isArray(p.photos) ? p.photos.length : 0,
    distance: null,
  }));
}

// ---------------------------------------------------------------------------
// Visibility Score — 0-100 from Google data
// ---------------------------------------------------------------------------

export function calculateVisibilityScore(place: PlaceDetails, competitors: NearbyCompetitor[]): {
  total: number;
  gbpScore: number;
  reviewScore: number;
  competitiveScore: number;
} {
  // GBP completeness (0-100): photos, website, attributes
  let gbpScore = 0;
  if (place.photosCount >= 10) gbpScore += 30;
  else if (place.photosCount >= 5) gbpScore += 20;
  else if (place.photosCount > 0) gbpScore += 10;
  if (place.websiteUri) gbpScore += 20;
  const attrCount = Object.values(place.attributes).filter(Boolean).length;
  if (attrCount >= 5) gbpScore += 25;
  else gbpScore += attrCount * 5;
  if (place.businessStatus === 'OPERATIONAL') gbpScore += 15;
  if (place.priceLevel) gbpScore += 10;
  gbpScore = Math.min(100, gbpScore);

  // Review score (0-100): rating + count
  let reviewScore = 0;
  if (place.rating >= 4.5) reviewScore += 50;
  else if (place.rating >= 4.0) reviewScore += 40;
  else if (place.rating >= 3.5) reviewScore += 25;
  else reviewScore += 10;
  if (place.reviewCount >= 200) reviewScore += 50;
  else if (place.reviewCount >= 100) reviewScore += 40;
  else if (place.reviewCount >= 50) reviewScore += 30;
  else if (place.reviewCount >= 20) reviewScore += 20;
  else reviewScore += Math.round((place.reviewCount / 20) * 15);
  reviewScore = Math.min(100, reviewScore);

  // Competitive position (0-100): rank among nearby
  let competitiveScore = 50; // default if no competitors
  if (competitors.length > 0) {
    const allRatings = [place.rating, ...competitors.map(c => c.rating)].sort((a, b) => b - a);
    const rank = allRatings.indexOf(place.rating) + 1;
    const percentile = 1 - (rank - 1) / allRatings.length;
    competitiveScore = Math.round(percentile * 100);
  }

  const total = Math.round(gbpScore * 0.35 + reviewScore * 0.40 + competitiveScore * 0.25);

  return { total, gbpScore, reviewScore, competitiveScore };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapPlaceToDetails(place: Record<string, unknown>): PlaceDetails {
  const reviews = Array.isArray(place.reviews)
    ? place.reviews.map((r: Record<string, unknown>) => ({
        text: (r.text as Record<string, string>)?.text || '',
        rating: (r.rating as number) || 0,
        relativeTime: (r.relativePublishTimeDescription as string) || '',
        authorName: (r.authorAttribution as Record<string, string>)?.displayName || '',
        language: (r.text as Record<string, string>)?.languageCode || 'en',
      }))
    : [];

  const attributes: Record<string, boolean> = {};
  for (const attr of ['dineIn', 'delivery', 'takeout', 'reservable', 'servesBreakfast', 'servesLunch', 'servesDinner', 'servesBrunch'] as const) {
    if (place[attr] !== undefined) attributes[attr] = place[attr] as boolean;
  }

  return {
    placeId: place.id as string,
    name: (place.displayName as Record<string, string>)?.text || '',
    address: (place.formattedAddress as string) || '',
    rating: (place.rating as number) || 0,
    reviewCount: (place.userRatingCount as number) || 0,
    photosCount: Array.isArray(place.photos) ? place.photos.length : 0,
    priceLevel: (place.priceLevel as string) || null,
    websiteUri: (place.websiteUri as string) || null,
    googleMapsUri: (place.googleMapsUri as string) || null,
    businessStatus: (place.businessStatus as string) || null,
    types: Array.isArray(place.types) ? place.types as string[] : [],
    reviews,
    attributes,
  };
}
