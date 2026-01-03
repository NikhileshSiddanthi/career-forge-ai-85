-- Create enum for internship categories
CREATE TYPE public.internship_category AS ENUM (
  'global_tech',
  'product_based',
  'women_focused',
  'service_based',
  'startups_open',
  'competitive_coding'
);

-- Create internship programs table
CREATE TABLE public.internship_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  category internship_category NOT NULL,
  description TEXT,
  eligibility TEXT,
  application_link TEXT,
  logo_url TEXT,
  stipend_range TEXT,
  duration TEXT,
  application_months TEXT[], -- e.g., ['January', 'February']
  skills_required TEXT[],
  difficulty_level TEXT DEFAULT 'intermediate',
  is_women_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create internship preparation paths (links internships to learning content)
CREATE TABLE public.internship_prep_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internship_id UUID NOT NULL REFERENCES public.internship_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  estimated_weeks INTEGER DEFAULT 4,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prep modules (like courses for internship prep)
CREATE TABLE public.internship_prep_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prep_path_id UUID NOT NULL REFERENCES public.internship_prep_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  module_type TEXT DEFAULT 'reading', -- reading, coding, mock_interview, project
  order_index INTEGER DEFAULT 0,
  estimated_hours INTEGER DEFAULT 2,
  resources JSONB, -- links, videos, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User internship tracking
CREATE TABLE public.user_internship_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  internship_id UUID NOT NULL REFERENCES public.internship_programs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'interested', -- interested, preparing, applied, interview, offered, rejected
  applied_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, internship_id)
);

-- User prep progress
CREATE TABLE public.user_internship_prep_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.internship_prep_modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.internship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_prep_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_prep_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_internship_prep_progress ENABLE ROW LEVEL SECURITY;

-- Public read access for internship content
CREATE POLICY "Anyone can view internship programs" ON public.internship_programs FOR SELECT USING (true);
CREATE POLICY "Anyone can view prep paths" ON public.internship_prep_paths FOR SELECT USING (true);
CREATE POLICY "Anyone can view prep modules" ON public.internship_prep_modules FOR SELECT USING (true);

-- User-specific policies for tracking
CREATE POLICY "Users can view own applications" ON public.user_internship_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.user_internship_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.user_internship_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.user_internship_applications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own prep progress" ON public.user_internship_prep_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prep progress" ON public.user_internship_prep_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prep progress" ON public.user_internship_prep_progress FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_internship_applications_updated_at
BEFORE UPDATE ON public.user_internship_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert all internship programs
INSERT INTO public.internship_programs (name, company, category, description, eligibility, skills_required, difficulty_level, is_women_only, duration, application_months) VALUES
-- Global Tech Companies
('STEP Internship', 'Google', 'global_tech', 'First or second year students get hands-on experience with Google engineering projects', '1st/2nd year undergrad students', ARRAY['DSA', 'Problem Solving', 'Any Programming Language'], 'beginner', false, '10-12 weeks', ARRAY['September', 'October']),
('Engage Program', 'Microsoft', 'global_tech', 'Mentorship program for engineering students to work on real Microsoft projects', '2nd/3rd year students', ARRAY['DSA', 'System Design', 'C++/Java/Python'], 'intermediate', false, '4-6 weeks', ARRAY['February', 'March']),
('WOW Internship', 'Amazon', 'global_tech', 'Women of the World internship for aspiring female engineers', '2nd/3rd year female students', ARRAY['DSA', 'OOPs', 'Problem Solving'], 'intermediate', true, '2 months', ARRAY['January', 'February']),
('University Internship', 'Meta', 'global_tech', 'Software engineering internship at Meta for university students', '3rd/4th year students', ARRAY['DSA', 'System Design', 'React/Mobile'], 'advanced', false, '12 weeks', ARRAY['September', 'October']),
('Internship Program', 'Apple', 'global_tech', 'Work alongside Apple engineers on innovative products', '3rd/4th year students', ARRAY['iOS/macOS', 'Swift', 'System Programming'], 'advanced', false, '12 weeks', ARRAY['October', 'November']),
('Internship Program', 'Netflix', 'global_tech', 'Join Netflix engineering teams on streaming technology', '3rd/4th year students', ARRAY['Distributed Systems', 'Java', 'Cloud'], 'advanced', false, '12 weeks', ARRAY['January', 'February']),
('STAR Internship', 'Uber', 'global_tech', 'Build mobility solutions that move the world', '2nd/3rd year students', ARRAY['DSA', 'Backend', 'Mobile Development'], 'intermediate', false, '12 weeks', ARRAY['August', 'September']),
('REACH Internship', 'LinkedIn', 'global_tech', 'Non-traditional background internship for underrepresented students', '2nd/3rd year students', ARRAY['Web Development', 'DSA', 'Java/Python'], 'intermediate', false, '12 weeks', ARRAY['September', 'October']),
('Futureforce Internship', 'Salesforce', 'global_tech', 'Build cloud solutions and learn enterprise software development', '3rd/4th year students', ARRAY['Java', 'Cloud', 'APIs'], 'intermediate', false, '12 weeks', ARRAY['January', 'February']),
('University Internship', 'Twitter/X', 'global_tech', 'Work on real-time communication platform engineering', '3rd/4th year students', ARRAY['Distributed Systems', 'Scala/Java', 'Backend'], 'advanced', false, '12 weeks', ARRAY['September', 'October']),

