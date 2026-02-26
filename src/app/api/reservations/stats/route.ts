import { NextResponse } from 'next/server';
import { requireAuth, unauthorized } from '@/lib/auth';

// =============================================================================
// Reservation Stats Route — Aggregated metrics for the dashboard
// Endpoint: GET /api/reservations/stats?from=YYYY-MM-DD&to=YYYY-MM-DD&group_by=day
//
// Returns:
//   - Daily/weekly/monthly reservation counts by status
//   - Total guests, average party size, provider breakdown
//   - Recent sync activity summary (last 10 sync logs)
//   - No-show rate and cancellation rate
//
// Query params:
//   from    — Start date (default: 30 days ago)
//   to      — End date (default: today)
//   group_by — 'day' | 'week' | 'month' (default: 'day')
// =============================================================================

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);

  // Parse date range (default: last 30 days)
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
  const defaultTo = now.toISOString().split('T')[0];

  const from = searchParams.get('from') || defaultFrom;
  const to = searchParams.get('to') || defaultTo;
  const groupBy = searchParams.get('group_by') || 'day'; // day | week | month

  try {
    // 1. Fetch all reservations in the date range
    const { data: reservations, error: resError } = await auth.supabase
      .from('reservations')
      .select('id, guest_count, reservation_time, status, provider_id, created_at')
      .eq('restaurant_id', auth.restaurantId)
      .gte('reservation_time', `${from}T00:00:00`)
      .lte('reservation_time', `${to}T23:59:59`)
      .order('reservation_time', { ascending: true });

    if (resError) {
      return NextResponse.json({ error: resError.message }, { status: 500 });
    }

    const allReservations = reservations || [];

    // 2. Compute aggregate metrics
    const totalReservations = allReservations.length;
    const totalGuests = allReservations.reduce((sum, r) => sum + (r.guest_count || 0), 0);
    const avgPartySize = totalReservations > 0 ? Math.round((totalGuests / totalReservations) * 10) / 10 : 0;

    // Status breakdown
    const statusCounts = {
      booked: 0,
      seated: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    };
    for (const r of allReservations) {
      const s = r.status as keyof typeof statusCounts;
      if (s in statusCounts) statusCounts[s]++;
    }

    // Rates
    const completedOrSeated = statusCounts.completed + statusCounts.seated + statusCounts.no_show;
    const noShowRate = completedOrSeated > 0
      ? Math.round((statusCounts.no_show / completedOrSeated) * 1000) / 10
      : 0;
    const cancellationRate = totalReservations > 0
      ? Math.round((statusCounts.cancelled / totalReservations) * 1000) / 10
      : 0;

    // 3. Group by time period
    const grouped = groupReservations(allReservations, groupBy);

    // 4. Provider breakdown
    const providerCounts: Record<string, number> = {};
    for (const r of allReservations) {
      const pid = r.provider_id || 'unknown';
      providerCounts[pid] = (providerCounts[pid] || 0) + 1;
    }

    // 5. Fetch recent sync logs (last 10)
    const { data: syncLogs } = await auth.supabase
      .from('reservation_sync_log')
      .select('id, provider_id, sync_type, status, reservations_created, reservations_updated, errors_count, error_message, duration_ms, created_at')
      .eq('restaurant_id', auth.restaurantId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 6. Fetch provider names for readable output
    const { data: providers } = await auth.supabase
      .from('reservation_providers')
      .select('id, provider_name, status, polling_enabled, sync_errors_count, last_sync_at')
      .eq('restaurant_id', auth.restaurantId);

    return NextResponse.json({
      period: { from, to, group_by: groupBy },
      summary: {
        total_reservations: totalReservations,
        total_guests: totalGuests,
        avg_party_size: avgPartySize,
        no_show_rate: noShowRate,
        cancellation_rate: cancellationRate,
        status_breakdown: statusCounts,
      },
      daily_data: grouped,
      providers: (providers || []).map(p => ({
        id: p.id,
        name: p.provider_name,
        status: p.status,
        polling_enabled: p.polling_enabled,
        sync_errors: p.sync_errors_count,
        last_sync: p.last_sync_at,
        reservation_count: providerCounts[p.id] || 0,
      })),
      recent_sync_activity: syncLogs || [],
    });

  } catch (error: any) {
    console.error('[Stats] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helper: Group reservations by day/week/month
// ---------------------------------------------------------------------------

function groupReservations(
  reservations: Array<{ reservation_time: string; guest_count: number; status: string }>,
  groupBy: string
) {
  const groups: Record<string, {
    period: string;
    total: number;
    guests: number;
    booked: number;
    completed: number;
    cancelled: number;
    no_show: number;
  }> = {};

  for (const r of reservations) {
    const date = new Date(r.reservation_time);
    let key: string;

    switch (groupBy) {
      case 'week': {
        // ISO week: find the Monday of the week
        const day = date.getDay();
        const monday = new Date(date);
        monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
        key = monday.toISOString().split('T')[0];
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // 'day'
        key = date.toISOString().split('T')[0];
    }

    if (!groups[key]) {
      groups[key] = { period: key, total: 0, guests: 0, booked: 0, completed: 0, cancelled: 0, no_show: 0 };
    }

    groups[key].total++;
    groups[key].guests += r.guest_count || 0;

    if (r.status === 'booked' || r.status === 'seated') groups[key].booked++;
    else if (r.status === 'completed') groups[key].completed++;
    else if (r.status === 'cancelled') groups[key].cancelled++;
    else if (r.status === 'no_show') groups[key].no_show++;
  }

  return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
}
