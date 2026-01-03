import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, ArrowLeft, Loader2, Target, Briefcase,
  GraduationCap, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import CompanySelector from '@/components/interview/CompanySelector';
import RoundsList from '@/components/interview/RoundsList';
import InterviewSimulation from '@/components/interview/InterviewSimulation';

interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  interview_difficulty: string;
}

interface InterviewRound {
  id: string;
  round_number: number;
  round_name: string;
  description: string;
  duration_minutes: number;
  tips: string;
}

interface CareerRole {
  id: string;
  title: string;
  slug: string;
}

type ViewState = 'select-role' | 'select-company' | 'select-round' | 'simulation';

export default function InterviewPrep() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedRole, setSelectedRole] = useState<CareerRole | null>(null);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<InterviewRound | null>(null);
  const [completedRounds, setCompletedRounds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('select-role');

  useEffect(() => {
    fetchData();
  }, [slug, user]);

  const fetchData = async () => {
    try {
      // Get companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      setCompanies(companiesData || []);

      // Get all roles for role selection
      const { data: rolesData } = await supabase
        .from('career_roles')
        .select('id, title, slug')
        .order('title');
      
      setRoles(rolesData || []);

      // If slug provided in URL, set that role directly
      if (slug) {
        const role = rolesData?.find(r => r.slug === slug);
        if (role) {
          setSelectedRole(role);
          setViewState('select-company');
          setLoading(false);
          return;
        }
      }

      // Check if logged-in user has a selected career path
      if (user) {
        const { data: careerPath } = await supabase
          .from('user_career_paths')
          .select('role_id, career_roles(id, title, slug)')
          .eq('user_id', user.id)
          .order('selected_at', { ascending: false })
          .limit(1)
          .single();

        if (careerPath && careerPath.career_roles) {
          const roleData = careerPath.career_roles as unknown as CareerRole;
          setSelectedRole(roleData);
          setViewState('select-company');
          setLoading(false);
          return;
        }
      }

      // No role selected, show role selection
      setViewState('select-role');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role: CareerRole) => {
    setSelectedRole(role);
    setViewState('select-company');
  };

  const selectCompany = async (company: Company) => {
    setSelectedCompany(company);
    setCompletedRounds(new Set());

    // Fetch rounds
    let query = supabase
      .from('interview_rounds')
      .select('*')
      .eq('company_id', company.id)
      .order('round_number');

    if (selectedRole) {
      query = query.eq('role_id', selectedRole.id);
    }

    const { data: roundsData } = await query;
    setRounds(roundsData || []);
    setViewState('select-round');

    // Load completed rounds if user is logged in
    if (user) {
      const { data: progressData } = await supabase
        .from('user_interview_progress')
        .select('current_round')
        .eq('user_id', user.id)
        .eq('company_id', company.id);

      if (progressData && progressData.length > 0) {
        const maxRound = Math.max(...progressData.map(p => p.current_round || 0));
        const completed = new Set<number>();
        for (let i = 1; i < maxRound; i++) {
          completed.add(i);
        }
        setCompletedRounds(completed);
      }
    }
  };

  const selectRound = (round: InterviewRound) => {
    setSelectedRound(round);
    setViewState('simulation');
  };

  const handleSimulationComplete = async (score: number, feedback: string) => {
    if (!selectedRound || !selectedCompany) return;

    setCompletedRounds(prev => new Set([...prev, selectedRound.round_number]));

    // Save progress if logged in
    if (user && selectedRole) {
      const nextRound = selectedRound.round_number + 1;
      
      await supabase
        .from('user_interview_progress')
        .upsert({
          user_id: user.id,
          company_id: selectedCompany.id,
          role_id: selectedRole.id,
          current_round: nextRound,
        }, {
          onConflict: 'user_id,company_id,role_id',
        });
    }

    toast.success(`Round completed with ${score}% score!`);
  };

  const exitSimulation = () => {
    setSelectedRound(null);
    setViewState('select-round');
  };

  const goBackToCompanies = () => {
    setSelectedCompany(null);
    setRounds([]);
    setViewState('select-company');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Link to="/roles">
              <Button variant="ghost" size="sm">
                <Briefcase className="h-4 w-4 mr-2" />
                Explore Roles
              </Button>
            </Link>
            {user ? (
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Target className="h-4 w-4" />
            <span>Interview Prep</span>
            {selectedCompany && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span>{selectedCompany.name}</span>
              </>
            )}
            {selectedRound && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span>{selectedRound.round_name}</span>
              </>
            )}
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Interview <span className="gradient-text">Simulation</span>
          </h1>
          <p className="text-muted-foreground">
            Practice real interview rounds with AI-powered evaluation and feedback
          </p>

        {/* Show current role if selected */}
          {selectedRole && viewState !== 'select-role' && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Preparing for:</span>
              <Badge variant="outline" className="text-primary border-primary">
                {selectedRole.title}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedRole(null);
                  setSelectedCompany(null);
                  setViewState('select-role');
                }}
                className="text-xs"
              >
                Change Role
              </Button>
            </div>
          )}
        </div>

        {/* Role Selection View */}
        {viewState === 'select-role' && (
          <div className="space-y-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border text-center mb-8">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What role are you preparing for?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select your target role to get role-specific interview questions and preparation
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => selectRole(role)}
                  className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border text-left hover:border-primary transition-all hover:scale-[1.02] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {role.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Practice interviews for this role
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content based on view state */}
        {viewState === 'select-company' && (
          <div className="space-y-6">
            {/* Info cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Real Interview Flow</h3>
                <p className="text-sm text-muted-foreground">
                  Experience actual interview rounds company-by-company
                </p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">AI Evaluation</h3>
                <p className="text-sm text-muted-foreground">
                  Get instant feedback on your answers with scoring
                </p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Sensei Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  AI coach available for hints and guidance during practice
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground">Select a Company</h2>
            <CompanySelector 
              companies={companies} 
              onSelect={selectCompany}
            />
          </div>
        )}

        {viewState === 'select-round' && selectedCompany && (
          <RoundsList
            company={selectedCompany}
            rounds={rounds}
            roleTitle={selectedRole?.title}
            completedRounds={completedRounds}
            onSelectRound={selectRound}
            onBack={goBackToCompanies}
          />
        )}

        {viewState === 'simulation' && selectedRound && selectedCompany && (
          <InterviewSimulation
            round={selectedRound}
            companyName={selectedCompany.name}
            roleTitle={selectedRole?.title}
            onComplete={handleSimulationComplete}
            onExit={exitSimulation}
          />
        )}
      </main>
    </div>
  );
}
