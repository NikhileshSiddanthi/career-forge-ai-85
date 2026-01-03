import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Terminal, ArrowLeft, Building2, CheckCircle, Circle,
  Loader2, ChevronRight, Send, Bot, User, Clock,
  Lightbulb, Target
} from 'lucide-react';
import { streamAISensei } from '@/lib/api/ai-sensei';
import { toast } from 'sonner';

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function InterviewPrep() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<CareerRole | null>(null);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [currentRound, setCurrentRound] = useState<InterviewRound | null>(null);
  const [completedRounds, setCompletedRounds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // AI Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [slug]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchData = async () => {
    try {
      // Get companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      setCompanies(companiesData || []);

      // If slug provided, get role
      if (slug) {
        const { data: roleData } = await supabase
          .from('career_roles')
          .select('id, title, slug')
          .eq('slug', slug)
          .single();
        
        setRole(roleData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = async (company: Company) => {
    setSelectedCompany(company);
    setChatMessages([]);
    setCurrentRound(null);
    setCompletedRounds(new Set());

    if (!role) {
      // If no role, show company info
      return;
    }

    // Fetch interview rounds for this company + role
    const { data: roundsData } = await supabase
      .from('interview_rounds')
      .select('*')
      .eq('company_id', company.id)
      .eq('role_id', role.id)
      .order('round_number');

    setRounds(roundsData || []);
    
    if (roundsData && roundsData.length > 0) {
      setCurrentRound(roundsData[0]);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiLoading(true);

    let assistantContent = '';
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setChatMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    await streamAISensei({
      messages: [...chatMessages, userMessage],
      context: {
        companyName: selectedCompany?.name,
        roleTitle: role?.title,
        roundName: currentRound?.round_name,
      },
      type: 'interview_prep',
      onDelta: updateAssistant,
      onDone: () => setIsAiLoading(false),
      onError: (error) => {
        toast.error(error.message);
        setIsAiLoading(false);
      },
    });
  };

  const markRoundComplete = () => {
    if (!currentRound) return;
    
    setCompletedRounds(prev => new Set([...prev, currentRound.round_number]));
    
    // Move to next round
    const nextRound = rounds.find(r => r.round_number === currentRound.round_number + 1);
    if (nextRound) {
      setCurrentRound(nextRound);
    } else {
      toast.success('🎉 You completed all interview rounds!');
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

          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Interview <span className="gradient-text">Preparation</span>
          </h1>
          <p className="text-muted-foreground">
            {role ? `Prepare for ${role.title} interviews at top companies` : 'Select a company to start practicing'}
          </p>
        </div>

        {!selectedCompany ? (
          /* Company Selection */
          <div className="grid md:grid-cols-3 gap-4">
            {companies.map((company) => (
              <button
                key={company.id}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border text-left hover:border-primary transition-colors"
                onClick={() => selectCompany(company)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-bold text-foreground">{company.name}</h3>
                    <p className="text-xs text-muted-foreground">{company.industry}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {company.description}
                </p>
                <Badge variant={company.interview_difficulty === 'hard' ? 'destructive' : 'secondary'}>
                  {company.interview_difficulty} difficulty
                </Badge>
              </button>
            ))}
          </div>
        ) : (
          /* Interview Prep View */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Rounds Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl terminal-border">
                <div className="p-4 border-b border-border">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    All Companies
                  </Button>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <h2 className="font-bold text-foreground">{selectedCompany.name}</h2>
                      {role && <p className="text-xs text-muted-foreground">{role.title}</p>}
                    </div>
                  </div>

                  {rounds.length > 0 ? (
                    <div className="space-y-2">
                      {rounds.map((round) => (
                        <button
                          key={round.id}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            currentRound?.id === round.id 
                              ? 'bg-primary/20 text-primary' 
                              : completedRounds.has(round.round_number)
                                ? 'text-muted-foreground'
                                : 'hover:bg-secondary'
                          }`}
                          onClick={() => setCurrentRound(round)}
                        >
                          {completedRounds.has(round.round_number) ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                          <div>
                            <p className="font-medium">Round {round.round_number}</p>
                            <p className="text-xs text-muted-foreground">{round.round_name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No interview rounds data yet. Ask AI Sensei about {selectedCompany.name} interviews!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {currentRound && (
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
                  <div className="flex items-center justify-between mb-4">
                    <Badge>Round {currentRound.round_number}</Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {currentRound.duration_minutes} mins
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-2">{currentRound.round_name}</h2>
                  <p className="text-muted-foreground mb-6">{currentRound.description}</p>

                  {currentRound.tips && (
                    <div className="bg-primary/10 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Pro Tips</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{currentRound.tips}</p>
                    </div>
                  )}

                  <Button onClick={markRoundComplete} disabled={completedRounds.has(currentRound.round_number)}>
                    {completedRounds.has(currentRound.round_number) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        Mark as Practiced
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* AI Chat */}
              <div className="bg-card/80 backdrop-blur-sm rounded-xl terminal-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">AI Interview Coach</span>
                </div>

                <ScrollArea className="h-80 p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <p>👋 Ready to practice for {selectedCompany.name}?</p>
                      <p className="mt-2">Ask me interview questions, behavioral scenarios, or tips!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          {msg.role === 'assistant' && (
                            <Bot className="h-6 w-6 text-primary shrink-0" />
                          )}
                          <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary text-foreground'
                          }`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                          {msg.role === 'user' && (
                            <User className="h-6 w-6 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t border-border flex gap-2">
                  <Textarea
                    placeholder="Ask about interview questions, tips, or practice scenarios..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="resize-none h-10 min-h-0"
                    rows={1}
                  />
                  <Button onClick={sendMessage} disabled={isAiLoading || !chatInput.trim()}>
                    {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
