import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';
import { geocodeAddress, fetchForecast, analyzeServiceImpact } from '@/lib/weather';

export const maxDuration = 15;

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Get restaurant address from profile
    const { data: profile } = await auth.supabase
      .from('restaurant_profiles')
      .select('address')
      .eq('id', auth.restaurantId)
      .single();

    const address = profile?.address;
    if (!address) {
      return NextResponse.json(
        { error: 'No address configured. Add your restaurant address in settings.' },
        { status: 400 }
      );
    }

    // Geocode
    const coords = await geocodeAddress(address);
    if (!coords) {
      return NextResponse.json(
        { error: 'Could not geocode restaurant address.' },
        { status: 400 }
      );
    }

    // Fetch forecast
    const weather = await fetchForecast(coords);
    if (!weather) {
      return NextResponse.json(
        { error: 'Weather service unavailable.' },
        { status: 502 }
      );
    }

    // Analyze impact
    const alerts = analyzeServiceImpact(weather.daily);

    return NextResponse.json({
      current: weather.current,
      daily: weather.daily,
      alerts,
      address,
    });
  } catch (err) {
    console.error('[Weather API]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
