-- Create skill categories
CREATE TYPE public.skill_category AS ENUM ('language', 'framework', 'tool', 'concept', 'soft_skill');

-- Create career categories
CREATE TYPE public.career_category AS ENUM ('engineering', 'data', 'design', 'product');

-- Create career_roles table
CREATE TABLE public.career_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category career_category NOT NULL,
  description TEXT NOT NULL,
  day_in_life TEXT,
  salary_min_inr INTEGER,
  salary_max_inr INTEGER,
  demand_level TEXT CHECK (demand_level IN ('high', 'medium', 'low')),
  growth_outlook TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills master table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category skill_category NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_skills junction table (what skills a role requires)
CREATE TABLE public.role_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.career_roles(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  importance TEXT CHECK (importance IN ('critical', 'important', 'nice_to_have')) DEFAULT 'important',
  UNIQUE (role_id, skill_id)
);

-- Create user_skills junction table (what skills a user has)
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 5) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, skill_id)
);

-- Create quiz_responses table
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  experience_years INTEGER,
  education_level TEXT,
  preferred_work_style TEXT,
  interest_areas TEXT[],
  career_goals TEXT[],
  existing_role TEXT,
  learning_time_weekly INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Create role_simulations table
CREATE TABLE public.role_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.career_roles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  scenario TEXT NOT NULL,
  steps JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_simulation_progress table
CREATE TABLE public.user_simulation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  simulation_id UUID REFERENCES public.role_simulations(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, simulation_id)
);

-- Enable RLS on all tables
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_simulation_progress ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Anyone can view career roles" ON public.career_roles FOR SELECT USING (true);
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Anyone can view role skills" ON public.role_skills FOR SELECT USING (true);
CREATE POLICY "Anyone can view role simulations" ON public.role_simulations FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can view own skills" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON public.user_skills FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz responses" ON public.quiz_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz responses" ON public.quiz_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz responses" ON public.quiz_responses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own simulation progress" ON public.user_simulation_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own simulation progress" ON public.user_simulation_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own simulation progress" ON public.user_simulation_progress FOR UPDATE USING (auth.uid() = user_id);