-- Product-Based Companies
('CodeHers', 'Walmart', 'product_based', 'Women-focused hiring program with mentorship and projects', '3rd year female students', ARRAY['DSA', 'Java/Python', 'System Design'], 'intermediate', true, '6-8 weeks', ARRAY['March', 'April']),
('SheCodes', 'Adobe', 'product_based', 'Empower women in tech through Adobe internship experience', '3rd year female students', ARRAY['DSA', 'JavaScript', 'Creative Tools'], 'intermediate', true, '8 weeks', ARRAY['February', 'March']),
('Runway Program', 'Flipkart', 'product_based', 'E-commerce engineering internship at India''s leading platform', '3rd/4th year students', ARRAY['DSA', 'Java', 'Microservices'], 'intermediate', false, '2 months', ARRAY['July', 'August']),
('Step Internship', 'Swiggy', 'product_based', 'Build hyperlocal delivery technology at scale', '3rd year students', ARRAY['Backend', 'DSA', 'Python/Go'], 'intermediate', false, '2 months', ARRAY['January', 'February']),
('Tech Scholars', 'Meesho', 'product_based', 'Join India''s fastest growing social commerce platform', '3rd year students', ARRAY['React', 'Node.js', 'DSA'], 'intermediate', false, '2 months', ARRAY['February', 'March']),
('Third Year Internship', 'Razorpay', 'product_based', 'FinTech internship building payment infrastructure', '3rd year students', ARRAY['Backend', 'DSA', 'Go/Ruby'], 'intermediate', false, '2 months', ARRAY['January', 'February']),
('Software Intern Program', 'Zomato', 'product_based', 'Food-tech engineering experience at scale', '3rd year students', ARRAY['DSA', 'Python', 'Backend'], 'intermediate', false, '2 months', ARRAY['December', 'January']),
('University Internship', 'PayPal', 'product_based', 'Global payments technology internship', '3rd/4th year students', ARRAY['Java', 'DSA', 'FinTech'], 'intermediate', false, '12 weeks', ARRAY['August', 'September']),
('Internship Program', 'Intuit', 'product_based', 'Build financial software used by millions', '3rd year students', ARRAY['Java', 'React', 'Cloud'], 'intermediate', false, '12 weeks', ARRAY['July', 'August']),
('Internship Program', 'Atlassian', 'product_based', 'Work on collaboration tools like Jira and Confluence', '3rd/4th year students', ARRAY['Java', 'React', 'Cloud'], 'intermediate', false, '12 weeks', ARRAY['February', 'March']),

