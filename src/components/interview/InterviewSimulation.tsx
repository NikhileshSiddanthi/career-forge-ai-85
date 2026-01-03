import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, Pause, SkipForward, Clock, CheckCircle, XCircle,
  Loader2, Lightbulb, MessageSquare, ChevronRight, Trophy,
  AlertCircle, Star, Bot, Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { streamAISensei } from '@/lib/api/ai-sensei';
import { toast } from 'sonner';

interface Question {
  id: string;
  question: string;
  question_type: string;
  difficulty: string;
  sample_answer: string;
}

interface Round {
  id: string;
  round_number: number;
  round_name: string;
  description: string;
  duration_minutes: number;
  tips: string;
}

interface SimulationProps {
  round: Round;
  companyName: string;
  roleTitle?: string;
  onComplete: (score: number, feedback: string) => void;
  onExit: () => void;
}

interface AnswerFeedback {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export default function InterviewSimulation({
  round,
  companyName,
  roleTitle,
  onComplete,
  onExit,
}: SimulationProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<Map<string, { answer: string; feedback?: AnswerFeedback }>>(new Map());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintContent, setHintContent] = useState('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [simulationState, setSimulationState] = useState<'ready' | 'active' | 'reviewing' | 'complete'>('ready');
  const [timeRemaining, setTimeRemaining] = useState(round.duration_minutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sensei chat
  const [senseiOpen, setSenseiOpen] = useState(false);
  const [senseiMessages, setSenseiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [senseiInput, setSenseiInput] = useState('');
  const [isSenseiLoading, setIsSenseiLoading] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    fetchQuestions();
  }, [round.id]);

  useEffect(() => {
    if (simulationState !== 'active' || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishSimulation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [simulationState, isPaused]);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('round_id', round.id)
      .order('difficulty');

    if (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startSimulation = () => {
    setSimulationState('active');
    setTimeRemaining(round.duration_minutes * 60);
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    setIsEvaluating(true);

    // Use AI to evaluate the answer
    let feedbackText = '';
    
    await streamAISensei({
      messages: [
        {
          role: 'user',
          content: `Evaluate this interview answer. Be constructive and specific.

Question: ${currentQuestion.question}
Question Type: ${currentQuestion.question_type}
Candidate's Answer: ${userAnswer}
${currentQuestion.sample_answer ? `Reference Answer: ${currentQuestion.sample_answer}` : ''}

Provide a JSON response with:
- score (0-100)
- feedback (2-3 sentences)
- strengths (array of 2-3 points)
- improvements (array of 2-3 suggestions)

Only respond with valid JSON, no markdown.`,
        },
      ],
      context: {
        companyName,
        roleTitle,
        roundName: round.round_name,
      },
      type: 'interview_prep',
      onDelta: (chunk) => {
        feedbackText += chunk;
      },
      onDone: () => {
        try {
          // Try to parse the JSON from the response
          const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const feedback = JSON.parse(jsonMatch[0]) as AnswerFeedback;
            setAnswers((prev) => new Map(prev).set(currentQuestion.id, { answer: userAnswer, feedback }));
          } else {
            // Fallback if parsing fails
            setAnswers((prev) =>
              new Map(prev).set(currentQuestion.id, {
                answer: userAnswer,
                feedback: {
                  score: 70,
                  feedback: feedbackText,
                  strengths: ['Answer submitted'],
                  improvements: ['Consider expanding your response'],
                },
              })
            );
          }
        } catch (e) {
          setAnswers((prev) =>
            new Map(prev).set(currentQuestion.id, {
              answer: userAnswer,
              feedback: {
                score: 70,
                feedback: 'Good attempt! Your answer has been recorded.',
                strengths: ['Completed the question'],
                improvements: ['Continue practicing'],
              },
            })
          );
        }
        setIsEvaluating(false);
        setUserAnswer('');
        setShowHint(false);
        setHintContent('');

        // Auto-advance to next question
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          setSimulationState('reviewing');
        }
      },
      onError: (error) => {
        toast.error(error.message);
        setIsEvaluating(false);
      },
    });
  };

  const getHint = async () => {
    if (!currentQuestion || isLoadingHint) return;

    setIsLoadingHint(true);
    setShowHint(true);
    setHintContent('');

    await streamAISensei({
      messages: [
        {
          role: 'user',
          content: `Give me a helpful hint for this ${currentQuestion.question_type} interview question without giving away the full answer:

"${currentQuestion.question}"

Provide 2-3 bullet points to guide my thinking. Keep it brief.`,
        },
      ],
      context: {
        companyName,
        roleTitle,
        roundName: round.round_name,
      },
      type: 'interview_prep',
      onDelta: (chunk) => {
        setHintContent((prev) => prev + chunk);
      },
      onDone: () => setIsLoadingHint(false),
      onError: (error) => {
        toast.error(error.message);
        setIsLoadingHint(false);
      },
    });
  };

  const skipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setUserAnswer('');
      setShowHint(false);
      setHintContent('');
    } else {
      setSimulationState('reviewing');
    }
  };

