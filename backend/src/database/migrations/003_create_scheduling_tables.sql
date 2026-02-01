-- Migration: 003_create_scheduling_tables
-- Creates tables for native appointment scheduling system

-- ============================================
-- 1. Availability Slots (Company Schedule)
-- ============================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Schedule
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Slot Configuration
    slot_duration INT DEFAULT 30,      -- minutes per slot
    buffer_between INT DEFAULT 10,     -- buffer between appointments
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_company ON availability_slots(company_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON availability_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_active ON availability_slots(is_active) WHERE is_active = true;

-- ============================================
-- 2. Appointments (Bookings)
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Appointment Details
    title TEXT NOT NULL DEFAULT 'Reunião',
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    
    -- Status: scheduled, confirmed, cancelled, completed, no_show
    status TEXT DEFAULT 'scheduled',
    
    -- Attendee Info
    attendee_name TEXT,
    attendee_phone TEXT,
    attendee_email TEXT,
    
    -- Tracking
    reminder_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    completed_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_appointment_time CHECK (start_time < end_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_company ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(start_time, status) 
    WHERE status IN ('scheduled', 'confirmed');

-- ============================================
-- 3. RLS Policies
-- ============================================
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Availability: company members can view/edit
CREATE POLICY availability_company_policy ON availability_slots
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid()
        )
    );

-- Appointments: company members can view/edit
CREATE POLICY appointments_company_policy ON appointments
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 4. Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_updated
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_timestamp();

CREATE TRIGGER availability_updated
    BEFORE UPDATE ON availability_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_timestamp();

-- ============================================
-- 5. Default Availability (Helper)
-- ============================================
-- Insert default business hours for new companies via trigger
CREATE OR REPLACE FUNCTION create_default_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Monday to Friday, 9:00-18:00
    INSERT INTO availability_slots (company_id, day_of_week, start_time, end_time)
    SELECT NEW.id, dow, '09:00'::TIME, '18:00'::TIME
    FROM generate_series(1, 5) AS dow;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to new companies (optional, uncomment if wanted)
-- CREATE TRIGGER company_default_availability
--     AFTER INSERT ON companies
--     FOR EACH ROW
--     EXECUTE FUNCTION create_default_availability();
