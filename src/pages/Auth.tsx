import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Terminal, Zap, Code, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password, fullName: isLogin ? undefined : fullName });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string; fullName?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Access Denied',
              description: 'Invalid email or password. Check your credentials.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Authentication Error',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Access Granted',
            description: 'Welcome back to SkillForge.',
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'User Exists',
              description: 'This email is already registered. Try logging in.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Registration Error',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account Created',
            description: 'Welcome to SkillForge. Your journey begins now.',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-mono text-sm">Initializing system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(hsl(142 70% 45% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 45% / 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
          <div className="max-w-md space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 terminal-border">
                <Terminal className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold gradient-text">SkillForge</h1>
            </div>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Your AI-powered career forge. Discover roles, master skills, and land your dream job.
            </p>

            <div className="space-y-4 pt-8">
              {[
                { icon: Zap, title: 'Role Discovery', desc: 'Find your perfect tech career path' },
                { icon: Code, title: 'Hands-on Learning', desc: 'Code in a real cloud IDE' },
                { icon: ArrowRight, title: 'Company Ready', desc: 'AI mock interviews & certifications' },
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-4 p-4 rounded-lg bg-card/50 terminal-border animate-fade-in"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <feature.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 font-mono text-sm text-muted-foreground">
              <span className="text-primary">$</span> forge --your-career
              <span className="cursor-blink" />
            </div>
          </div>
        </div>

        {/* Right side - auth form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                <Terminal className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold gradient-text">SkillForge</span>
              </div>

              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-foreground">
                  {isLogin ? 'Access Terminal' : 'Initialize Account'}
                </h2>
                <p className="text-muted-foreground font-mono text-sm">
                  <span className="text-primary">&gt;</span> {isLogin ? 'Enter credentials to continue' : 'Create your forge identity'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="bg-input border-border focus:border-primary focus:ring-primary"
                    />
                    {errors.fullName && (
                      <p className="text-xs text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="forge@example.com"
                    className="bg-input border-border focus:border-primary focus:ring-primary"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-input border-border focus:border-primary focus:ring-primary pr-10"
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Authenticating...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Login' : 'Create Account'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? (
                    <>
                      New to SkillForge? <span className="text-primary font-semibold">Create account</span>
                    </>
                  ) : (
                    <>
                      Already have an account? <span className="text-primary font-semibold">Login</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
              <span className="text-primary">$</span> encrypted connection established
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
