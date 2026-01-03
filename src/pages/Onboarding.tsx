import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Terminal, ChevronLeft, ChevronRight, Loader2, Check, Code, Database, Palette, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizData {
  experienceYears: number;
  educationLevel: string;
  preferredWorkStyle: string;
  interestAreas: string[];
  careerGoals: string[];
  existingRole: string;
  learningTimeWeekly: number;
  selectedSkills: string[];
}

const STEPS = [
  { id: 'experience', title: 'Experience', icon: Terminal },
  { id: 'interests', title: 'Interests', icon: Code },
  { id: 'skills', title: 'Skills', icon: Database },
  { id: 'goals', title: 'Goals', icon: Briefcase },
  { id: 'style', title: 'Work Style', icon: Palette },
];

const INTEREST_AREAS = [
  { id: 'engineering', label: 'Software Engineering', icon: Code, color: 'primary' },
  { id: 'data', label: 'Data & Analytics', icon: Database, color: 'accent' },
  { id: 'design', label: 'Design', icon: Palette, color: 'terminal-pink' },
  { id: 'product', label: 'Product Management', icon: Briefcase, color: 'terminal-amber' },
];

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'SQL', 'React', 'Node.js',
  'Django', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'Git', 'Figma', 'Tableau',
  'Machine Learning', 'Data Analysis', 'REST APIs', 'System Design', 'Agile/Scrum'
];

const CAREER_GOALS = [
  'Get my first tech job',
  'Switch to a new role',
  'Get promoted',
  'Learn new skills',
  'Start freelancing',
  'Build my own product',
  'Increase salary',
  'Work at a top company',
];

