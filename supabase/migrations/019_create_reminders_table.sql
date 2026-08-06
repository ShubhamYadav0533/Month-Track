CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    trigger_time TIMESTAMP WITH TIME ZONE NOT NULL,
    repeat_type VARCHAR(50) DEFAULT 'Once',
    repeat_interval INT DEFAULT 1,
    notification_type VARCHAR(50) DEFAULT 'Local',
    sound VARCHAR(100) DEFAULT 'default',
    vibration BOOLEAN DEFAULT TRUE,
    snooze_minutes INT DEFAULT 10,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
