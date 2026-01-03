import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Code, 
  ExternalLink, 
  GraduationCap, 
  Heart,
  Lightbulb,
  MessageSquare,
  Play,
  Target,
  Users,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Trophy,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { CodeExercise } from "@/components/learn/CodeExercise";

interface InternshipProgram {
  id: string;
  name: string;
  company: string;
  category: string;
  description: string | null;
  eligibility: string | null;
  application_link: string | null;
  logo_url: string | null;
  stipend_range: string | null;
  duration: string | null;
  application_months: string[] | null;
  skills_required: string[] | null;
  difficulty_level: string | null;
  is_women_only: boolean;
}

interface PrepPath {
  id: string;
  title: string;
  description: string | null;
  estimated_weeks: number;
  order_index: number;
}

interface PrepModule {
  id: string;
  prep_path_id: string;
  title: string;
  description: string | null;
  content: string | null;
  module_type: string;
  order_index: number;
  estimated_hours: number;
  resources: any;
}

interface UserProgress {
  module_id: string;
  completed: boolean;
}

// Default prep content for internships
const defaultPrepContent: Record<string, PrepModule[]> = {
  dsa: [
    { id: "dsa-1", prep_path_id: "", title: "Arrays & Strings Mastery", description: "Master array manipulation and string algorithms", content: "Arrays are fundamental data structures. Practice two-pointer techniques, sliding window, and prefix sums.", module_type: "reading", order_index: 0, estimated_hours: 4, resources: null },
    { id: "dsa-2", prep_path_id: "", title: "Two Sum Problem", description: "Solve the classic two sum problem", content: `// Given an array of integers nums and an integer target,
// return indices of the two numbers such that they add up to target.

function twoSum(nums, target) {
  // Your solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]`, module_type: "coding", order_index: 1, estimated_hours: 2, resources: null },
    { id: "dsa-3", prep_path_id: "", title: "Linked Lists & Trees", description: "Understand linked lists, binary trees, and traversals", content: "Learn about singly/doubly linked lists, binary trees, BST, and tree traversals (inorder, preorder, postorder).", module_type: "reading", order_index: 2, estimated_hours: 5, resources: null },
    { id: "dsa-4", prep_path_id: "", title: "Reverse Linked List", description: "Implement linked list reversal", content: `// Reverse a singly linked list

class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  let prev = null;
  let current = head;
  
  while (current !== null) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  
  return prev;
}

// Test with array representation
const arr = [1, 2, 3, 4, 5];
console.log("Original:", arr);
console.log("Reversed:", arr.reverse());`, module_type: "coding", order_index: 3, estimated_hours: 2, resources: null },
    { id: "dsa-5", prep_path_id: "", title: "Dynamic Programming Basics", description: "Learn DP fundamentals and common patterns", content: "Understand memoization, tabulation, and common DP patterns like fibonacci, knapsack, and LCS.", module_type: "reading", order_index: 4, estimated_hours: 6, resources: null },
  ],
  system_design: [
    { id: "sd-1", prep_path_id: "", title: "System Design Fundamentals", description: "Learn the basics of designing scalable systems", content: "Understand load balancers, caching, databases, and microservices architecture.", module_type: "reading", order_index: 0, estimated_hours: 4, resources: null },
    { id: "sd-2", prep_path_id: "", title: "Database Design", description: "SQL vs NoSQL, indexing, and sharding", content: "Learn when to use different database types and how to optimize for performance.", module_type: "reading", order_index: 1, estimated_hours: 3, resources: null },
    { id: "sd-3", prep_path_id: "", title: "API Design", description: "RESTful APIs and best practices", content: "Design clean, scalable APIs following REST principles.", module_type: "reading", order_index: 2, estimated_hours: 3, resources: null },
  ],
  behavioral: [
    { id: "bh-1", prep_path_id: "", title: "STAR Method Mastery", description: "Structure your behavioral answers effectively", content: "Learn the Situation, Task, Action, Result framework for answering behavioral questions.", module_type: "reading", order_index: 0, estimated_hours: 2, resources: null },
    { id: "bh-2", prep_path_id: "", title: "Leadership Principles", description: "Understand company values and how to demonstrate them", content: "Learn about common leadership principles at top tech companies and prepare examples.", module_type: "reading", order_index: 1, estimated_hours: 3, resources: null },
    { id: "bh-3", prep_path_id: "", title: "Mock Interview Practice", description: "Practice with common behavioral questions", content: "Prepare answers for: Tell me about yourself, Why this company, Describe a challenge you overcame.", module_type: "mock_interview", order_index: 2, estimated_hours: 2, resources: null },
  ],
  project: [
    { id: "pj-1", prep_path_id: "", title: "Portfolio Project Ideas", description: "Build impressive projects for your portfolio", content: "Create a full-stack application that demonstrates your skills in the relevant technology stack.", module_type: "project", order_index: 0, estimated_hours: 20, resources: null },
    { id: "pj-2", prep_path_id: "", title: "GitHub Profile Optimization", description: "Make your GitHub stand out to recruiters", content: "Pin your best repositories, write clear READMEs, and maintain contribution streaks.", module_type: "reading", order_index: 1, estimated_hours: 2, resources: null },
  ]
};

const InternshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [internship, setInternship] = useState<InternshipProgram | null>(null);
  const [prepPaths, setPrepPaths] = useState<PrepPath[]>([]);
  const [prepModules, setPrepModules] = useState<PrepModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeModule, setActiveModule] = useState<PrepModule | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInternshipDetails();
    }
  }, [id, user]);

  const fetchInternshipDetails = async () => {
    try {
      // Fetch internship
      const { data: internshipData, error: internshipError } = await supabase
        .from("internship_programs")
        .select("*")
        .eq("id", id)
        .single();

      if (internshipError) throw internshipError;
      setInternship(internshipData);

      // Check if saved
      if (user) {
        const { data: savedData } = await supabase
          .from("user_internship_applications")
          .select("id")
          .eq("user_id", user.id)
          .eq("internship_id", id)
          .single();
        
        setIsSaved(!!savedData);

        // Fetch user progress
        const { data: progressData } = await supabase
          .from("user_internship_prep_progress")
          .select("module_id, completed")
          .eq("user_id", user.id);
        
        setUserProgress(progressData || []);
      }

      // Use default prep content based on skills required
      const allModules: PrepModule[] = [
        ...defaultPrepContent.dsa,
        ...defaultPrepContent.system_design,
        ...defaultPrepContent.behavioral,
        ...defaultPrepContent.project
      ];
      setPrepModules(allModules);

    } catch (error) {
      console.error("Error fetching internship:", error);
      toast({ title: "Error loading internship details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from("user_internship_applications")
          .delete()
          .eq("user_id", user.id)
          .eq("internship_id", id);
        setIsSaved(false);
        toast({ title: "Removed from saved" });
      } else {
        await supabase
          .from("user_internship_applications")
          .insert({ user_id: user.id, internship_id: id, status: "preparing" });
        setIsSaved(true);
        toast({ title: "Added to your preparation list!" });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const markModuleComplete = async (moduleId: string) => {
    if (!user) {
      toast({ title: "Please login to track progress", variant: "destructive" });
      return;
    }

    try {
      const existing = userProgress.find(p => p.module_id === moduleId);
      
      if (existing) {
        await supabase
          .from("user_internship_prep_progress")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("module_id", moduleId);
      } else {
        await supabase
          .from("user_internship_prep_progress")
          .insert({ 
            user_id: user.id, 
            module_id: moduleId, 
            completed: true,
            completed_at: new Date().toISOString()
          });
      }

      setUserProgress(prev => [...prev.filter(p => p.module_id !== moduleId), { module_id: moduleId, completed: true }]);
      toast({ title: "Module completed! 🎉" });

      // Move to next module
      const currentIndex = prepModules.findIndex(m => m.id === moduleId);
      if (currentIndex < prepModules.length - 1) {
        setActiveModule(prepModules[currentIndex + 1]);
      }
    } catch (error) {
      console.error("Error marking complete:", error);
    }
  };

  const completedCount = userProgress.filter(p => p.completed).length;
  const totalModules = prepModules.length;
  const progressPercentage = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "coding": return <Code className="h-4 w-4" />;
      case "mock_interview": return <MessageSquare className="h-4 w-4" />;
      case "project": return <Target className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Internship not found</h2>
          <Button onClick={() => navigate("/internships")}>Back to Internships</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/internships")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold">{internship.name}</h1>
              <p className="text-sm text-muted-foreground">{internship.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggleSave} className="gap-2">
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isSaved ? "Saved" : "Save"}
            </Button>
            {internship.application_link && (
              <Button asChild>
                <a href={internship.application_link} target="_blank" rel="noopener noreferrer" className="gap-2">
                  Apply <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{completedCount} of {totalModules} modules</span>
                      <span className="font-bold">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                  </div>
                  {progressPercentage >= 100 && (
                    <Badge className="w-full justify-center py-2 bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Ready to Apply!
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Internship Info */}
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {internship.duration && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-medium">{internship.duration}</div>
                    </div>
                  </div>
                )}
                {internship.eligibility && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Eligibility</div>
                      <div className="font-medium">{internship.eligibility}</div>
                    </div>
                  </div>
                )}
                {internship.application_months && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Application Window</div>
                      <div className="font-medium">{internship.application_months.join(", ")}</div>
                    </div>
                  </div>
                )}
                {internship.is_women_only && (
                  <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                    <Heart className="h-3 w-3 mr-1" />
                    Women-focused Program
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Skills Required */}
            {internship.skills_required && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {internship.skills_required.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="preparation">Preparation Path</TabsTrigger>
                <TabsTrigger value="practice">Practice</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About {internship.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">{internship.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            <h4 className="font-medium">What You'll Learn</h4>
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Real-world engineering practices</li>
                            <li>• Collaboration with experienced engineers</li>
                            <li>• Industry-standard tools and technologies</li>
                            <li>• Project management and agile methodologies</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-5 w-5 text-blue-500" />
                            <h4 className="font-medium">How to Stand Out</h4>
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Strong DSA fundamentals</li>
                            <li>• Personal projects on GitHub</li>
                            <li>• Open source contributions</li>
                            <li>• Clear communication skills</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <Button 
                      className="w-full gap-2" 
                      size="lg"
                      onClick={() => setActiveTab("preparation")}
                    >
                      <Play className="h-4 w-4" />
                      Start Preparation
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preparation">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Module List */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg mb-4">Preparation Modules</h3>
                    {prepModules.map((module, index) => {
                      const isCompleted = userProgress.some(p => p.module_id === module.id && p.completed);
                      const isActive = activeModule?.id === module.id;

                      return (
                        <motion.div
                          key={module.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className={`cursor-pointer transition-all ${isActive ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'} ${isCompleted ? 'bg-green-500/5' : ''}`}
                            onClick={() => setActiveModule(module)}
                          >
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-muted'}`}>
                                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : getModuleIcon(module.module_type)}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{module.title}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {module.estimated_hours}h
                                  <Badge variant="outline" className="text-xs">{module.module_type}</Badge>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Module Content */}
                  <div>
                    {activeModule ? (
                      <Card className="sticky top-24">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            {getModuleIcon(activeModule.module_type)}
                            <Badge variant="outline">{activeModule.module_type}</Badge>
                          </div>
                          <CardTitle>{activeModule.title}</CardTitle>
                          <CardDescription>{activeModule.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {activeModule.module_type === "coding" ? (
                            <CodeExercise
                              starterCode={activeModule.content || ""}
                              language="javascript"
                              onComplete={() => markModuleComplete(activeModule.id)}
                            />
                          ) : (
                            <>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">{activeModule.content}</p>
                              </div>
                              <Button 
                                className="w-full gap-2" 
                                onClick={() => markModuleComplete(activeModule.id)}
                                disabled={userProgress.some(p => p.module_id === activeModule.id && p.completed)}
                              >
                                {userProgress.some(p => p.module_id === activeModule.id && p.completed) ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Mark as Complete
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="sticky top-24">
                        <CardContent className="p-8 text-center">
                          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-medium mb-2">Select a Module</h3>
                          <p className="text-sm text-muted-foreground">
                            Click on any module from the list to view its content and start learning.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="practice">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Coding Practice
                      </CardTitle>
                      <CardDescription>
                        Practice coding problems commonly asked in {internship.company} interviews
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {prepModules.filter(m => m.module_type === "coding").map(module => (
                          <Card key={module.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setActiveModule(module); setActiveTab("preparation"); }}>
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <div className="font-medium">{module.title}</div>
                                <div className="text-sm text-muted-foreground">{module.description}</div>
                              </div>
                              <Button variant="outline" size="sm">Solve</Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Mock Interview
                      </CardTitle>
                      <CardDescription>
                        Practice behavioral questions with AI feedback
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full gap-2" onClick={() => navigate("/interview-prep")}>
                        <Play className="h-4 w-4" />
                        Start Mock Interview
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InternshipDetail;