const WORK_STYLES = [
  { id: 'solo', label: 'Independent Work', desc: 'I prefer working alone on focused tasks' },
  { id: 'collaborative', label: 'Collaborative', desc: 'I thrive in team environments' },
  { id: 'hybrid', label: 'Hybrid', desc: 'A mix of solo and team work' },
  { id: 'leadership', label: 'Leadership', desc: 'I want to lead and mentor others' },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizData, setQuizData] = useState<QuizData>({
    experienceYears: 0,
    educationLevel: '',
    preferredWorkStyle: '',
    interestAreas: [],
    careerGoals: [],
    existingRole: '',
    learningTimeWeekly: 10,
    selectedSkills: [],
  });

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Save quiz responses (upsert to handle existing records)
      const { error: quizError } = await supabase
        .from('quiz_responses')
        .upsert({
          user_id: user.id,
          experience_years: quizData.experienceYears,
          education_level: quizData.educationLevel,
          preferred_work_style: quizData.preferredWorkStyle,
          interest_areas: quizData.interestAreas,
          career_goals: quizData.careerGoals,
          existing_role: quizData.existingRole,
          learning_time_weekly: quizData.learningTimeWeekly,
        }, { onConflict: 'user_id' });

      if (quizError) throw quizError;

      // Get skill IDs and save user skills
      if (quizData.selectedSkills.length > 0) {
        const { data: skills } = await supabase
          .from('skills')
          .select('id, name')
          .in('name', quizData.selectedSkills);

        if (skills && skills.length > 0) {
          const userSkills = skills.map(skill => ({
            user_id: user.id,
            skill_id: skill.id,
            proficiency: 3, // Default middle proficiency
          }));

          await supabase
            .from('user_skills')
            .upsert(userSkills, { onConflict: 'user_id,skill_id' });
        }
      }

      // Update profile as onboarding completed
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      toast({
        title: 'Profile Complete!',
        description: 'Welcome to SkillForge! Explore roles to start your journey.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your responses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(hsl(142 70% 45% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 45% / 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Terminal className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold gradient-text">SkillForge</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Let's discover your path</h1>
          <p className="text-muted-foreground font-mono text-sm">
            <span className="text-primary">$</span> analyzing career potential...
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  i <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${
                    i < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : i === currentStep
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-secondary'
                  }`}
                >
                  {i < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Tell us about your experience</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Years of experience in tech
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        {[0, 1, 2, 3, 5, 7, 10].map(years => (
                          <button
                            key={years}
                            onClick={() => setQuizData({ ...quizData, experienceYears: years })}
                            className={`px-4 py-2 rounded-lg border transition-all ${
                              quizData.experienceYears === years
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:border-primary bg-secondary'
                            }`}
                          >
                            {years === 0 ? 'Fresh' : years === 10 ? '10+' : `${years} yr${years > 1 ? 's' : ''}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Current/recent role
                      </label>
                      <input
                        type="text"
                        value={quizData.existingRole}
                        onChange={(e) => setQuizData({ ...quizData, existingRole: e.target.value })}
                        placeholder="e.g., Student, Junior Developer, Analyst..."
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Education level
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {['High School', 'Bachelor\'s', 'Master\'s', 'Self-taught'].map(level => (
                          <button
                            key={level}
                            onClick={() => setQuizData({ ...quizData, educationLevel: level })}
                            className={`px-4 py-3 rounded-lg border transition-all text-left ${
                              quizData.educationLevel === level
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:border-primary bg-secondary'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground">What areas interest you?</h2>
                  <p className="text-muted-foreground">Select all that apply</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {INTEREST_AREAS.map(area => (
                      <button
                        key={area.id}
                        onClick={() => setQuizData({
                          ...quizData,
                          interestAreas: toggleArrayItem(quizData.interestAreas, area.id)
                        })}
                        className={`p-6 rounded-xl border transition-all text-left ${
                          quizData.interestAreas.includes(area.id)
                            ? 'bg-primary/20 border-primary box-glow-green'
                            : 'border-border hover:border-primary bg-card'
                        }`}
                      >
                        <area.icon className={`h-8 w-8 mb-3 ${
                          quizData.interestAreas.includes(area.id) ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <h3 className="font-semibold text-foreground">{area.label}</h3>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground">What skills do you have?</h2>
                  <p className="text-muted-foreground">Select the technologies and skills you're familiar with</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map(skill => (
                      <button
                        key={skill}
                        onClick={() => setQuizData({
                          ...quizData,
                          selectedSkills: toggleArrayItem(quizData.selectedSkills, skill)
                        })}
                        className={`px-4 py-2 rounded-full border transition-all text-sm ${
                          quizData.selectedSkills.includes(skill)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:border-primary bg-secondary'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {quizData.selectedSkills.length} skills selected
                  </p>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground">What are your career goals?</h2>
                  <p className="text-muted-foreground">Select all that apply</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {CAREER_GOALS.map(goal => (
                      <button
                        key={goal}
                        onClick={() => setQuizData({
                          ...quizData,
                          careerGoals: toggleArrayItem(quizData.careerGoals, goal)
                        })}
                        className={`px-4 py-3 rounded-lg border transition-all text-left ${
                          quizData.careerGoals.includes(goal)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:border-primary bg-secondary'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Hours per week you can dedicate to learning
                    </label>
                    <div className="flex gap-3">
                      {[5, 10, 15, 20, 30].map(hours => (
                        <button
                          key={hours}
                          onClick={() => setQuizData({ ...quizData, learningTimeWeekly: hours })}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            quizData.learningTimeWeekly === hours
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:border-primary bg-secondary'
                          }`}
                        >
                          {hours}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground">How do you prefer to work?</h2>
                  
                  <div className="space-y-3">
                    {WORK_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setQuizData({ ...quizData, preferredWorkStyle: style.id })}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                          quizData.preferredWorkStyle === style.id
                            ? 'bg-primary/20 border-primary'
                            : 'border-border hover:border-primary bg-card'
                        }`}
                      >
                        <h3 className="font-semibold text-foreground">{style.label}</h3>
                        <p className="text-sm text-muted-foreground">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="terminal-border"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Discover My Roles
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
