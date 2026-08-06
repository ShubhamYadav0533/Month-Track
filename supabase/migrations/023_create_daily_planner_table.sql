CREATE TABLE IF NOT EXISTS daily_planner (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    planner_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL, -- e.g. "06:00 AM", "08:00 AM"
    activity VARCHAR(255) NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
