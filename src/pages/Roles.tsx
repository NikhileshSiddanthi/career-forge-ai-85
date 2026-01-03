import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, Search, Filter, TrendingUp, IndianRupee, 
  Code, Database, Palette, Briefcase, ChevronRight, 
  Loader2, Play, BarChart3, LogOut, Home
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CareerRole {
  id: string;
  title: string;
  slug: string;
  category: 'engineering' | 'data' | 'design' | 'product';
  description: string;
  day_in_life: string | null;
  salary_min_inr: number | null;
  salary_max_inr: number | null;
  demand_level: string | null;
  growth_outlook: string | null;
  matchScore?: number;
}
interface QuizResponse {
  interest_areas: string[];
}

const CATEGORY_CONFIG = {
  engineering: { icon: Code, color: 'text-primary', bgColor: 'bg-primary/20', label: 'Engineering' },
  data: { icon: Database, color: 'text-accent', bgColor: 'bg-accent/20', label: 'Data & Analytics' },
  design: { icon: Palette, color: 'text-pink-400', bgColor: 'bg-pink-400/20', label: 'Design' },
  product: { icon: Briefcase, color: 'text-amber-400', bgColor: 'bg-amber-400/20', label: 'Product' },
};

const DEMAND_CONFIG = {
  high: { color: 'text-primary', label: '🔥 High Demand' },
  medium: { color: 'text-amber-400', label: '📈 Growing' },
  low: { color: 'text-muted-foreground', label: '📊 Stable' },
};

function formatSalary(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function Roles() {
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<CareerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'salary' | 'demand'>('match');
  const [quizResponse, setQuizResponse] = useState<QuizResponse | null>(null);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRolesAndQuiz();
  }, [user]);

  const fetchRolesAndQuiz = async () => {
    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('career_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch user's quiz response for matching
      let quiz: QuizResponse | null = null;
      if (user) {
        const { data: quizData } = await supabase
          .from('quiz_responses')
          .select('interest_areas')
          .eq('user_id', user.id)
          .maybeSingle();
        
        quiz = quizData;
        setQuizResponse(quizData);
      }

      // Calculate match scores
      const rolesWithScores = (rolesData || []).map(role => ({
        ...role,
        matchScore: calculateMatchScore(role, quiz),
      }));

      setRoles(rolesWithScores);
      setFilteredRoles(rolesWithScores);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = (role: CareerRole, quiz: QuizResponse | null): number | undefined => {
    // Only show match scores if user has completed their profile quiz
    if (!quiz?.interest_areas?.length) return undefined;
    
    let score = 50;
    
    // Interest area match
    if (quiz.interest_areas.includes(role.category)) {
      score += 35;
    }
    
    // Add some variance based on role id (deterministic, not random)
    const hash = role.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    score += hash % 15;
    
    return Math.min(Math.round(score), 99);
  };

  useEffect(() => {
    let result = [...roles];

    // Filter by search
    if (searchQuery) {
      result = result.filter(role =>
        role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter(role => role.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return (b.matchScore || 0) - (a.matchScore || 0);
        case 'salary':
          return b.salary_max_inr - a.salary_max_inr;
        case 'demand':
          const demandOrder = { high: 3, medium: 2, low: 1 };
          return demandOrder[b.demand_level] - demandOrder[a.demand_level];
        default:
          return 0;
      }
    });

    setFilteredRoles(result);
  }, [roles, searchQuery, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-mono text-sm">Loading career paths...</p>
        </div>
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold gradient-text">SkillForge</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            {user && (
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Explore <span className="gradient-text">Career Roles</span>
          </h1>
          <p className="text-muted-foreground">
            {quizResponse ? 'Roles matched to your profile' : 'Complete your profile quiz to see personalized match scores'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? '' : 'terminal-border'}
            >
              All
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className={selectedCategory === key ? '' : 'terminal-border'}
              >
                <config.icon className="h-4 w-4 mr-1" />
                {config.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant={sortBy === 'match' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('match')}
              className={sortBy === 'match' ? '' : 'terminal-border'}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Match
            </Button>
            <Button
              variant={sortBy === 'salary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('salary')}
              className={sortBy === 'salary' ? '' : 'terminal-border'}
            >
              <IndianRupee className="h-4 w-4 mr-1" />
              Salary
            </Button>
            <Button
              variant={sortBy === 'demand' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('demand')}
              className={sortBy === 'demand' ? '' : 'terminal-border'}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Demand
            </Button>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role, index) => {
            const categoryConfig = CATEGORY_CONFIG[role.category];
            const demandConfig = DEMAND_CONFIG[role.demand_level];
            const CategoryIcon = categoryConfig.icon;

            return (
              <div
                key={role.id}
                className="group bg-card/80 backdrop-blur-sm rounded-xl border border-border hover:border-primary transition-all duration-300 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Match Score Badge - only shown if user has quiz data */}
                {role.matchScore !== undefined && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      role.matchScore >= 80 ? 'bg-primary text-primary-foreground' :
                      role.matchScore >= 60 ? 'bg-accent text-accent-foreground' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {role.matchScore}% match
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Category Badge */}
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${categoryConfig.bgColor} ${categoryConfig.color} mb-3`}>
                    <CategoryIcon className="h-3 w-3" />
                    {categoryConfig.label}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {role.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {role.description}
                  </p>

                  {/* Salary Range */}
                  <div className="flex items-center gap-2 mb-3">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {formatSalary(role.salary_min_inr)} - {formatSalary(role.salary_max_inr)}
                    </span>
                    <span className="text-xs text-muted-foreground">/year</span>
                  </div>

                  {/* Demand Level */}
                  <div className={`text-xs ${demandConfig.color} mb-4`}>
                    {demandConfig.label}
                  </div>

                  {/* Growth Outlook */}
                  <p className="text-xs text-muted-foreground mb-4 italic">
                    "{role.growth_outlook}"
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => navigate(`/role/${role.slug}`)}
                    >
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="terminal-border"
                      onClick={() => navigate(`/simulation/${role.slug}`)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No roles found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
