import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Terminal, ArrowLeft, Play, CheckCircle, XCircle,
  Loader2, RotateCcw, Trophy, AlertTriangle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimulationStep {
  id: string;
  scenario: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

interface CareerRole {
  id: string;
  title: string;
  slug: string;
  category: string;
}

// Hardcoded simulations for MVP (will be moved to DB later)
const SIMULATIONS: Record<string, { title: string; intro: string; steps: SimulationStep[] }> = {
  'devops-engineer': {
    title: 'Production Incident: Service Down at 2 AM',
    intro: 'You get paged at 2 AM. The main API service is returning 502 errors. Customers are affected. What do you do?',
    steps: [
      {
        id: '1',
        scenario: 'You just received an alert. The monitoring dashboard shows a spike in 502 errors. What\'s your first action?',
        options: [
          { id: 'a', text: 'Start debugging the code immediately', isCorrect: false, feedback: 'Jumping into code without understanding the scope can waste precious time. First, assess the situation.' },
          { id: 'b', text: 'Check monitoring dashboards for the scope of impact', isCorrect: true, feedback: 'Correct! Understanding the blast radius helps prioritize and communicate effectively.' },
          { id: 'c', text: 'Roll back the last deployment', isCorrect: false, feedback: 'Without knowing if a deployment caused this, a rollback might not help and could cause more issues.' },
          { id: 'd', text: 'Restart all servers', isCorrect: false, feedback: 'Restarting without diagnosis is risky and might not solve the issue.' },
        ],
      },
      {
        id: '2',
        scenario: 'The dashboard shows all API pods are running, but logs reveal connection timeouts to the database. What next?',
        options: [
          { id: 'a', text: 'Scale up the API pods', isCorrect: false, feedback: 'Adding more pods won\'t help if the database is the bottleneck.' },
          { id: 'b', text: 'Check database CPU and connection pool metrics', isCorrect: true, feedback: 'Correct! The database connection issue needs to be diagnosed. Check metrics first.' },
          { id: 'c', text: 'Clear the Redis cache', isCorrect: false, feedback: 'This might cause a cache stampede and make things worse.' },
          { id: 'd', text: 'Update the connection timeout settings', isCorrect: false, feedback: 'This is a band-aid, not a fix. Find the root cause first.' },
        ],
      },
      {
        id: '3',
        scenario: 'Database CPU is at 100%. Slow query logs show a new query pattern eating resources. How do you mitigate?',
        options: [
          { id: 'a', text: 'Kill the slow queries and notify the on-call developer', isCorrect: true, feedback: 'Correct! Immediate mitigation + bringing in the right people to fix the root cause.' },
          { id: 'b', text: 'Upgrade the database instance immediately', isCorrect: false, feedback: 'This takes too long and might not even help if it\'s a query problem.' },
          { id: 'c', text: 'Wait and see if it resolves itself', isCorrect: false, feedback: 'In a production incident, waiting is not an option when customers are affected.' },
          { id: 'd', text: 'Disable the feature causing the queries', isCorrect: false, feedback: 'Without knowing which feature, you might break more things.' },
        ],
      },
    ],
  },
  'data-analyst': {
    title: 'Urgent Report: Stakeholder Needs Insights by EOD',
    intro: 'The VP of Sales needs a report on Q4 performance by end of day. You have 4 hours. Go!',
    steps: [
      {
        id: '1',
        scenario: 'You receive the request at 2 PM. The VP wants "Q4 sales performance analysis". What\'s your first move?',
        options: [
          { id: 'a', text: 'Start pulling all Q4 data immediately', isCorrect: false, feedback: 'Without clarity on what\'s needed, you might waste time on irrelevant analysis.' },
          { id: 'b', text: 'Ask clarifying questions about specific metrics and comparisons needed', isCorrect: true, feedback: 'Correct! Understanding requirements upfront saves time and ensures relevance.' },
          { id: 'c', text: 'Send last month\'s report with updated numbers', isCorrect: false, feedback: 'This might not address what the VP actually needs.' },
          { id: 'd', text: 'Tell them you need more time', isCorrect: false, feedback: 'Pushing back without attempting first isn\'t collaborative.' },
        ],
      },
      {
        id: '2',
        scenario: 'The VP clarifies: they want YoY comparison, top performers, and concerning trends. You find data inconsistencies. What do you do?',
        options: [
          { id: 'a', text: 'Clean the data perfectly before any analysis', isCorrect: false, feedback: 'With limited time, perfection is the enemy of done.' },
          { id: 'b', text: 'Ignore the inconsistencies and proceed', isCorrect: false, feedback: 'This could lead to wrong conclusions and damage trust.' },
          { id: 'c', text: 'Document issues, make reasonable assumptions, and note caveats in your report', isCorrect: true, feedback: 'Correct! Transparency about data quality while still delivering is professional.' },
          { id: 'd', text: 'Escalate to the data engineering team immediately', isCorrect: false, feedback: 'This won\'t help you deliver today\'s report.' },
        ],
      },
      {
        id: '3',
        scenario: 'Your analysis reveals a concerning 15% drop in enterprise deals. How do you present this?',
        options: [
          { id: 'a', text: 'Bury it in the appendix to avoid bad news', isCorrect: false, feedback: 'Hiding bad news destroys credibility when discovered.' },
          { id: 'b', text: 'Lead with the bad news prominently', isCorrect: false, feedback: 'Leading with only negatives can set the wrong tone.' },
          { id: 'c', text: 'Present findings objectively with context, potential causes, and suggested next steps', isCorrect: true, feedback: 'Correct! Balanced presentation with actionable insights is most valuable.' },
          { id: 'd', text: 'Wait to tell them in person tomorrow', isCorrect: false, feedback: 'They need this today, and the insight is important now.' },
        ],
      },
    ],
  },
  'product-designer': {
    title: 'Design Challenge: Client Changed Requirements',
    intro: 'You\'ve spent 2 weeks on a dashboard design. The client now wants a completely different direction. Handle it!',
    steps: [
      {
        id: '1',
        scenario: 'The client says "We want it more like Notion". Your current design is data-heavy grids. First reaction?',
        options: [
          { id: 'a', text: 'Explain why the current design is better', isCorrect: false, feedback: 'Being defensive doesn\'t help understand the client\'s actual needs.' },
          { id: 'b', text: 'Ask what specifically about Notion resonates with them', isCorrect: true, feedback: 'Correct! Understanding the why behind feedback leads to better solutions.' },
          { id: 'c', text: 'Start copying Notion\'s interface immediately', isCorrect: false, feedback: 'Copying without understanding context won\'t serve the client\'s actual needs.' },
          { id: 'd', text: 'Suggest they hire a different designer', isCorrect: false, feedback: 'This is unprofessional and avoids problem-solving.' },
        ],
      },
      {
        id: '2',
        scenario: 'They want "flexibility and simplicity". Your data-heavy dashboard serves power users. How do you reconcile?',
        options: [
          { id: 'a', text: 'Choose one user type and optimize for them only', isCorrect: false, feedback: 'Ignoring a user segment usually backfires.' },
          { id: 'b', text: 'Propose progressive disclosure: simple default view with power features accessible', isCorrect: true, feedback: 'Correct! Layered complexity serves both user types.' },
          { id: 'c', text: 'Build two completely separate interfaces', isCorrect: false, feedback: 'This doubles the work and creates maintenance nightmares.' },
          { id: 'd', text: 'Tell them their requirements are contradictory', isCorrect: false, feedback: 'Good designers find creative solutions to constraints.' },
        ],
      },
      {
        id: '3',
        scenario: 'Timeline is unchanged but scope increased. How do you handle this with stakeholders?',
        options: [
          { id: 'a', text: 'Agree and work overtime to deliver everything', isCorrect: false, feedback: 'Unsustainable and leads to burnout and quality issues.' },
          { id: 'b', text: 'Refuse the new scope entirely', isCorrect: false, feedback: 'Inflexibility doesn\'t build good relationships.' },
          { id: 'c', text: 'Propose phased delivery: core experience first, enhancements in v2', isCorrect: true, feedback: 'Correct! Scope management through phasing keeps quality high and stakeholders aligned.' },
          { id: 'd', text: 'Reduce quality to fit everything in', isCorrect: false, feedback: 'Compromising quality hurts your reputation and the product.' },
        ],
      },
    ],
  },
  'product-manager': {
    title: 'Scope Creep: Feature Negotiation',
    intro: 'Your sprint is planned. Engineering capacity is tight. Three stakeholders want to add "just one small thing" each.',
    steps: [
      {
        id: '1',
        scenario: 'The Sales VP asks to add a "quick" CRM integration. The team is already at capacity. Your response?',
        options: [
          { id: 'a', text: 'Say yes to keep the relationship good', isCorrect: false, feedback: 'Overcommitting hurts the team and often leads to missed deadlines.' },
          { id: 'b', text: 'Flat out refuse', isCorrect: false, feedback: 'No without context or alternatives damages relationships.' },
          { id: 'c', text: 'Understand the urgency and business impact, then propose trade-offs', isCorrect: true, feedback: 'Correct! Good PMs gather context and present options, not just no.' },
          { id: 'd', text: 'Forward the request to engineering to decide', isCorrect: false, feedback: 'PMs own prioritization, not engineering.' },
        ],
      },
      {
        id: '2',
        scenario: 'The integration could unlock $500K in pipeline, but would delay the current roadmap by 2 weeks. How do you evaluate?',
        options: [
          { id: 'a', text: 'Revenue always wins, push everything else', isCorrect: false, feedback: 'Short-term revenue thinking can destroy long-term strategy.' },
          { id: 'b', text: 'Analyze impact on existing commitments and quantify trade-offs for leadership decision', isCorrect: true, feedback: 'Correct! Bringing clear trade-offs to decision-makers is a PM superpower.' },
          { id: 'c', text: 'Let the team work overtime to do both', isCorrect: false, feedback: 'This leads to burnout and is not sustainable.' },
          { id: 'd', text: 'Delay the decision until next quarter', isCorrect: false, feedback: 'The opportunity might be gone by then.' },
        ],
      },
      {
        id: '3',
        scenario: 'Leadership approves the integration but wants minimal delay. How do you descope smartly?',
        options: [
          { id: 'a', text: 'Remove whatever engineering says is easiest', isCorrect: false, feedback: 'Technical ease doesn\'t equal business value.' },
          { id: 'b', text: 'Identify lowest-impact features through usage data and stakeholder alignment', isCorrect: true, feedback: 'Correct! Data-driven prioritization with stakeholder buy-in is the PM way.' },
          { id: 'c', text: 'Remove all nice-to-haves regardless of user feedback', isCorrect: false, feedback: 'Some nice-to-haves might be critical for adoption.' },
          { id: 'd', text: 'Ask stakeholders to vote on what to cut', isCorrect: false, feedback: 'Design by committee rarely leads to good outcomes.' },
        ],
      },
    ],
  },
};

// Default simulation for roles without specific scenarios
const DEFAULT_SIMULATION = {
  title: 'Role Exploration Scenario',
  intro: 'Experience a typical challenge in this role and test your decision-making skills.',
  steps: [
    {
      id: '1',
      scenario: 'You\'ve just joined the team and are given your first project. What\'s your approach?',
      options: [
        { id: 'a', text: 'Dive right in and start working', isCorrect: false, feedback: 'Taking time to understand context first is usually more effective.' },
        { id: 'b', text: 'Spend time understanding the codebase, team dynamics, and project history', isCorrect: true, feedback: 'Correct! Context helps you make better decisions and avoid pitfalls.' },
        { id: 'c', text: 'Ask someone else to do it while you observe', isCorrect: false, feedback: 'You learn best by doing, not just watching.' },
        { id: 'd', text: 'Immediately suggest improvements to how things are done', isCorrect: false, feedback: 'Suggestions without context often miss important nuances.' },
      ],
    },
  ],
};

export default function Simulation() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = useState<CareerRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const simulation = slug && SIMULATIONS[slug] ? SIMULATIONS[slug] : DEFAULT_SIMULATION;
  const currentStepData = simulation.steps[currentStep];
  const progress = ((currentStep + 1) / simulation.steps.length) * 100;

  useEffect(() => {
    fetchRole();
  }, [slug]);

  const fetchRole = async () => {
    if (!slug) return;

    try {
      const { data } = await supabase
        .from('career_roles')
        .select('id, title, slug, category')
        .eq('slug', slug)
        .maybeSingle();

      setRole(data);
    } catch (error) {
      console.error('Error fetching role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (showFeedback) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;

    const option = currentStepData.options.find(o => o.id === selectedOption);
    if (option?.isCorrect) {
      setScore(score + 1);
    }
    setShowFeedback(true);
  };

  const handleNext = async () => {
    if (currentStep < simulation.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      // Simulation complete
      setCompleted(true);

      // Save progress if logged in
      if (user && role) {
        try {
          const { data: simData } = await supabase
            .from('role_simulations')
            .select('id')
            .eq('role_id', role.id)
            .maybeSingle();

          if (simData) {
            await supabase
              .from('user_simulation_progress')
              .upsert({
                user_id: user.id,
                simulation_id: simData.id,
                completed: true,
                score: score + (currentStepData.options.find(o => o.id === selectedOption)?.isCorrect ? 1 : 0),
              });
          }
        } catch (error) {
          console.error('Error saving progress:', error);
        }
      }
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentStep(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setCompleted(false);
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
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        {!started && !completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="inline-flex p-4 rounded-full bg-primary/20 mb-6">
              <Play className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              {role?.title || 'Role'} Simulation
            </h1>
            <h2 className="text-xl text-primary mb-6">{simulation.title}</h2>

            <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              {simulation.intro}
            </p>

            <div className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                ~5 minutes
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {simulation.steps.length} scenarios
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => setStarted(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Simulation
            </Button>
          </motion.div>
        )}

        {started && !completed && (
          <div>
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Scenario {currentStep + 1} of {simulation.steps.length}</span>
                <span>Score: {score}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border"
              >
                <h2 className="text-xl font-bold text-foreground mb-6">
                  {currentStepData.scenario}
                </h2>

                <div className="space-y-3 mb-6">
                  {currentStepData.options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const showCorrect = showFeedback && option.isCorrect;
                    const showWrong = showFeedback && isSelected && !option.isCorrect;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        disabled={showFeedback}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          showCorrect
                            ? 'bg-primary/20 border-primary'
                            : showWrong
                            ? 'bg-destructive/20 border-destructive'
                            : isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'border-border hover:border-primary bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                            showCorrect ? 'bg-primary text-primary-foreground' :
                            showWrong ? 'bg-destructive text-destructive-foreground' :
                            isSelected ? 'bg-primary text-primary-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {showCorrect ? <CheckCircle className="h-4 w-4" /> :
                             showWrong ? <XCircle className="h-4 w-4" /> :
                             option.id.toUpperCase()}
                          </div>
                          <span className="text-foreground flex-1">{option.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-secondary/50 border border-border mb-6"
                  >
                    <p className="text-foreground">
                      {currentStepData.options.find(o => o.id === selectedOption)?.feedback}
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-end">
                  {!showFeedback ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedOption}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {currentStep < simulation.steps.length - 1 ? 'Next Scenario' : 'See Results'}
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {completed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex p-4 rounded-full bg-primary/20 mb-6">
              <Trophy className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              Simulation Complete!
            </h1>

            <p className="text-xl text-primary mb-6">
              You scored {score + (currentStepData.options.find(o => o.id === selectedOption)?.isCorrect ? 1 : 0)} out of {simulation.steps.length}
            </p>

            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              {score >= simulation.steps.length * 0.7
                ? 'Great job! You show strong decision-making skills for this role.'
                : 'Good effort! This simulation highlights areas where you can grow.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={handleRestart}
                className="terminal-border"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => navigate(`/role/${slug}`)}
                className="bg-primary hover:bg-primary/90"
              >
                View Role Details
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
