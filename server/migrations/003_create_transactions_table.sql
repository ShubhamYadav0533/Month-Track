CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Expense, Income, Transfer, Borrow, Lend, EMI, Investment
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    payment_method VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    recurring BOOLEAN DEFAULT FALSE,
    notes TEXT,
    attachment TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
