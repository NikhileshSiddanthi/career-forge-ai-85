-- Drop the restrictive policy and create a permissive one for public read access
DROP POLICY IF EXISTS "Anyone can view internship programs" ON public.internship_programs;

CREATE POLICY "Anyone can view internship programs" 
ON public.internship_programs 
FOR SELECT 
TO public
USING (true);

-- Also fix similar policies for other internship-related tables that should be public
DROP POLICY IF EXISTS "Anyone can view prep paths" ON public.internship_prep_paths;

CREATE POLICY "Anyone can view prep paths" 
ON public.internship_prep_paths 
FOR SELECT 
TO public
USING (true);

DROP POLICY IF EXISTS "Anyone can view prep modules" ON public.internship_prep_modules;

CREATE POLICY "Anyone can view prep modules" 
ON public.internship_prep_modules 
FOR SELECT 
TO public
USING (true);