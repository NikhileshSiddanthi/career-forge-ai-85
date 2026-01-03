-- Add unique constraint for interview progress upsert
ALTER TABLE user_interview_progress 
ADD CONSTRAINT user_interview_progress_user_company_role_unique 
UNIQUE (user_id, company_id, role_id);