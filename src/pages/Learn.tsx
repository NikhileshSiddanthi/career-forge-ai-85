import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Terminal, ArrowLeft, BookOpen, CheckCircle, Circle,
  Loader2, ChevronRight, Send, Bot, User, Award,
  Play, FileText, Code, HelpCircle
} from 'lucide-react';
import { streamAISensei } from '@/lib/api/ai-sensei';
import { toast } from 'sonner';
import { CodeExercise } from '@/components/learn/CodeExercise';
import { CertificateModal } from '@/components/learn/CertificateModal';

interface Course {
  id: string;
  title: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  lesson_type: string;
  order_index: number;
  estimated_minutes: number;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  estimated_hours: number;
  difficulty_level: string;
  career_roles: {
    id: string;
    title: string;
    slug: string;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
}

const LESSON_TYPE_ICONS = {
  reading: FileText,
  video: Play,
  coding: Code,
  quiz: HelpCircle,
};

export default function Learn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user && slug) {
      fetchLearningData();
      fetchUserProfile();
    }
  }, [user, authLoading, slug]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();
    if (data?.full_name) {
      setUserName(data.full_name);
    }
  };

  const fetchLearningData = async () => {
    if (!slug || !user) return;

    try {
      // Get role by slug
      const { data: roleData } = await supabase
        .from('career_roles')
        .select('id, title, slug')
        .eq('slug', slug)
        .single();

      if (!roleData) {
        navigate('/roles');
        return;
      }

      // Get learning path for this role
      const { data: pathData } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('role_id', roleData.id)
        .single();

      if (!pathData) {
        toast.error('Learning path not found');
        navigate('/roles');
        return;
      }

      setLearningPath({ ...pathData, career_roles: roleData } as LearningPath);

      // Check for existing certificate
      const { data: certData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('learning_path_id', pathData.id)
        .single();

      if (certData) {
        setCertificate(certData);
      }

      // Ensure user has this career path
      await supabase
        .from('user_career_paths')
        .upsert({
          user_id: user.id,
          role_id: roleData.id,
          phase: 'learning',
        }, { onConflict: 'user_id,role_id' });

      // Ensure user has learning progress
      await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          learning_path_id: pathData.id,
        }, { onConflict: 'user_id,learning_path_id' });

      // Get courses with lessons
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*, lessons(*)')
        .eq('learning_path_id', pathData.id)
        .order('order_index');

      const sortedCourses = (coursesData || []).map(course => ({
        ...course,
        lessons: (course.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
      }));

      setCourses(sortedCourses);

      // Get completed lessons
      const { data: completedData } = await supabase
        .from('user_completed_lessons')
        .select('lesson_id')
        .eq('user_id', user.id);

      setCompletedLessons(new Set((completedData || []).map(c => c.lesson_id)));

      // Set first incomplete lesson as current
      let foundCurrent = false;
      for (const course of sortedCourses) {
        for (const lesson of course.lessons) {
          if (!completedData?.some(c => c.lesson_id === lesson.id)) {
            setCurrentCourse(course);
            setCurrentLesson(lesson);
            foundCurrent = true;
            break;
          }
        }
        if (foundCurrent) break;
      }

      // If all complete, set last lesson
      if (!foundCurrent && sortedCourses.length > 0) {
        const lastCourse = sortedCourses[sortedCourses.length - 1];
        const lastLesson = lastCourse.lessons[lastCourse.lessons.length - 1];
        setCurrentCourse(lastCourse);
        setCurrentLesson(lastLesson);
      }
    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async () => {
    if (!currentLesson || !user) return;

    try {
      await supabase
        .from('user_completed_lessons')
        .upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
        }, { onConflict: 'user_id,lesson_id' });

      const newCompletedLessons = new Set([...completedLessons, currentLesson.id]);
      setCompletedLessons(newCompletedLessons);

      // Find next lesson
      const currentCourseIndex = courses.findIndex(c => c.id === currentCourse?.id);
      const currentLessonIndex = currentCourse?.lessons.findIndex(l => l.id === currentLesson.id) ?? -1;

      if (currentLessonIndex < (currentCourse?.lessons.length ?? 0) - 1) {
        setCurrentLesson(currentCourse!.lessons[currentLessonIndex + 1]);
      } else if (currentCourseIndex < courses.length - 1) {
        const nextCourse = courses[currentCourseIndex + 1];
        setCurrentCourse(nextCourse);
        setCurrentLesson(nextCourse.lessons[0]);
      } else {
        // All lessons complete - check for certificate
        const totalLessons = courses.reduce((acc, c) => acc + c.lessons.length, 0);
        const allComplete = newCompletedLessons.size >= totalLessons;

        if (allComplete && learningPath && !certificate) {
          const certNumber = `SF-${Date.now().toString(36).toUpperCase()}`;
          const { data: newCert } = await supabase
            .from('certificates')
            .insert({
              user_id: user.id,
              learning_path_id: learningPath.id,
              certificate_number: certNumber,
            })
            .select()
            .single();

          if (newCert) {
            setCertificate(newCert);
            setShowCertificate(true);
            toast.success('🎉 Congratulations! You earned a certificate!');
          }
        }
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Failed to save progress');
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
        topic: currentCourse?.title,
        lessonTitle: currentLesson?.title,
      },
      type: 'learning',
      onDelta: updateAssistant,
      onDone: () => setIsAiLoading(false),
      onError: (error) => {
        toast.error(error.message);
        setIsAiLoading(false);
      },
    });
  };

  // Extract code block from lesson content
  const extractCodeFromContent = (content: string): string | null => {
    const codeBlockMatch = content.match(/```(?:javascript|js|html|css)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    return null;
  };

  const renderLessonContent = () => {
    if (!currentLesson?.content) {
      return (
        <div className="bg-secondary/50 rounded-xl p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Lesson content is being prepared by AI Sensei. 
            Ask questions in the chat to learn more!
          </p>
        </div>
      );
    }

    // If it's a coding lesson, show code editor
    if (currentLesson.lesson_type === 'coding') {
      const starterCode = extractCodeFromContent(currentLesson.content);
      
      // Split content to show description before code
      const contentParts = currentLesson.content.split(/```(?:javascript|js|html|css)?/);
      const description = contentParts[0] || '';

      return (
        <div className="space-y-6">
          <div className="prose prose-invert max-w-none whitespace-pre-wrap">
            {description}
          </div>
          
          {starterCode && (
            <CodeExercise
              starterCode={starterCode}
              language="javascript"
              onComplete={markLessonComplete}
            />
          )}
        </div>
      );
    }

    // Regular lesson - render markdown-style content
    return (
      <div className="prose prose-invert max-w-none">
        {currentLesson.content.split('\n').map((line, i) => {
          // Headers
          if (line.startsWith('# ')) {
            return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={i} className="text-xl font-semibold mt-5 mb-3 text-primary">{line.slice(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
          }
          // Code blocks
          if (line.startsWith('```')) {
            return null; // Skip code block markers
          }
          // List items
          if (line.startsWith('- ')) {
            return <li key={i} className="ml-4">{line.slice(2)}</li>;
          }
          if (line.match(/^\d+\. /)) {
            return <li key={i} className="ml-4">{line.replace(/^\d+\. /, '')}</li>;
          }
          // Regular paragraph
          if (line.trim()) {
            return <p key={i} className="my-2">{line}</p>;
          }
          return null;
        })}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalLessons = courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border bg-card/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold gradient-text">SkillForge</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Progress */}
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-foreground mb-2">{learningPath?.title}</h2>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary font-bold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          
          {certificate && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => setShowCertificate(true)}
            >
              <Award className="h-4 w-4 mr-2 text-primary" />
              View Certificate
            </Button>
          )}
        </div>

        {/* Course List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {courses.map((course) => (
              <div key={course.id}>
                <h3 className="text-sm font-semibold text-foreground mb-2">{course.title}</h3>
                <div className="space-y-1">
                  {course.lessons.map((lesson) => {
                    const isComplete = completedLessons.has(lesson.id);
                    const isCurrent = currentLesson?.id === lesson.id;
                    const LessonIcon = LESSON_TYPE_ICONS[lesson.lesson_type as keyof typeof LESSON_TYPE_ICONS] || FileText;

                    return (
                      <button
                        key={lesson.id}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                          isCurrent ? 'bg-primary/20 text-primary' : 
                          isComplete ? 'text-muted-foreground' : 'text-foreground hover:bg-secondary'
                        }`}
                        onClick={() => {
                          setCurrentCourse(course);
                          setCurrentLesson(lesson);
                        }}
                      >
                        {isComplete ? (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0" />
                        )}
                        <LessonIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Lesson Content */}
        <main className="flex-1 overflow-auto p-8">
          {currentLesson ? (
            <div className="max-w-3xl mx-auto">
              <Badge variant="secondary" className="mb-4">
                {currentCourse?.title}
              </Badge>
              
              <h1 className="text-3xl font-bold text-foreground mb-4">{currentLesson.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                <span>{currentLesson.estimated_minutes} min</span>
                <span className="capitalize">{currentLesson.lesson_type}</span>
              </div>

              <div className="mb-8">
                {renderLessonContent()}
              </div>

              {currentLesson.lesson_type !== 'coding' && (
                <div className="flex gap-4">
                  <Button 
                    size="lg" 
                    className="flex-1"
                    onClick={markLessonComplete}
                    disabled={completedLessons.has(currentLesson.id)}
                  >
                    {completedLessons.has(currentLesson.id) ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        Mark Complete
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a lesson to begin</p>
            </div>
          )}
        </main>

        {/* AI Chat */}
        <div className="h-80 border-t border-border bg-card/50 flex flex-col">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">AI Sensei</span>
            <span className="text-xs text-muted-foreground">Ask questions about this lesson</span>
          </div>

          <ScrollArea className="flex-1 p-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>👋 Hi! I'm your AI Sensei.</p>
                <p>Ask me anything about {currentLesson?.title || 'this topic'}!</p>
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

          <div className="p-3 border-t border-border flex gap-2">
            <Textarea
              placeholder="Ask AI Sensei..."
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

      {/* Certificate Modal */}
      {certificate && learningPath && (
        <CertificateModal
          open={showCertificate}
          onOpenChange={setShowCertificate}
          userName={userName}
          pathTitle={learningPath.title}
          certificateNumber={certificate.certificate_number}
          issuedDate={certificate.issued_at}
        />
      )}
    </div>
  );
}
