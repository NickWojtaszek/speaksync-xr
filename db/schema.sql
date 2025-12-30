-- PostgreSQL Database Schema for SpeakSync XR
-- Production database schema for Railway deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Settings Table (for Supabase cross-device sync)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

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

-- Templates Table (for cross-device sync)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- Studies Table (for cross-device sync)
CREATE TABLE IF NOT EXISTS studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_studies_user_id ON studies(user_id);

-- Reports Data Table (for cross-device sync - combines reports, verifications, accounting)
CREATE TABLE IF NOT EXISTS reports_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_data_user_id ON reports_data(user_id);

-- User Preferences Table (language, theme, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  theme_id TEXT,
  microphone_source TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable Row Level Security on new tables
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Templates
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Studies
CREATE POLICY "Users can view own studies" ON studies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own studies" ON studies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own studies" ON studies
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own studies" ON studies
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Reports Data
CREATE POLICY "Users can view own reports data" ON reports_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports data" ON reports_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports data" ON reports_data
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports data" ON reports_data
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for User Preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions (adjust as needed for your Railway setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
