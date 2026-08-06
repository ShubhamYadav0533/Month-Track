CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    image TEXT,
    deep_link TEXT,
    status VARCHAR(50) DEFAULT 'unread', -- unread, read, dismissed
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked BOOLEAN DEFAULT FALSE,
    device_token TEXT,
    action_type VARCHAR(50)
);
