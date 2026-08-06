-- Productivity OS Indexes
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'unread';

CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_daily_planner_date ON daily_planner(planner_date);

