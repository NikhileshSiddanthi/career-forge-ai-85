import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Terminal, ArrowLeft, IndianRupee, TrendingUp, Clock,
  Code, Database, Palette, Briefcase, Play, BookOpen,
  CheckCircle, XCircle, Loader2, ChevronRight
} from 'lucide-react';

interface CareerRole {
  id: string;
  title: string;
  slug: string;
  category: 'engineering' | 'data' | 'design' | 'product';
  description: string;
  day_in_life: string;
  salary_min_inr: number;
  salary_max_inr: number;
  demand_level: string;
  growth_outlook: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface RoleSkill {
  skill_id: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  skills: Skill;
}

interface UserSkill {
  skill_id: string;
  proficiency: number;
}

const CATEGORY_CONFIG = {
  engineering: { icon: Code, color: 'text-primary', bgColor: 'bg-primary/20', label: 'Engineering' },
  data: { icon: Database, color: 'text-accent', bgColor: 'bg-accent/20', label: 'Data & Analytics' },
  design: { icon: Palette, color: 'text-pink-400', bgColor: 'bg-pink-400/20', label: 'Design' },
  product: { icon: Briefcase, color: 'text-amber-400', bgColor: 'bg-amber-400/20', label: 'Product' },
};

const IMPORTANCE_CONFIG = {
  critical: { label: 'Critical', color: 'bg-destructive text-destructive-foreground' },
  important: { label: 'Important', color: 'bg-amber-500 text-white' },
  nice_to_have: { label: 'Nice to Have', color: 'bg-secondary text-secondary-foreground' },
};

function formatSalary(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function RoleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [role, setRole] = useState<CareerRole | null>(null);
  const [roleSkills, setRoleSkills] = useState<RoleSkill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoleData();
  }, [slug, user]);

  const fetchRoleData = async () => {
    if (!slug) return;

    try {
      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('career_roles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (roleError) throw roleError;
      setRole(roleData);

      // Fetch role skills
      const { data: skillsData } = await supabase
        .from('role_skills')
        .select('skill_id, importance, skills(id, name, category)')
        .eq('role_id', roleData.id);

      setRoleSkills((skillsData as any) || []);

      // Fetch user skills if logged in
      if (user) {
        const { data: userSkillsData } = await supabase
          .from('user_skills')
          .select('skill_id, proficiency')
          .eq('user_id', user.id);

        setUserSkills(userSkillsData || []);
      }
    } catch (error) {
      console.error('Error fetching role:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillGap = () => {
    const userSkillIds = new Set(userSkills.map(s => s.skill_id));
    const matched = roleSkills.filter(rs => userSkillIds.has(rs.skill_id));
    const missing = roleSkills.filter(rs => !userSkillIds.has(rs.skill_id));
    const percentage = roleSkills.length > 0 
      ? Math.round((matched.length / roleSkills.length) * 100) 
      : 0;
    
    return { matched, missing, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Role not found</p>
        <Button onClick={() => navigate('/roles')}>Back to Roles</Button>
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[role.category];
  const CategoryIcon = categoryConfig.icon;
  const skillGap = getSkillGap();

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
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold gradient-text">SkillForge</span>
          </Link>

          <Button variant="ghost" onClick={() => navigate('/roles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${categoryConfig.bgColor} ${categoryConfig.color} mb-4`}>
            <CategoryIcon className="h-4 w-4" />
            {categoryConfig.label}
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">{role.title}</h1>
          <p className="text-lg text-muted-foreground">{role.description}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
            <div className="flex items-center gap-3 mb-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Salary Range</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatSalary(role.salary_min_inr)} - {formatSalary(role.salary_max_inr)}
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Market Demand</span>
            </div>
            <p className="text-xl font-bold text-foreground capitalize">
              {role.demand_level} Demand
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <span className="text-sm text-muted-foreground">Est. Learning Time</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {skillGap.percentage >= 80 ? '1-2 months' : skillGap.percentage >= 50 ? '3-6 months' : '6-12 months'}
            </p>
          </div>
        </div>

        {/* Skill Gap Analysis */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Skill Gap Analysis
          </h2>

          {roleSkills.length === 0 ? (
            <p className="text-muted-foreground">Skills data coming soon...</p>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Your Readiness</span>
                  <span className="text-sm font-bold text-primary">{skillGap.percentage}%</span>
                </div>
                <Progress value={skillGap.percentage} className="h-3" />
              </div>

              {skillGap.matched.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Skills You Have ({skillGap.matched.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillGap.matched.map(rs => (
                      <Badge key={rs.skill_id} variant="secondary" className="bg-primary/20 text-primary">
                        {rs.skills.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {skillGap.missing.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Skills to Learn ({skillGap.missing.length})
                  </h3>
                  <div className="space-y-2">
                    {skillGap.missing
                      .sort((a, b) => {
                        const order = { critical: 0, important: 1, nice_to_have: 2 };
                        return order[a.importance] - order[b.importance];
                      })
                      .map(rs => (
                        <div key={rs.skill_id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <span className="text-foreground">{rs.skills.name}</span>
                          <Badge className={IMPORTANCE_CONFIG[rs.importance].color}>
                            {IMPORTANCE_CONFIG[rs.importance].label}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Day in the Life */}
        {role.day_in_life && (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">A Day in the Life</h2>
            <p className="text-muted-foreground leading-relaxed">{role.day_in_life}</p>
          </div>
        )}

        {/* Growth Outlook */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Career Outlook</h2>
          <p className="text-muted-foreground leading-relaxed">{role.growth_outlook}</p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => navigate(`/simulation/${role.slug}`)}
          >
            <Play className="h-5 w-5 mr-2" />
            Try This Role
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 terminal-border"
            onClick={() => navigate(`/learn/${role.slug}`)}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Start Learning Path
          </Button>
        </div>
      </main>
    </div>
  );
}
