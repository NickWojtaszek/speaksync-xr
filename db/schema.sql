-- PostgreSQL Database Schema for SpeakSync XR
-- Production database schema for Railway deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teaching Cases Table
CREATE TABLE IF NOT EXISTS teaching_cases (
  id SERIAL PRIMARY KEY,

  -- Report Content
  original_report TEXT NOT NULL,
  ai_improved_report TEXT,
  final_user_report TEXT NOT NULL,

  -- Classification
  organ_category VARCHAR(100) NOT NULL,
  disease_classification VARCHAR(255),
  disease_confidence DECIMAL(3, 2) CHECK (disease_confidence >= 0 AND disease_confidence <= 1),

  -- Patient/Study Identification
  study_number VARCHAR(100) NOT NULL,
  patient_pesel VARCHAR(11),

  -- Template Information
  template_id VARCHAR(50),
  template_header TEXT,

  -- Additional Case Information
  pathology_report TEXT,
  uniqueness_rating INTEGER CHECK (uniqueness_rating >= 1 AND uniqueness_rating <= 5),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  author_id VARCHAR(255),
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,

  -- Soft Delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teaching_cases_organ ON teaching_cases(organ_category);
CREATE INDEX IF NOT EXISTS idx_teaching_cases_disease ON teaching_cases(disease_classification);
CREATE INDEX IF NOT EXISTS idx_teaching_cases_study_number ON teaching_cases(study_number);
CREATE INDEX IF NOT EXISTS idx_teaching_cases_created_at ON teaching_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teaching_cases_author ON teaching_cases(author_id);
CREATE INDEX IF NOT EXISTS idx_teaching_cases_deleted ON teaching_cases(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_teaching_cases_tags ON teaching_cases USING GIN(tags);

-- Users Table (for future auth system)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'radiologist' CHECK (role IN ('radiologist', 'verifier', 'accounting', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Reports Table (for financial reports)
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  total_points DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id),

  UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(year DESC, month DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teaching_cases_updated_at BEFORE UPDATE ON teaching_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for active (non-deleted) teaching cases
CREATE OR REPLACE VIEW active_teaching_cases AS
SELECT * FROM teaching_cases
WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Grant permissions (adjust as needed for your Railway setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
