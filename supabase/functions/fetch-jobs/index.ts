import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock job data for demonstration - in production, integrate with real job APIs
const generateMockJobs = (role: string, location: string) => {
  const companies = [
    { name: 'Google', logo: '🔵' },
    { name: 'Microsoft', logo: '🟢' },
    { name: 'Amazon', logo: '🟠' },
    { name: 'Flipkart', logo: '🟡' },
    { name: 'Infosys', logo: '🔷' },
    { name: 'TCS', logo: '🔶' },
    { name: 'Wipro', logo: '🟣' },
    { name: 'Accenture', logo: '⬛' },
    { name: 'IBM', logo: '🔵' },
    { name: 'Adobe', logo: '🔴' },
  ];

  const locations = [
    'Bangalore, India',
    'Hyderabad, India',
    'Mumbai, India',
    'Pune, India',
    'Chennai, India',
    'Delhi NCR, India',
    'Remote',
  ];

  const jobTypes = ['Full-time', 'Internship', 'Contract'];
  const sources = ['LinkedIn', 'Naukri', 'Indeed', 'Company Career Page'];

  const jobs = [];
  const numJobs = Math.floor(Math.random() * 10) + 15; // 15-25 jobs

  for (let i = 0; i < numJobs; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const jobLocation = location !== 'all' 
      ? locations.find(l => l.toLowerCase().includes(location.toLowerCase())) || locations[Math.floor(Math.random() * locations.length)]
      : locations[Math.floor(Math.random() * locations.length)];
    
    const isFresher = Math.random() > 0.3;
    const experience = isFresher ? '0-1 years' : `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3) + 3} years`;

    jobs.push({
      id: crypto.randomUUID(),
      title: `${role}${isFresher ? ' - Fresher' : ''}`,
      company: company.name,
      companyLogo: company.logo,
      location: jobLocation,
      jobType: isFresher ? (Math.random() > 0.5 ? 'Internship' : 'Full-time') : jobTypes[Math.floor(Math.random() * jobTypes.length)],
      experience,
      salary: isFresher 
        ? `₹${Math.floor(Math.random() * 6 + 4)} - ₹${Math.floor(Math.random() * 8 + 8)} LPA`
        : `₹${Math.floor(Math.random() * 10 + 8)} - ₹${Math.floor(Math.random() * 15 + 15)} LPA`,
      postedDate: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      source: sources[Math.floor(Math.random() * sources.length)],
      url: `https://example.com/jobs/${crypto.randomUUID()}`,
      skills: getSkillsForRole(role),
      isFresherFriendly: isFresher,
    });
  }

  return jobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
};

const getSkillsForRole = (role: string): string[] => {
  const skillsMap: Record<string, string[]> = {
    'Frontend Developer': ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Tailwind'],
    'Backend Developer': ['Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'REST APIs'],
    'Full Stack Developer': ['React', 'Node.js', 'JavaScript', 'SQL', 'MongoDB', 'AWS'],
    'Data Scientist': ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics', 'Pandas'],
    'Data Analyst': ['SQL', 'Excel', 'Python', 'Tableau', 'Power BI', 'Statistics'],
    'Product Manager': ['Product Strategy', 'Agile', 'User Research', 'Data Analysis', 'Roadmapping'],
    'UI/UX Designer': ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Terraform'],
    'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Deep Learning', 'NLP', 'Computer Vision'],
  };

  const defaultSkills = ['Problem Solving', 'Communication', 'Teamwork', 'Git'];
  const roleSkills = Object.entries(skillsMap).find(([key]) => 
    role.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(role.toLowerCase())
  );

  if (roleSkills) {
    return [...roleSkills[1].slice(0, 4), ...defaultSkills.slice(0, 2)];
  }
  return defaultSkills;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, location = 'all', fresherOnly = true } = await req.json();

    if (!role) {
      return new Response(
        JSON.stringify({ error: 'Role is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching jobs for role: ${role}, location: ${location}, fresherOnly: ${fresherOnly}`);

    // Generate mock jobs - in production, call real job APIs here
    let jobs = generateMockJobs(role, location);

    if (fresherOnly) {
      jobs = jobs.filter(job => job.isFresherFriendly);
    }

    console.log(`Found ${jobs.length} jobs`);

    return new Response(JSON.stringify({ jobs, total: jobs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-jobs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
