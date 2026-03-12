import { requireAuth, unauthorized } from '@/lib/auth';

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const { alert_id, action, corrective_action } = body;

    if (!alert_id || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: alert_id, action' }),
        { status: 400 }
      );
    }

    if (action !== 'acknowledge' && action !== 'resolve') {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "acknowledge" or "resolve"' }),
        { status: 400 }
      );
    }

    // Verify the alert belongs to this restaurant
    const { data: existingAlert, error: fetchError } = await auth.supabase
      .from('temperature_alerts')
      .select('id, restaurant_id, status, created_at')
      .eq('id', alert_id)
      .eq('restaurant_id', auth.restaurantId)
      .single();

    if (fetchError || !existingAlert) {
      return new Response(
        JSON.stringify({ error: 'Alert not found' }),
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (action === 'acknowledge') {
      // Calculate response time from alert creation
      const createdAt = new Date(existingAlert.created_at).getTime();
      const responseTimeSeconds = Math.round((Date.now() - createdAt) / 1000);

      const { data, error } = await auth.supabase
        .from('temperature_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: auth.user.id,
          acknowledged_at: now,
          response_time_seconds: responseTimeSeconds,
        })
        .eq('id', alert_id)
        .select('*')
        .single();

      if (error) {
        console.error('[temperature-alerts PATCH] Acknowledge error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'resolve') {
      if (!corrective_action || !corrective_action.trim()) {
        return new Response(
          JSON.stringify({ error: 'corrective_action is required to resolve an alert' }),
          { status: 400 }
        );
      }

      const { data, error } = await auth.supabase
        .from('temperature_alerts')
        .update({
          status: 'resolved',
          resolved_by: auth.user.id,
          resolved_at: now,
          corrective_action: corrective_action.trim(),
          resolution_notes: corrective_action.trim(),
        })
        .eq('id', alert_id)
        .select('*')
        .single();

      if (error) {
        console.error('[temperature-alerts PATCH] Resolve error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('[temperature-alerts PATCH] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
