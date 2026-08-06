CREATE TABLE IF NOT EXISTS attendance_breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    break_start TIMESTAMP WITH TIME ZONE NOT NULL,
    break_end TIMESTAMP WITH TIME ZONE,
    duration_minutes INT NOT NULL DEFAULT 0,
    break_type VARCHAR(50) NOT NULL DEFAULT 'Other',  -- Lunch, Tea/Coffee, Personal, Other
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