-- Women-Focused Programs
('Women Techmakers Scholars', 'Google', 'women_focused', 'Scholarship and community for women in tech', 'Female students in tech', ARRAY['Leadership', 'Technical Skills', 'Community'], 'beginner', true, 'Ongoing', ARRAY['March', 'April']),
('Codess', 'Microsoft', 'women_focused', 'Community and hiring program for women in engineering', 'Female engineering students', ARRAY['DSA', 'System Design', 'Any Language'], 'intermediate', true, 'Ongoing', ARRAY['Year-round']),
('She++', 'Uber', 'women_focused', 'Mentorship and internship track for women engineers', 'Female 2nd/3rd year students', ARRAY['DSA', 'Mobile/Backend', 'Problem Solving'], 'intermediate', true, '12 weeks', ARRAY['August', 'September']),
('CoachIn', 'LinkedIn', 'women_focused', 'Coaching and mentorship for women in tech careers', 'Female students', ARRAY['Career Development', 'Technical Skills'], 'beginner', true, 'Ongoing', ARRAY['Year-round']),
('Women Possibilities Summit', 'Goldman Sachs', 'women_focused', 'Summit and internship opportunities for women in finance tech', 'Female 2nd year students', ARRAY['DSA', 'Finance', 'Problem Solving'], 'intermediate', true, '10 weeks', ARRAY['October', 'November']),
('Code for Good', 'JPMorgan Chase', 'women_focused', 'Hackathon leading to internship opportunities', 'All engineering students', ARRAY['Full Stack', 'Problem Solving', 'Teamwork'], 'intermediate', false, '24-hour hackathon', ARRAY['September', 'October']),
('Code Your Way', 'Visa', 'women_focused', 'Women in payments technology program', 'Female engineering students', ARRAY['Java', 'APIs', 'Security'], 'intermediate', true, '10 weeks', ARRAY['January', 'February']),
('Women in Tech', 'Accenture', 'women_focused', 'Dedicated hiring and mentorship for women', 'Female students', ARRAY['Consulting', 'Technology', 'Problem Solving'], 'beginner', true, 'Varies', ARRAY['Year-round']),
('Women Rock IT', 'Cisco', 'women_focused', 'Networking and IT infrastructure for women', 'Female students', ARRAY['Networking', 'Cloud', 'Security'], 'intermediate', true, 'Varies', ARRAY['Year-round']),

-- Service-Based Companies
('Research Internship', 'TCS', 'service_based', 'Research and innovation projects at TCS labs', '3rd/4th year students', ARRAY['Research', 'ML/AI', 'Problem Solving'], 'advanced', false, '2-6 months', ARRAY['December', 'January']),
('InStep Internship', 'Infosys', 'service_based', 'Global internship program with cross-cultural exposure', '3rd/4th year students', ARRAY['Java', 'Python', 'Cloud'], 'intermediate', false, '2-3 months', ARRAY['January', 'February']),
('WILP Program', 'Wipro', 'service_based', 'Work Integrated Learning Program for freshers', 'Final year students', ARRAY['Programming Basics', 'Aptitude', 'Communication'], 'beginner', false, '4 years (work + study)', ARRAY['Year-round']),
('Internship Program', 'Cognizant', 'service_based', 'Technology consulting and development experience', '3rd/4th year students', ARRAY['Java', '.NET', 'Testing'], 'intermediate', false, '2 months', ARRAY['January', 'February']),
('Exceller Internship', 'Capgemini', 'service_based', 'Global consulting firm tech internship', '3rd/4th year students', ARRAY['Cloud', 'DevOps', 'Full Stack'], 'intermediate', false, '2-3 months', ARRAY['February', 'March']),
('Summer Internship', 'Accenture', 'service_based', 'Technology consulting summer experience', '3rd year students', ARRAY['Consulting', 'Cloud', 'Digital'], 'intermediate', false, '8-10 weeks', ARRAY['March', 'April']),
('TechBee', 'HCL', 'service_based', 'Early career program for 12th pass students', '12th pass students', ARRAY['Basic Programming', 'Aptitude', 'English'], 'beginner', false, '1 year training', ARRAY['May', 'June']),

