CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'General',
    designation VARCHAR(100) NOT NULL DEFAULT 'Employee',
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift_id UUID,
    office_location VARCHAR(255),
    manager_name VARCHAR(255),
    avatar_url TEXT,
    is_setup_complete BOOLEAN DEFAULT FALSE,
    pin_code VARCHAR(10),
    is_biometrics_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