  const finishSimulation = useCallback(() => {
    const totalScore = Array.from(answers.values()).reduce(
      (acc, val) => acc + (val.feedback?.score || 0),
      0
    );
    const avgScore = answers.size > 0 ? Math.round(totalScore / answers.size) : 0;

    onComplete(avgScore, `Completed ${answers.size}/${questions.length} questions`);
    setSimulationState('complete');
  }, [answers, questions.length, onComplete]);

  const sendSenseiMessage = async () => {
    if (!senseiInput.trim() || isSenseiLoading) return;

    const userMessage = { role: 'user' as const, content: senseiInput };
    setSenseiMessages((prev) => [...prev, userMessage]);
    setSenseiInput('');
    setIsSenseiLoading(true);

    let assistantContent = '';
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setSenseiMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    await streamAISensei({
      messages: [
        ...senseiMessages,
        userMessage,
      ],
      context: {
        companyName,
        roleTitle,
        roundName: round.round_name,
      },
      type: 'interview_prep',
      onDelta: updateAssistant,
      onDone: () => setIsSenseiLoading(false),
      onError: (error) => {
        toast.error(error.message);
        setIsSenseiLoading(false);
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">No Questions Available</h3>
        <p className="text-muted-foreground mb-4">
          Interview questions for this round are being prepared.
        </p>
        <Button variant="outline" onClick={onExit}>
          Go Back
        </Button>
      </div>
    );
  }

  // Ready state
  if (simulationState === 'ready') {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border">
        <div className="text-center mb-8">
          <Badge className="mb-4">Round {round.round_number}</Badge>
          <h2 className="text-3xl font-bold text-foreground mb-2">{round.round_name}</h2>
          <p className="text-muted-foreground">{companyName} Interview</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{round.duration_minutes} min</p>
            <p className="text-sm text-muted-foreground">Time Limit</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <MessageSquare className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{questions.length}</p>
            <p className="text-sm text-muted-foreground">Questions</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">AI</p>
            <p className="text-sm text-muted-foreground">Evaluation</p>
          </div>
        </div>

        {round.tips && (
          <div className="bg-primary/10 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Round Tips</span>
            </div>
            <p className="text-sm text-muted-foreground">{round.tips}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onExit}>
            Cancel
          </Button>
          <Button onClick={startSimulation} size="lg">
            <Play className="h-4 w-4 mr-2" />
            Start Interview
          </Button>
        </div>
      </div>
    );
  }

  // Active interview
  if (simulationState === 'active' && currentQuestion) {
    return (
      <div className="space-y-6">
        {/* Timer and Progress */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 terminal-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant={timeRemaining < 120 ? 'destructive' : 'secondary'}>
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSenseiOpen(!senseiOpen)}
              >
                <Bot className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{currentQuestion.question_type}</Badge>
                <Badge
                  variant={
                    currentQuestion.difficulty === 'hard'
                      ? 'destructive'
                      : currentQuestion.difficulty === 'medium'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-6">{currentQuestion.question}</h3>

              <Textarea
                placeholder="Type your answer here... Be detailed and structured."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="min-h-40 mb-4"
                disabled={isEvaluating || isPaused}
              />

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={getHint} disabled={isLoadingHint}>
                    <Lightbulb className="h-4 w-4 mr-1" />
                    Hint
                  </Button>
                  <Button variant="ghost" size="sm" onClick={skipQuestion}>
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                </div>

                <Button onClick={submitAnswer} disabled={!userAnswer.trim() || isEvaluating}>
                  {isEvaluating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      Submit Answer
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Hint Panel */}
            {showHint && (
              <div className="bg-primary/10 rounded-xl p-4 terminal-border">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Sensei's Hint</span>
                </div>
                {isLoadingHint ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{hintContent}</p>
                )}
              </div>
            )}
          </div>

          {/* Sensei Chat Sidebar */}
          {senseiOpen && (
            <div className="lg:col-span-1">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl terminal-border overflow-hidden sticky top-4">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm text-foreground">AI Sensei</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSenseiOpen(false)}>
                    ×
                  </Button>
                </div>

                <ScrollArea className="h-64 p-3">
                  {senseiMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Ask me for help or tips!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {senseiMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`text-xs p-2 rounded ${
                            msg.role === 'user' ? 'bg-primary text-primary-foreground ml-4' : 'bg-secondary mr-4'
                          }`}
                        >
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="p-2 border-t border-border flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask Sensei..."
                    value={senseiInput}
                    onChange={(e) => setSenseiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendSenseiMessage()}
                    className="flex-1 bg-secondary text-foreground text-xs px-2 py-1 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isSenseiLoading}
                  />
                  <Button size="sm" onClick={sendSenseiMessage} disabled={isSenseiLoading}>
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Review state
  if (simulationState === 'reviewing' || simulationState === 'complete') {
    const totalScore = Array.from(answers.values()).reduce(
      (acc, val) => acc + (val.feedback?.score || 0),
      0
    );
    const avgScore = answers.size > 0 ? Math.round(totalScore / answers.size) : 0;

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border text-center">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Round Complete!</h2>
          <p className="text-muted-foreground mb-6">{round.round_name} - {companyName}</p>

          <div className="flex justify-center gap-8 mb-8">
            <div>
              <p className="text-4xl font-bold gradient-text">{avgScore}%</p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-foreground">
                {answers.size}/{questions.length}
              </p>
              <p className="text-sm text-muted-foreground">Answered</p>
            </div>
          </div>

          <Button onClick={onExit} size="lg">
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Question-by-Question Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">Question Review</h3>

          {questions.map((q, index) => {
            const answerData = answers.get(q.id);
            return (
              <div key={q.id} className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Q{index + 1}</span>
                    <Badge variant="outline">{q.question_type}</Badge>
                  </div>
                  {answerData?.feedback ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="font-bold text-foreground">{answerData.feedback.score}%</span>
                    </div>
                  ) : (
                    <Badge variant="secondary">Skipped</Badge>
                  )}
                </div>

                <p className="font-medium text-foreground mb-4">{q.question}</p>

                {answerData && (
                  <>
                    <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-muted-foreground font-medium mb-1">Your Answer:</p>
                      <p className="text-sm text-foreground">{answerData.answer}</p>
                    </div>

                    {answerData.feedback && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{answerData.feedback.feedback}</p>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="bg-primary/10 rounded-lg p-3">
                            <div className="flex items-center gap-1 mb-2">
                              <CheckCircle className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">Strengths</span>
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {answerData.feedback.strengths.map((s, i) => (
                                <li key={i}>• {s}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-destructive/10 rounded-lg p-3">
                            <div className="flex items-center gap-1 mb-2">
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span className="text-sm font-medium text-foreground">Improvements</span>
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {answerData.feedback.improvements.map((s, i) => (
                                <li key={i}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
