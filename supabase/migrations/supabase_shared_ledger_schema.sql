-- ──────────────────────────────────────────────────────────────
-- Shared Expense, Lending & Monthly Settlement Database Schema
-- ──────────────────────────────────────────────────────────────

-- 1. People
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    avatar_url TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Groups
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Custom',
    currency TEXT DEFAULT '₹',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, person_id)
);

-- 4. Shared Expenses
CREATE TABLE IF NOT EXISTS public.shared_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount > 0),
    paid_by_person_id UUID NOT NULL REFERENCES public.people(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    month VARCHAR(7) NOT NULL,
    split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'exact', 'percentage', 'share')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'voided', 'adjusted')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Expense Splits
CREATE TABLE IF NOT EXISTS public.expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    percentage NUMERIC(5, 2),
    shares NUMERIC(8, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Loans (Money Lent / Borrowed)
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('LEND', 'BORROW')),
    original_amount NUMERIC(14, 2) NOT NULL CHECK (original_amount > 0),
    remaining_amount NUMERIC(14, 2) NOT NULL CHECK (remaining_amount >= 0),
    repaid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (repaid_amount >= 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    description TEXT NOT NULL,
    payment_method TEXT DEFAULT 'UPI',
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Paid', 'Fully Paid', 'Overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Repayments
CREATE TABLE IF NOT EXISTS public.repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL,
    person_id UUID NOT NULL REFERENCES public.people(id),
    from_person_id UUID NOT NULL REFERENCES public.people(id),
    to_person_id UUID NOT NULL REFERENCES public.people(id),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    status TEXT DEFAULT 'Partially Paid',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Settlements
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    from_person_id UUID NOT NULL REFERENCES public.people(id),
    to_person_id UUID NOT NULL REFERENCES public.people(id),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    month VARCHAR(7) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    status TEXT DEFAULT 'Settled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Ledger Audit Transactions
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'CONTRIBUTION', 'LEND', 'BORROW', 'REPAYMENT', 'ADJUSTMENT', 'SETTLEMENT')),
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT '₹',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    month VARCHAR(7) NOT NULL,
    description TEXT NOT NULL,
    created_by TEXT DEFAULT 'User',
    related_transaction_id UUID,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'voided', 'adjusted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES FOR PERFORMANCE OPTIMIZATION ──
CREATE INDEX IF NOT EXISTS idx_people_user_id ON public.people(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON public.groups(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_user_id ON public.shared_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_group_id ON public.shared_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_month ON public.shared_expenses(month);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_person_id ON public.loans(person_id);
CREATE INDEX IF NOT EXISTS idx_repayments_person_id ON public.repayments(person_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_month ON public.ledger_transactions(month);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_type ON public.ledger_transactions(type);
