CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,   -- Casual, Sick, Paid, Unpaid, Emergency, Half Day, Work From Home
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4, 1) NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    attachment TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',  -- Pending, Approved, Rejected
    approved_by VARCHAR(255),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
