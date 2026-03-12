import { requireAuth, unauthorized } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Fetch today's temperature logs, open alerts, and regulatory profile in parallel
    const [logsRes, alertsRes, regulatoryRes] = await Promise.all([
      auth.supabase
        .from('temperature_logs')
        .select('*')
        .eq('restaurant_id', auth.restaurantId)
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false }),

      auth.supabase
        .from('temperature_alerts')
        .select('*')
        .eq('restaurant_id', auth.restaurantId)
        .in('status', ['open', 'acknowledged'])
        .order('created_at', { ascending: false }),

      auth.supabase
        .from('regulatory_profiles')
        .select('*')
        .limit(1)
        .maybeSingle(),
    ]);

    if (logsRes.error) {
      // Handle schema cache miss gracefully
      if (logsRes.error.message?.includes('schema cache') || logsRes.error.code === '42P01') {
        return new Response(JSON.stringify({ logs: [], alerts: [], regulatoryProfile: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('[temperature-logs GET] Logs error:', logsRes.error.message);
      return new Response(JSON.stringify({ error: logsRes.error.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({
        logs: logsRes.data || [],
        alerts: alertsRes.data || [],
        regulatoryProfile: regulatoryRes.data || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[temperature-logs GET] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const {
      equipment_name,
      equipment_type,
      location,
      temperature_c,
      unit,
      min_acceptable,
      max_acceptable,
      is_within_limits,
      deviation_c,
      source,
      food_item,
      notes,
    } = body;

    if (!equipment_name || temperature_c === undefined || temperature_c === null) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: equipment_name, temperature_c' }),
        { status: 400 }
      );
    }

    // Insert the temperature log
    const { data: logData, error: logError } = await auth.supabase
      .from('temperature_logs')
      .insert({
        restaurant_id: auth.restaurantId,
        logged_by: auth.user.id,
        equipment_name,
        equipment_type: equipment_type || 'other',
        location: location || null,
        temperature_c,
        unit: unit || '°C',
        min_acceptable: min_acceptable ?? null,
        max_acceptable: max_acceptable ?? null,
        is_within_limits: is_within_limits ?? true,
        deviation_c: deviation_c ?? null,
        source: source || 'manual',
        food_item: food_item || null,
        notes: notes || null,
      })
      .select('*')
      .single();

    if (logError) {
      console.error('[temperature-logs POST] Log insert error:', logError.message);
      return new Response(JSON.stringify({ error: logError.message }), { status: 500 });
    }

    // If out of limits, auto-create an alert
    let alertData = null;
    if (!is_within_limits && deviation_c !== null && deviation_c !== undefined) {
      const absDev = Math.abs(deviation_c);
      let severity: 'warning' | 'critical' | 'emergency' = 'warning';
      if (absDev > 5) severity = 'emergency';
      else if (absDev >= 2) severity = 'critical';

      // Determine alert type
      let alert_type = 'high_temp';
      if (min_acceptable !== null && min_acceptable !== undefined && temperature_c < min_acceptable) {
        alert_type = 'low_temp';
      }

      // Check if in danger zone
      const { data: regProfile } = await auth.supabase
        .from('regulatory_profiles')
        .select('danger_zone_min_c, danger_zone_max_c')
        .limit(1)
        .maybeSingle();

      if (regProfile) {
        const dzMin = regProfile.danger_zone_min_c;
        const dzMax = regProfile.danger_zone_max_c;
        if (dzMin !== null && dzMax !== null && temperature_c >= dzMin && temperature_c <= dzMax) {
          alert_type = 'danger_zone';
        }
      }

      const message = `${equipment_name}: ${temperature_c}°C — ${absDev}°C ${alert_type === 'low_temp' ? 'below minimum' : 'above maximum'}`;

      const { data: alert, error: alertError } = await auth.supabase
        .from('temperature_alerts')
        .insert({
          restaurant_id: auth.restaurantId,
          temperature_log_id: logData.id,
          severity,
          alert_type,
          message,
          status: 'open',
        })
        .select('*')
        .single();

      if (alertError) {
        console.error('[temperature-logs POST] Alert insert error:', alertError.message);
        // Don't fail the whole request — the log was saved
      } else {
        alertData = alert;
      }
    }

    return new Response(
      JSON.stringify({ log: logData, alert: alertData }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[temperature-logs POST] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
