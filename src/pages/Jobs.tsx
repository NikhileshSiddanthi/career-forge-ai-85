import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, Building2, Clock, Briefcase, ExternalLink, 
  Bookmark, BookmarkCheck, Loader2, GraduationCap, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  jobType: string;
  experience: string;
  salary: string;
  postedDate: string;
  source: string;
  url: string;
  skills: string[];
  isFresherFriendly: boolean;
}

interface UserSkill {
  name: string;
  proficiency: number;
}

interface LearningPath {
  id: string;
  title: string;
  roleSlug: string;
  estimatedHours: number;
}

const LOCATIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'hyderabad', label: 'Hyderabad' },
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'pune', label: 'Pune' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'delhi', label: 'Delhi NCR' },
  { value: 'remote', label: 'Remote' },
];

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [fresherOnly, setFresherOnly] = useState(true);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<{ id: string; title: string; slug: string } | null>(null);
  const [careerRoles, setCareerRoles] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);

  useEffect(() => {
    fetchCareerRoles();
    fetchUserRole();
    if (user) {
      fetchSavedJobs();
      fetchUserSkills();
      fetchLearningPaths();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoleId || userRole) {
      fetchJobs();
    }
  }, [selectedRoleId, userRole, selectedLocation, fresherOnly]);

  const fetchCareerRoles = async () => {
    const { data } = await supabase.from('career_roles').select('id, title, slug');
    if (data) setCareerRoles(data);
  };

  const fetchUserRole = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    const { data } = await supabase
      .from('user_career_paths')
      .select('role_id, career_roles(id, title, slug)')
      .eq('user_id', user.id)
      .order('selected_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.career_roles) {
      const role = data.career_roles as { id: string; title: string; slug: string };
      setUserRole(role);
      setSelectedRoleId(role.id);
    } else {
      setIsLoading(false);
    }
  };

  const fetchUserSkills = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_skills')
      .select('skill_id, proficiency, skills(name)')
      .eq('user_id', user.id);
    
    if (data) {
      const skills = data.map(s => ({
        name: (s.skills as { name: string })?.name || '',
        proficiency: s.proficiency || 0
      })).filter(s => s.name);
      setUserSkills(skills);
    }
  };

  const fetchLearningPaths = async () => {
    const { data } = await supabase
      .from('learning_paths')
      .select('id, title, estimated_hours, career_roles(slug)')
      .limit(10);
    
    if (data) {
      const paths = data.map(p => ({
        id: p.id,
        title: p.title,
        roleSlug: (p.career_roles as { slug: string })?.slug || '',
        estimatedHours: p.estimated_hours || 40
      }));
      setLearningPaths(paths);
    }
  };

  const fetchSavedJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_jobs')
      .select('job_url')
      .eq('user_id', user.id);
    
    if (data) {
      setSavedJobs(new Set(data.map(j => j.job_url)));
    }
  };

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const roleTitle = selectedRoleId 
        ? careerRoles.find(r => r.id === selectedRoleId)?.title 
        : userRole?.title;

      if (!roleTitle) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-jobs', {
        body: {
          role: roleTitle,
          location: selectedLocation,
          fresherOnly
        }
      });

      if (error) throw error;
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Failed to fetch jobs',
        description: 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaveJob = async (job: Job) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to save jobs',
        variant: 'destructive'
      });
      return;
    }

    const isSaved = savedJobs.has(job.url);
    
    if (isSaved) {
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_url', job.url);
      
      setSavedJobs(prev => {
        const next = new Set(prev);
        next.delete(job.url);
        return next;
      });
      
      toast({ title: 'Job removed from saved' });
    } else {
      await supabase.from('saved_jobs').insert({
        user_id: user.id,
        job_title: job.title,
        company: job.company,
        location: job.location,
        job_url: job.url,
        source: job.source
      });
      
      setSavedJobs(prev => new Set([...prev, job.url]));
      toast({ title: 'Job saved!' });
    }
  };

  // Calculate skill match percentage for a job
  const calculateMatchPercentage = (jobSkills: string[]): number => {
    if (userSkills.length === 0 || jobSkills.length === 0) return 0;
    
    const userSkillNames = userSkills.map(s => s.name.toLowerCase());
    const matchingSkills = jobSkills.filter(skill => 
      userSkillNames.some(us => us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us))
    );
    
    return Math.round((matchingSkills.length / jobSkills.length) * 100);
  };

  // Get missing skills for a job
  const getMissingSkills = (jobSkills: string[]): string[] => {
    if (userSkills.length === 0) return jobSkills;
    
    const userSkillNames = userSkills.map(s => s.name.toLowerCase());
    return jobSkills.filter(skill => 
      !userSkillNames.some(us => us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us))
    );
  };

  // Get relevant learning path for missing skills
  const getSuggestedLearningPath = (): LearningPath | null => {
    const selectedRole = careerRoles.find(r => r.id === selectedRoleId);
    if (!selectedRole) return null;
    
    return learningPaths.find(lp => lp.roleSlug === selectedRole.slug) || null;
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.skills.some(s => s.toLowerCase().includes(query))
    );
  }).sort((a, b) => {
    // Sort by match percentage (higher first)
    return calculateMatchPercentage(b.skills) - calculateMatchPercentage(a.skills);
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getMatchColor = (percent: number) => {
    if (percent >= 80) return 'text-green-400 bg-green-500/20';
    if (percent >= 50) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const suggestedPath = getSuggestedLearningPath();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">Job Board</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/skill-analyzer')}>
              Skill Analyzer
            </Button>
            {user ? (
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')}>Login</Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {userRole ? `${userRole.title} Jobs` : 'Find Your Dream Job'}
          </h1>
          <p className="text-muted-foreground">
            Aggregated from LinkedIn, Naukri, Indeed & more - Fresher friendly opportunities
          </p>
        </div>

        {/* Skill Match Banner */}
        {user && userSkills.length > 0 && suggestedPath && (
          <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Boost Your Match Rate</p>
                    <p className="text-sm text-muted-foreground">
                      Complete "{suggestedPath.title}" to unlock more job opportunities
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => navigate(`/learn/${suggestedPath.roleSlug}`)}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Role Selector */}
            <div>
              <Label className="mb-2 block">Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {careerRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label className="mb-2 block">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <Label className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Company, skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Fresher Toggle */}
            <div>
              <Label className="mb-2 block">Filter</Label>
              <div className="flex items-center gap-3 h-10 px-3 border rounded-md">
                <Switch
                  id="fresher"
                  checked={fresherOnly}
                  onCheckedChange={setFresherOnly}
                />
                <Label htmlFor="fresher" className="text-sm">Fresher Friendly Only</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            {isLoading ? 'Loading...' : `${filteredJobs.length} jobs found`}
            {userSkills.length > 0 && !isLoading && ' (sorted by match %)'}
          </p>
          <Button variant="ghost" size="sm" onClick={fetchJobs}>
            Refresh
          </Button>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !selectedRoleId && !userRole ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Select a Role</h2>
              <p className="text-muted-foreground mb-4">
                Choose a career role above to see matching job opportunities
              </p>
              <Button onClick={() => navigate('/skill-analyzer')}>
                Get Role Suggestions
              </Button>
            </CardContent>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No Jobs Found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job, index) => {
              const matchPercent = calculateMatchPercentage(job.skills);
              const missingSkills = getMissingSkills(job.skills);

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                          {job.companyLogo}
                        </div>

                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-lg font-semibold line-clamp-1">{job.title}</h3>
                                {userSkills.length > 0 && (
                                  <Badge 
                                    variant="outline" 
                                    className={`${getMatchColor(matchPercent)} border-0`}
                                  >
                                    {matchPercent}% Match
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {job.company}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSaveJob(job)}
                              className="flex-shrink-0"
                            >
                              {savedJobs.has(job.url) ? (
                                <BookmarkCheck className="w-5 h-5 text-primary" />
                              ) : (
                                <Bookmark className="w-5 h-5" />
                              )}
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {job.jobType}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.experience}
                            </span>
                          </div>

                          {/* Skills with match indicator */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.skills.slice(0, 6).map((skill) => {
                              const isMatch = userSkills.some(us => 
                                us.name.toLowerCase().includes(skill.toLowerCase()) || 
                                skill.toLowerCase().includes(us.name.toLowerCase())
                              );
                              return (
                                <Badge 
                                  key={skill} 
                                  variant={isMatch ? "default" : "secondary"} 
                                  className={`text-xs ${isMatch ? 'bg-green-600/20 text-green-400 border-green-500/30' : ''}`}
                                >
                                  {skill}
                                </Badge>
                              );
                            })}
                            {job.skills.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.skills.length - 6} more
                              </Badge>
                            )}
                          </div>

                          {/* Learning suggestion for missing skills */}
                          {userSkills.length > 0 && missingSkills.length > 0 && matchPercent < 80 && suggestedPath && (
                            <div className="mt-3 p-3 rounded-lg bg-secondary/50 text-sm">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <GraduationCap className="w-4 h-4 text-primary" />
                                  <span>
                                    Learn <strong className="text-foreground">{missingSkills.slice(0, 2).join(', ')}</strong>
                                    {missingSkills.length > 2 && ` +${missingSkills.length - 2} more`} to improve match
                                  </span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => navigate(`/learn/${suggestedPath.roleSlug}`)}
                                >
                                  Learn Now
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium text-green-600">{job.salary}</span>
                              <span className="text-muted-foreground">via {job.source}</span>
                              <span className="text-muted-foreground">{formatDate(job.postedDate)}</span>
                            </div>
                            <Button size="sm" className="gap-1" asChild>
                              <a href={job.url} target="_blank" rel="noopener noreferrer">
                                Apply <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