-- Startups & Open Programs
('MLH Fellowship', 'MLH', 'startups_open', 'Open source and production engineering fellowship', 'University students globally', ARRAY['Open Source', 'Git', 'Any Language'], 'intermediate', false, '12 weeks', ARRAY['January', 'May', 'September']),
('Google Summer of Code', 'Google', 'startups_open', 'Work on open source projects with mentorship', 'University students globally', ARRAY['Open Source', 'Git', 'Any Language'], 'intermediate', false, '12 weeks', ARRAY['February', 'March']),
('Mentorship Program', 'Linux Foundation', 'startups_open', 'Contribute to Linux kernel and related projects', 'Students and early career', ARRAY['C/C++', 'Linux', 'Systems'], 'advanced', false, '12 weeks', ARRAY['Year-round']),
('Outreachy', 'Software Freedom Conservancy', 'startups_open', 'Internships for underrepresented groups in tech', 'Underrepresented groups', ARRAY['Open Source', 'Any Language'], 'intermediate', false, '3 months', ARRAY['February', 'August']),
('Internship Program', 'ISRO', 'startups_open', 'Space research and engineering internship', 'Engineering students', ARRAY['Aerospace', 'Electronics', 'Programming'], 'advanced', false, '2-6 months', ARRAY['Year-round']),
('Internship Program', 'DRDO', 'startups_open', 'Defense research and development experience', 'Engineering students', ARRAY['Defense Tech', 'Electronics', 'Research'], 'advanced', false, '2-6 months', ARRAY['Year-round']),
('Research Internships', 'IITs/IISc', 'startups_open', 'Academic research experience at premier institutes', 'Undergrad students', ARRAY['Research', 'Mathematics', 'Any Domain'], 'advanced', false, '2-3 months', ARRAY['May', 'June']),
('Virtual Internships', 'AICTE', 'startups_open', 'Government-backed virtual internship platform', 'All students', ARRAY['Various', 'Basic Tech Skills'], 'beginner', false, 'Flexible', ARRAY['Year-round']),

-- Competitive Coding Based
('Contest Internships', 'Codeforces', 'competitive_coding', 'Get noticed by companies through competitive programming', 'Competitive programmers', ARRAY['DSA', 'Competitive Programming', 'Problem Solving'], 'advanced', false, 'Varies', ARRAY['Year-round']),
('LeetCode Hiring', 'LeetCode', 'competitive_coding', 'Companies hire through LeetCode contests and profiles', 'Competitive programmers', ARRAY['DSA', 'System Design', 'Problem Solving'], 'advanced', false, 'Varies', ARRAY['Year-round']),
('Hiring Challenges', 'HackerRank', 'competitive_coding', 'Solve coding challenges to get hired', 'All students', ARRAY['DSA', 'Problem Solving', 'Any Language'], 'intermediate', false, 'Varies', ARRAY['Year-round']),
('Hiring Challenges', 'HackerEarth', 'competitive_coding', 'Participate in hiring hackathons', 'All students', ARRAY['DSA', 'Full Stack', 'Problem Solving'], 'intermediate', false, 'Varies', ARRAY['Year-round']),
('Smart India Hackathon', 'Government of India', 'competitive_coding', 'National level hackathon with PPO opportunities', 'All students', ARRAY['Innovation', 'Full Stack', 'Problem Solving'], 'intermediate', false, '36-hour hackathon', ARRAY['August', 'September']);