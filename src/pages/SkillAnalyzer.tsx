import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Plus, X, Sparkles, Target, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SuggestedRole {
  role_id: string;
  title: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  recommendation: string;
}

interface AnalysisResult {
  extracted_skills: string[];
  suggested_roles: SuggestedRole[];
  overall_feedback: string;
}

const POPULAR_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'SQL', 'HTML/CSS', 
  'TypeScript', 'Git', 'AWS', 'Docker', 'Machine Learning', 'Data Analysis',
  'UI/UX Design', 'Agile', 'Communication', 'Problem Solving'
];

export default function SkillAnalyzer() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [careerRoles, setCareerRoles] = useState<any[]>([]);
  const [step, setStep] = useState<'input' | 'analyzing' | 'results'>('input');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchCareerRoles();
    fetchExistingAnalysis();
  }, [user]);

  const fetchCareerRoles = async () => {
    const { data } = await supabase.from('career_roles').select('id, title, category, description');
    if (data) setCareerRoles(data);
  };

  const fetchExistingAnalysis = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_resume_analysis')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setSkills(data.extracted_skills || []);
      if (data.suggested_roles) {
        const roles = data.suggested_roles as unknown as SuggestedRole[];
        setAnalysisResult({
          extracted_skills: data.extracted_skills || [],
          suggested_roles: roles,
          overall_feedback: ''
        });
        setStep('results');
      }
    }
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('doc')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or DOC file',
        variant: 'destructive'
      });
      return;
    }

    setResumeFile(file);

    // Read file as text (basic extraction - in production use proper PDF parser)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // For PDF/DOC, we'll send to backend for proper parsing
      setResumeText(text || `Resume: ${file.name}`);
    };
    reader.readAsText(file);

    toast({
      title: 'Resume uploaded',
      description: `${file.name} ready for analysis`,
    });
  };

  const analyzeProfile = async () => {
    if (skills.length === 0 && !resumeFile) {
      toast({
        title: 'Missing information',
        description: 'Please add skills and upload your resume',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    setStep('analyzing');

    try {
      // Upload resume if present
      let resumeUrl = '';
      if (resumeFile && user) {
        const filePath = `${user.id}/${Date.now()}-${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile);
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath);
          resumeUrl = urlData.publicUrl;
        }
      }

      // Call AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeText: resumeText || `Skills: ${skills.join(', ')}`,
          skills,
          careerRoles: careerRoles.map(r => ({ id: r.id, title: r.title, category: r.category }))
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      setStep('results');

      // Save analysis
      if (user) {
        await supabase.from('user_resume_analysis').upsert({
          user_id: user.id,
          resume_url: resumeUrl,
          extracted_skills: data.extracted_skills || skills,
          suggested_roles: data.suggested_roles,
          analyzed_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }

      toast({
        title: 'Analysis complete!',
        description: 'Check your personalized role recommendations',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: 'Please try again later',
        variant: 'destructive'
      });
      setStep('input');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectRole = async (roleId: string) => {
    if (!user) return;
    
    try {
      await supabase.from('user_career_paths').upsert({
        user_id: user.id,
        role_id: roleId,
        selected_at: new Date().toISOString()
      }, { onConflict: 'user_id,role_id' });

      toast({
        title: 'Role selected!',
        description: 'Your career path has been updated',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error selecting role:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">SkillForge</span>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">
                  Discover Your <span className="text-primary">Perfect Role</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Add your skills and upload your resume - we'll suggest the best career paths for you
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Skills Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Your Skills
                    </CardTitle>
                    <CardDescription>
                      Add skills you have (both required)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
                      />
                      <Button onClick={() => addSkill(newSkill)} size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Added Skills */}
                    <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border border-dashed rounded-lg">
                      {skills.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No skills added yet</p>
                      ) : (
                        skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="gap-1">
                            {skill}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => removeSkill(skill)}
                            />
                          </Badge>
                        ))
                      )}
                    </div>

                    {/* Popular Skills */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Popular skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 8).map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10"
                            onClick={() => addSkill(skill)}
                          >
                            + {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resume Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Upload Resume
                    </CardTitle>
                    <CardDescription>
                      Upload your resume for detailed analysis (both required)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      {resumeFile ? (
                        <div className="text-center">
                          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="font-medium">{resumeFile.name}</p>
                          <p className="text-sm text-muted-foreground">Click to change</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="font-medium">Drop your resume here</p>
                          <p className="text-sm text-muted-foreground">PDF or DOC, max 10MB</p>
                        </div>
                      )}
                    </label>
                  </CardContent>
                </Card>
              </div>

              {/* Analyze Button */}
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  onClick={analyzeProfile}
                  disabled={skills.length === 0 || !resumeFile}
                  className="gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze & Get Role Suggestions
                  <ArrowRight className="w-5 h-5" />
                </Button>
                {(skills.length === 0 || !resumeFile) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {skills.length === 0 && !resumeFile 
                      ? 'Add skills and upload resume to continue'
                      : skills.length === 0 
                        ? 'Add at least one skill'
                        : 'Upload your resume'}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md mx-auto text-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Analyzing Your Profile</h2>
              <p className="text-muted-foreground mb-6">
                Our AI is matching your skills with the best career opportunities...
              </p>
              <Progress value={66} className="w-full" />
            </motion.div>
          )}

          {step === 'results' && analysisResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Your Career Matches</h1>
                <p className="text-muted-foreground">
                  Based on your skills and resume, here are your best-fit roles
                </p>
              </div>

              {/* Extracted Skills */}
              {analysisResult.extracted_skills.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Skills Identified</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.extracted_skills.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Role Suggestions */}
              <div className="grid gap-6">
                {analysisResult.suggested_roles.map((role, index) => (
                  <motion.div
                    key={role.role_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={index === 0 ? 'border-primary shadow-lg' : ''}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {index === 0 && (
                                <Badge className="bg-primary">Best Match</Badge>
                              )}
                              <h3 className="text-xl font-bold">{role.title}</h3>
                            </div>
                            <p className="text-muted-foreground mb-4">{role.recommendation}</p>
                            
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Matching Skills
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {role.matching_skills.map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-green-600 border-green-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {role.missing_skills.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> Skills to Learn
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {role.missing_skills.map((skill) => (
                                      <Badge key={skill} variant="outline" className="text-amber-600 border-amber-200">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-3xl font-bold text-primary mb-2">
                              {role.match_score}%
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">Match Score</p>
                            <Button onClick={() => selectRole(role.role_id)}>
                              Choose This Role
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Overall Feedback */}
              {analysisResult.overall_feedback && (
                <Card className="mt-8 bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Career Advice from Sensei
                    </h3>
                    <p className="text-muted-foreground">{analysisResult.overall_feedback}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-center gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep('input')}>
                  Update Profile
                </Button>
                <Button onClick={() => navigate('/jobs')}>
                  Browse Jobs for Your Role
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
