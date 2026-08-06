CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    icon VARCHAR(100) DEFAULT 'check',
    color VARCHAR(50) DEFAULT '#10b981',
    goal_type VARCHAR(50) DEFAULT 'Daily',
    target_value INT DEFAULT 1,
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    completed_days JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
