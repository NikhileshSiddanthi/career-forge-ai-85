import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  GraduationCap, 
  Heart, 
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  ExternalLink,
  Code,
  Building2,
  Users,
  Sparkles,
  Trophy,
  Filter,
  Search,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

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

interface UserApplication {
  internship_id: string;
  status: string;
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  global_tech: { label: "Global Tech", icon: <Sparkles className="h-4 w-4" />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  product_based: { label: "Product Companies", icon: <Building2 className="h-4 w-4" />, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  women_focused: { label: "Women in Tech", icon: <Heart className="h-4 w-4" />, color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  service_based: { label: "Service Companies", icon: <Briefcase className="h-4 w-4" />, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  startups_open: { label: "Startups & Open Source", icon: <Code className="h-4 w-4" />, color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  competitive_coding: { label: "Competitive Coding", icon: <Trophy className="h-4 w-4" />, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
};

const Internships = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [internships, setInternships] = useState<InternshipProgram[]>([]);
  const [userApplications, setUserApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showWomenOnly, setShowWomenOnly] = useState(false);

  useEffect(() => {
    fetchInternships();
    if (user) {
      fetchUserApplications();
    }
  }, [user]);

  const fetchInternships = async () => {
    try {
      const { data, error } = await supabase
        .from("internship_programs")
        .select("*")
        .order("company");

      if (error) throw error;
      setInternships(data || []);
    } catch (error) {
      console.error("Error fetching internships:", error);
      toast({ title: "Error loading internships", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("user_internship_applications")
        .select("internship_id, status")
        .eq("user_id", user?.id);

      if (error) throw error;
      setUserApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const toggleSaveInternship = async (internshipId: string) => {
    if (!user) {
      toast({ title: "Please login to save internships", variant: "destructive" });
      navigate("/auth");
      return;
    }

    const existing = userApplications.find(a => a.internship_id === internshipId);
    
    try {
      if (existing) {
        await supabase
          .from("user_internship_applications")
          .delete()
          .eq("user_id", user.id)
          .eq("internship_id", internshipId);
        
        setUserApplications(prev => prev.filter(a => a.internship_id !== internshipId));
        toast({ title: "Removed from saved" });
      } else {
        await supabase
          .from("user_internship_applications")
          .insert({ user_id: user.id, internship_id: internshipId, status: "interested" });
        
        setUserApplications(prev => [...prev, { internship_id: internshipId, status: "interested" }]);
        toast({ title: "Saved to your list!" });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({ title: "Error saving internship", variant: "destructive" });
    }
  };

  const filteredInternships = internships.filter(internship => {
    const matchesCategory = selectedCategory === "all" || internship.category === selectedCategory;
    const matchesSearch = 
      internship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.skills_required?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesWomen = !showWomenOnly || internship.is_women_only;
    
    return matchesCategory && matchesSearch && matchesWomen;
  });

  const savedInternships = internships.filter(i => 
    userApplications.some(a => a.internship_id === i.id)
  );

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case "beginner": return "bg-green-500/20 text-green-400";
      case "intermediate": return "bg-yellow-500/20 text-yellow-400";
      case "advanced": return "bg-red-500/20 text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isCurrentlyHiring = (months: string[] | null) => {
    if (!months) return false;
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    return months.includes(currentMonth) || months.includes("Year-round");
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading internships...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Internship Hub
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Badge variant="secondary" className="gap-1">
                <BookmarkCheck className="h-3 w-3" />
                {savedInternships.length} Saved
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Launch Your Career with
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"> Top Internships</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover 50+ curated internship programs from global tech giants, product companies, and startups. 
            Get personalized preparation paths for each program.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, program, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showWomenOnly ? "default" : "outline"}
              onClick={() => setShowWomenOnly(!showWomenOnly)}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              Women in Tech
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All Programs
            </TabsTrigger>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {config.icon}
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">{filteredInternships.length}</div>
                  <div className="text-sm text-muted-foreground">Programs</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {filteredInternships.filter(i => isCurrentlyHiring(i.application_months)).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Hiring Now</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-pink-400">
                    {filteredInternships.filter(i => i.is_women_only).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Women Programs</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {new Set(filteredInternships.map(i => i.company)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Companies</div>
                </CardContent>
              </Card>
            </div>

            {/* Internship Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredInternships.map((internship, index) => {
                  const isSaved = userApplications.some(a => a.internship_id === internship.id);
                  const categoryInfo = categoryConfig[internship.category];
                  const hiringNow = isCurrentlyHiring(internship.application_months);

                  return (
                    <motion.div
                      key={internship.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="h-full hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/30 group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={categoryInfo.color} variant="outline">
                                  {categoryInfo.icon}
                                  <span className="ml-1">{categoryInfo.label}</span>
                                </Badge>
                                {hiringNow && (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                                    Hiring Now
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                                {internship.name}
                              </CardTitle>
                              <CardDescription className="text-base font-medium mt-1">
                                {internship.company}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSaveInternship(internship.id)}
                              className={isSaved ? "text-primary" : "text-muted-foreground"}
                            >
                              {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {internship.description}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {internship.is_women_only && (
                              <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/30">
                                <Heart className="h-3 w-3 mr-1" />
                                Women Only
                              </Badge>
                            )}
                            <Badge className={getDifficultyColor(internship.difficulty_level)}>
                              {internship.difficulty_level}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            {internship.duration && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{internship.duration}</span>
                              </div>
                            )}
                            {internship.eligibility && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span className="line-clamp-1">{internship.eligibility}</span>
                              </div>
                            )}
                            {internship.application_months && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className="line-clamp-1">{internship.application_months.slice(0, 3).join(", ")}</span>
                              </div>
                            )}
                          </div>

                          {internship.skills_required && (
                            <div className="flex flex-wrap gap-1">
                              {internship.skills_required.slice(0, 3).map((skill, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {internship.skills_required.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{internship.skills_required.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          <Button 
                            className="w-full mt-4 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            variant="outline"
                            onClick={() => navigate(`/internship/${internship.id}`)}
                          >
                            View Prep Path
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredInternships.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No internships found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Saved Internships Section */}
        {user && savedInternships.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BookmarkCheck className="h-6 w-6 text-primary" />
              Your Saved Internships
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {savedInternships.map(internship => (
                <Card key={internship.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/internship/${internship.id}`)}>
                  <CardContent className="p-4">
                    <div className="font-medium">{internship.name}</div>
                    <div className="text-sm text-muted-foreground">{internship.company}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {userApplications.find(a => a.internship_id === internship.id)?.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Internships;
