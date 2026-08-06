CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,        -- e.g. 09:00:00
    end_time TIME NOT NULL,          -- e.g. 18:00:00
    required_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.0,
    break_minutes INT NOT NULL DEFAULT 45,
    grace_minutes INT NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to employees after shifts table exists
ALTER TABLE employees
    ADD CONSTRAINT fk_employees_shift
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL;
