import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, Building2, Clock, Briefcase, ExternalLink, 
  Bookmark, BookmarkCheck, Filter, Loader2, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const [userRole, setUserRole] = useState<{ id: string; title: string } | null>(null);
  const [careerRoles, setCareerRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    fetchCareerRoles();
    fetchUserRole();
    if (user) fetchSavedJobs();
  }, [user]);

  useEffect(() => {
    if (selectedRoleId || userRole) {
      fetchJobs();
    }
  }, [selectedRoleId, userRole, selectedLocation, fresherOnly]);

  const fetchCareerRoles = async () => {
    const { data } = await supabase.from('career_roles').select('id, title');
    if (data) setCareerRoles(data);
  };

  const fetchUserRole = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    const { data } = await supabase
      .from('user_career_paths')
      .select('role_id, career_roles(id, title)')
      .eq('user_id', user.id)
      .order('selected_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.career_roles) {
      const role = data.career_roles as { id: string; title: string };
      setUserRole(role);
      setSelectedRoleId(role.id);
    } else {
      setIsLoading(false);
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

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.skills.some(s => s.toLowerCase().includes(query))
    );
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
            {filteredJobs.map((job, index) => (
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
                          <div>
                            <h3 className="text-lg font-semibold line-clamp-1">{job.title}</h3>
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

                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.skills.length - 4} more
                            </Badge>
                          )}
                        </div>

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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
