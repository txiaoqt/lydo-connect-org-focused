# Worker Directory Note

The methodology documentation for LYDO Connect treats Supabase program and event registration tables as the local source of record. The current worker supports the optional external attendance workflow by processing pending rows from `event_registrations` and `program_registrations` and posting them to configured Google Forms when `external_attendance_enabled` is active.

Run `python worker/gform_sync_worker.py --once` for a single processing cycle, or use the admin portal's protected "Run Sync Now" action when the deployment has `SYNC_TRIGGER_TOKEN` and Supabase service-role credentials configured. Worker sync status is stored in the registration rows as `pending`, `synced`, `failed`, or `skipped`.
