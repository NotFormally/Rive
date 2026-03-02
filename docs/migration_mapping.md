# Migration Renaming — March 2026

Supabase CLI requires migrations to follow the `<YYYYMMDDHHmmss>_name.sql` naming pattern.
All 19 legacy migration files were renamed and made idempotent (DROP IF EXISTS guards).

## Mapping Table

| Old Name | New Name (Timestamp) |
|---|---|
| `migration_mega_pack.sql` | `20260225000000_mega_pack.sql` |
| `create_reservations_tables.sql` | `20260225010000_reservations_tables.sql` |
| `create_signup_notifications.sql` | `20260225020000_signup_notifications.sql` |
| `fix_rls.sql` | `20260225030000_fix_rls.sql` |
| `fix_rls_v2.sql` | `20260225040000_fix_rls_v2.sql` |
| `fix_rls_v3.sql` | `20260225050000_fix_rls_v3.sql` |
| `insert_missing_owner.sql` | `20260225060000_insert_missing_owner.sql` |
| `migration_v8_food_cost.sql` | `20260226000000_food_cost.sql` |
| `migration_v9_invoices.sql` | `20260226010000_invoices.sql` |
| `migration_v10_pos_sales.sql` | `20260226020000_pos_sales.sql` |
| `migration_v11_ai_cache.sql` | `20260226030000_ai_cache.sql` |
| `migration_v12_integrations.sql` | `20260226040000_integrations.sql` |
| `migration_v13_reservation_customers.sql` | `20260226050000_reservation_customers.sql` |
| `migration_v14_reservations_enhanced.sql` | `20260226060000_reservations_enhanced.sql` |
| `migration_v15_smart_prep.sql` | `20260226070000_smart_prep.sql` |
| `migration_v16_team_members.sql` | `20260226080000_team_members.sql` |
| `migration_v17_remove_viewer_role.sql` | `20260226090000_remove_viewer_role.sql` |
| `migration_v17_smart_prep_ai.sql` | `20260226100000_smart_prep_ai.sql` |
| `migration_v18_dynamic_food_cost.sql` | `20260226110000_dynamic_food_cost.sql` |

## Already Properly Named (unchanged)

| File |
|---|
| `20260227204011_social_media_context.sql` |
| `20260227205014_social_connections.sql` |
| `20260228000000_brewery_features.sql` |
| `20260228041600_behavioral_engine.sql` |
| `20260228052800_smartlogbook.sql` |

## Idempotency

All files now include `DROP POLICY IF EXISTS` / `DROP TRIGGER IF EXISTS` guards before their respective `CREATE` statements, so they can be safely re-applied without errors.

## Post-rename: Production Database

If these migrations were already applied manually via the Supabase SQL Editor, use `supabase migration repair --status applied <timestamp>` for each one to mark them as already applied, then run `supabase db push` for any new migrations.
