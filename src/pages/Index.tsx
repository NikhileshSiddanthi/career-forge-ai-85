import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Terminal, Zap, Code, Target, Users, Award, ChevronRight, Loader2, LogOut } from 'lucide-react';

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/onboarding');
    } else {
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-mono text-sm">Loading SkillForge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(hsl(142 70% 45% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 45% / 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 terminal-border">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold gradient-text">SkillForge</span>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground font-mono hidden sm:block">
                <span className="text-primary">$</span> logged in as {user.email?.split('@')[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="terminal-border hover:bg-primary/10">
                Login
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="px-6 lg:px-12 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 terminal-border text-sm font-mono">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary">System Online</span>
              <span className="text-muted-foreground">• AI-Powered Career Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
              <span className="text-foreground">Forge Your</span>
              <br />
              <span className="gradient-text text-glow-green">Tech Career</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover your ideal role, master in-demand skills with AI guidance, 
              and prepare for top tech companies—all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg box-glow-green"
              >
                {user ? 'Continue Journey' : 'Start Your Journey'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="terminal-border hover:bg-secondary px-8 py-6 text-lg"
              >
                Explore Roles
              </Button>
            </div>

            <div className="pt-12 font-mono text-sm text-muted-foreground">
              <span className="text-primary">$</span> forge --init career --mode=accelerated
              <span className="cursor-blink" />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 lg:px-12 py-20 bg-gradient-to-b from-transparent to-card/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Three Steps to <span className="gradient-text">Career Success</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A structured pathway designed by industry experts and powered by AI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  step: '01',
                  title: 'Discover Your Role',
                  description: 'Take our interactive quiz to find tech roles that match your skills, interests, and career goals.',
                  features: ['Skill Assessment', 'Role Matching', 'Salary Insights'],
                  color: 'primary',
                },
                {
                  icon: Code,
                  step: '02',
                  title: 'Master Skills',
                  description: 'Learn through hands-on projects in our cloud IDE with AI Sensei guiding you every step.',
                  features: ['Cloud IDE', 'AI Mentor', 'Real Projects'],
                  color: 'accent',
                },
                {
                  icon: Award,
                  step: '03',
                  title: 'Get Job Ready',
                  description: 'Complete capstone projects, ace AI mock interviews, and earn verifiable certifications.',
                  features: ['Mock Interviews', 'Certifications', 'Portfolio'],
                  color: 'primary',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative p-8 rounded-xl bg-card/50 terminal-border hover:bg-card/80 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="absolute -top-4 -right-4 text-6xl font-bold text-primary/10 font-mono">
                    {feature.step}
                  </div>
                  
                  <div className={`inline-flex p-3 rounded-lg bg-${feature.color}/10 mb-6`}>
                    <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>

                  <div className="space-y-2">
                    {feature.features.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 lg:px-12 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { value: '4+', label: 'Career Tracks' },
                { value: '50+', label: 'Tech Roles' },
                { value: 'AI', label: 'Powered Learning' },
                { value: '∞', label: 'Possibilities' },
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="text-4xl lg:text-5xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-mono">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 lg:px-12 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 terminal-border text-center">
              <div className="absolute inset-0 rounded-2xl bg-grid-pattern opacity-10" />
              
              <div className="relative z-10 space-y-6">
                <div className="inline-flex p-4 rounded-full bg-primary/20">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Ready to <span className="gradient-text">Transform</span> Your Career?
                </h2>
                
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Join thousands of learners who have discovered their path 
                  and landed roles at top tech companies.
                </p>

                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-12 py-6 text-lg box-glow-green"
                >
                  Begin Your Journey
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 lg:px-12 py-12 border-t border-border">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">SkillForge</span>
              <span className="text-muted-foreground text-sm">© 2025</span>
            </div>
            
            <div className="font-mono text-sm text-muted-foreground">
              <span className="text-primary">$</span> crafted with <span className="text-destructive">♥</span> for future tech leaders
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
