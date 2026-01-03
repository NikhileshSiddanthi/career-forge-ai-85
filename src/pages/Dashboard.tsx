import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Terminal, LogOut, BookOpen, GraduationCap, Briefcase,
  ChevronRight, Loader2, Target, Award, Building2, Play
} from 'lucide-react';

interface UserCareerPath {
  id: string;
  role_id: string;
  phase: string;
  career_roles: {
    id: string;
    title: string;
    slug: string;
    category: string;
  };
}

interface LearningProgress {
  learning_path_id: string;
  completed_at: string | null;
  learning_paths: {
    title: string;
    estimated_hours: number;
    role_id: string;
  };
}

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  learning_paths: {
    title: string;
    career_roles: {
      title: string;
      slug: string;
    };
  };
}

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [careerPaths, setCareerPaths] = useState<UserCareerPath[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Fetch user's selected career paths
      const { data: pathsData } = await supabase
        .from('user_career_paths')
        .select(`
          id, role_id, phase,
          career_roles (id, title, slug, category)
        `)
        .eq('user_id', user.id);
      
      setCareerPaths((pathsData as any) || []);

      // Fetch learning progress
      const { data: progressData } = await supabase
        .from('user_learning_progress')
        .select(`
          learning_path_id, completed_at,
          learning_paths (title, estimated_hours, role_id)
        `)
        .eq('user_id', user.id);
      
      setLearningProgress((progressData as any) || []);

      // Fetch certificates
      const { data: certsData } = await supabase
        .from('certificates')
        .select(`
          id, certificate_number, issued_at,
          learning_paths (title, career_roles (title, slug))
        `)
        .eq('user_id', user.id);
      
      setCertificates((certsData as any) || []);

      // Count completed lessons
      const { count: completedCount } = await supabase
        .from('user_completed_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setCompletedLessons(completedCount || 0);

      // Count total lessons in user's learning paths
      if (progressData && progressData.length > 0) {
        const pathIds = progressData.map((p: any) => p.learning_path_id);
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id')
          .in('learning_path_id', pathIds);
        
        if (coursesData) {
          const courseIds = coursesData.map(c => c.id);
          const { count: lessonsCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .in('course_id', courseIds);
          
          setTotalLessons(lessonsCount || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(hsl(142 70% 45% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 45% / 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold gradient-text">SkillForge</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/roles')}>
              Explore Roles
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, <span className="gradient-text">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-muted-foreground">Your journey to tech mastery continues</p>
        </div>

        {/* Journey Progress */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Career Paths</p>
                <p className="text-2xl font-bold text-foreground">{careerPaths.length}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Roles you're pursuing</p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/20">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
                <p className="text-2xl font-bold text-foreground">{completedLessons}/{totalLessons}</p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold text-foreground">{certificates.length}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Industry-ready credentials</p>
          </div>
        </div>

        {/* Career Paths */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Career Paths
            </h2>
            <Button variant="outline" size="sm" className="terminal-border" onClick={() => navigate('/roles')}>
              Add Path
            </Button>
          </div>

          {careerPaths.length === 0 ? (
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No career path selected</h3>
              <p className="text-muted-foreground mb-4">Explore roles and select your dream career to start learning</p>
              <Button onClick={() => navigate('/roles')}>
                Explore Roles
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {careerPaths.map((path) => (
                <div key={path.id} className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-foreground">{path.career_roles.title}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {path.phase === 'learning' ? 'Learning' : path.phase === 'certified' ? 'Certified' : path.phase === 'interview_prep' ? 'Interview Prep' : 'Exploring'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {path.phase === 'exploration' && (
                        <Button size="sm" onClick={() => navigate(`/learn/${path.career_roles.slug}`)}>
                          <BookOpen className="h-4 w-4 mr-1" />
                          Start Learning
                        </Button>
                      )}
                      {path.phase === 'learning' && (
                        <Button size="sm" onClick={() => navigate(`/learn/${path.career_roles.slug}`)}>
                          <Play className="h-4 w-4 mr-1" />
                          Continue
                        </Button>
                      )}
                      {path.phase === 'certified' && (
                        <Button size="sm" onClick={() => navigate(`/interview-prep/${path.career_roles.slug}`)}>
                          <Building2 className="h-4 w-4 mr-1" />
                          Interview Prep
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Certificates */}
        {certificates.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-amber-500" />
              Your Certificates
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-gradient-to-br from-amber-500/20 to-primary/20 rounded-xl p-6 border border-amber-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Award className="h-8 w-8 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-foreground">{cert.learning_paths.title}</h3>
                      <p className="text-sm text-muted-foreground">#{cert.certificate_number}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-6 terminal-border flex flex-col items-start gap-2"
              onClick={() => navigate('/roles')}
            >
              <Target className="h-6 w-6 text-primary" />
              <span className="font-semibold">Explore Roles</span>
              <span className="text-xs text-muted-foreground text-left">Discover tech careers that match your interests</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-6 terminal-border flex flex-col items-start gap-2"
              onClick={() => navigate('/ai-sensei')}
            >
              <BookOpen className="h-6 w-6 text-accent" />
              <span className="font-semibold">Ask AI Sensei</span>
              <span className="text-xs text-muted-foreground text-left">Get personalized career guidance</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-6 terminal-border flex flex-col items-start gap-2"
              onClick={() => navigate('/interview-prep')}
            >
              <Briefcase className="h-6 w-6 text-amber-500" />
              <span className="font-semibold">Interview Prep</span>
              <span className="text-xs text-muted-foreground text-left">Practice for top tech companies</span>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
