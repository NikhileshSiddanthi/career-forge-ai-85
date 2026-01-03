import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, CheckCircle2, XCircle, Code2, Database, Palette, Briefcase, RotateCcw, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  roleCategories: string[];
  language: "javascript" | "python" | "sql";
  starterCode: string;
  testCases: { input: string; expected: string; description: string }[];
  hint?: string;
  solution?: string;
}

const problems: Problem[] = [
  // JavaScript Problems (Engineering/All)
  {
    id: "js-1",
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to target. You may assume each input has exactly one solution.",
    difficulty: "easy",
    category: "Arrays",
    roleCategories: ["engineering", "data"],
    language: "javascript",
    starterCode: `function twoSum(nums, target) {
  // Your code here
  
}

// Test your solution
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]`,
    testCases: [
      { input: "[2, 7, 11, 15], 9", expected: "[0,1]", description: "Basic case" },
      { input: "[3, 2, 4], 6", expected: "[1,2]", description: "Non-adjacent elements" },
      { input: "[3, 3], 6", expected: "[0,1]", description: "Same numbers" },
    ],
    hint: "Use a hash map to store seen numbers and their indices for O(n) time complexity.",
  },
  {
    id: "js-2",
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters.",
    difficulty: "easy",
    category: "Strings",
    roleCategories: ["engineering", "data"],
    language: "javascript",
    starterCode: `function reverseString(s) {
  // Your code here - modify in place
  
  return s;
}

console.log(reverseString(["h","e","l","l","o"]));`,
    testCases: [
      { input: '["h","e","l","l","o"]', expected: '["o","l","l","e","h"]', description: "Basic string" },
      { input: '["H","a","n","n","a","h"]', expected: '["h","a","n","n","a","H"]', description: "Palindrome" },
    ],
    hint: "Use two pointers from start and end, swap and move inward.",
  },
  {
    id: "js-3",
    title: "Valid Parentheses",
    description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if brackets are closed in the correct order.",
    difficulty: "medium",
    category: "Stack",
    roleCategories: ["engineering"],
    language: "javascript",
    starterCode: `function isValid(s) {
  // Your code here
  
}

console.log(isValid("()[]{}")); // Expected: true
console.log(isValid("(]")); // Expected: false`,
    testCases: [
      { input: '"()"', expected: "true", description: "Simple parentheses" },
      { input: '"()[]{}"', expected: "true", description: "Multiple types" },
      { input: '"(]"', expected: "false", description: "Mismatched" },
      { input: '"([)]"', expected: "false", description: "Wrong order" },
    ],
    hint: "Use a stack. Push opening brackets, pop and compare for closing brackets.",
  },
  {
    id: "js-4",
    title: "FizzBuzz",
    description: "Write a function that returns an array of strings from 1 to n. For multiples of 3, add 'Fizz'. For multiples of 5, add 'Buzz'. For multiples of both, add 'FizzBuzz'.",
    difficulty: "easy",
    category: "Logic",
    roleCategories: ["engineering", "data", "product"],
    language: "javascript",
    starterCode: `function fizzBuzz(n) {
  // Your code here
  
}

console.log(fizzBuzz(15));`,
    testCases: [
      { input: "3", expected: '["1","2","Fizz"]', description: "Up to 3" },
      { input: "5", expected: '["1","2","Fizz","4","Buzz"]', description: "Up to 5" },
      { input: "15", expected: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', description: "Up to 15" },
    ],
    hint: "Check divisibility by 15 first, then by 3, then by 5.",
  },
  // SQL Problems (Data/Product)
  {
    id: "sql-1",
    title: "Select All Employees",
    description: "Write a SQL query to select all columns from the 'employees' table where salary is greater than 50000.",
    difficulty: "easy",
    category: "SQL Basics",
    roleCategories: ["data", "product", "engineering"],
    language: "sql",
    starterCode: `-- Write your SQL query here
SELECT 
FROM employees
WHERE `,
    testCases: [
      { input: "employees table", expected: "SELECT * FROM employees WHERE salary > 50000", description: "Basic SELECT with WHERE" },
    ],
    hint: "Use SELECT * to get all columns and WHERE clause to filter.",
  },
  {
    id: "sql-2",
    title: "Group By Department",
    description: "Write a query to find the average salary for each department from the 'employees' table.",
    difficulty: "medium",
    category: "Aggregation",
    roleCategories: ["data", "product"],
    language: "sql",
    starterCode: `-- Write your SQL query here
SELECT 
FROM employees
GROUP BY `,
    testCases: [
      { input: "employees table", expected: "SELECT department, AVG(salary) FROM employees GROUP BY department", description: "GROUP BY with AVG" },
    ],
    hint: "Use AVG() function with GROUP BY clause.",
  },
  {
    id: "sql-3",
    title: "Join Tables",
    description: "Write a query to get employee names along with their department names by joining 'employees' and 'departments' tables.",
    difficulty: "medium",
    category: "Joins",
    roleCategories: ["data", "engineering"],
    language: "sql",
    starterCode: `-- Write your SQL query here
SELECT 
FROM employees e
JOIN `,
    testCases: [
      { input: "employees, departments", expected: "SELECT e.name, d.department_name FROM employees e JOIN departments d ON e.department_id = d.id", description: "INNER JOIN" },
    ],
    hint: "Use JOIN with ON clause to match department_id.",
  },
  // Python-style Problems (conceptual - runs as JS)
  {
    id: "py-1",
    title: "Find Maximum",
    description: "Write a function to find the maximum element in an array without using built-in max functions.",
    difficulty: "easy",
    category: "Arrays",
    roleCategories: ["data", "engineering"],
    language: "javascript",
    starterCode: `function findMax(arr) {
  // Find maximum without using Math.max
  
}

console.log(findMax([3, 1, 4, 1, 5, 9, 2, 6])); // Expected: 9`,
    testCases: [
      { input: "[3, 1, 4, 1, 5, 9, 2, 6]", expected: "9", description: "Mixed numbers" },
      { input: "[-5, -1, -10, -3]", expected: "-1", description: "Negative numbers" },
      { input: "[42]", expected: "42", description: "Single element" },
    ],
    hint: "Initialize max with the first element, iterate and compare.",
  },
  {
    id: "py-2",
    title: "Count Vowels",
    description: "Write a function that counts the number of vowels (a, e, i, o, u) in a given string.",
    difficulty: "easy",
    category: "Strings",
    roleCategories: ["data", "engineering"],
    language: "javascript",
    starterCode: `function countVowels(str) {
  // Count vowels in the string
  
}

console.log(countVowels("Hello World")); // Expected: 3`,
    testCases: [
      { input: '"Hello World"', expected: "3", description: "Mixed case" },
      { input: '"AEIOU"', expected: "5", description: "All vowels uppercase" },
      { input: '"xyz"', expected: "0", description: "No vowels" },
    ],
    hint: "Use toLowerCase() and check each character against vowel set.",
  },
  // Design-focused (HTML/CSS conceptual)
  {
    id: "design-1",
    title: "Center a Div",
    description: "Write JavaScript code that creates and styles a centered div element. The div should be 200x200px, centered both horizontally and vertically.",
    difficulty: "easy",
    category: "CSS/Styling",
    roleCategories: ["design", "engineering"],
    language: "javascript",
    starterCode: `function createCenteredDiv() {
  // Create a div and apply centering styles
  // Return the style object you would use
  
  const styles = {
    // Add your CSS properties here
  };
  
  return styles;
}

console.log(createCenteredDiv());`,
    testCases: [
      { input: "none", expected: "flexbox or grid centering", description: "Modern centering" },
    ],
    hint: "Use display: flex with justify-content and align-items set to center.",
  },
];

const CodePlayground = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_career_paths")
        .select("role_id, career_roles(category)")
        .eq("user_id", user.id)
        .order("selected_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.career_roles) {
        const roleData = data.career_roles as unknown as { category: string };
        setUserRole(roleData.category);
        setSelectedRole(roleData.category);
      }
    };
    
    fetchUserRole();
  }, [user]);

  const filteredProblems = problems.filter(
    (p) => selectedRole === "all" || p.roleCategories.includes(selectedRole)
  );

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode);
    setOutput([]);
    setTestResults([]);
    setShowHint(false);
  };

  const runCode = () => {
    if (!selectedProblem) return;
    
    setIsRunning(true);
    setOutput([]);
    setTestResults([]);

    if (selectedProblem.language === "sql") {
      // SQL is conceptual - just validate the query structure
      setTimeout(() => {
        const normalizedCode = code.toLowerCase().replace(/\s+/g, " ").trim();
        const hasSelect = normalizedCode.includes("select");
        const hasFrom = normalizedCode.includes("from");
        
        if (hasSelect && hasFrom) {
          setOutput(["✓ Valid SQL query structure detected"]);
          setTestResults([{ passed: true, message: "Query syntax looks correct!" }]);
        } else {
          setOutput(["✗ SQL query should include SELECT and FROM clauses"]);
          setTestResults([{ passed: false, message: "Missing required SQL keywords" }]);
        }
        setIsRunning(false);
      }, 500);
      return;
    }

    // JavaScript execution
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      
      // Capture console.log outputs
      console.log = (...args) => {
        logs.push(args.map(a => 
          typeof a === "object" ? JSON.stringify(a) : String(a)
        ).join(" "));
      };

      // Execute the code
      const result = eval(code);
      
      console.log = originalLog;

      if (logs.length > 0) {
        setOutput(logs);
      } else if (result !== undefined) {
        setOutput([String(result)]);
      } else {
        setOutput(["Code executed successfully (no output)"]);
      }

      // Run test cases for JavaScript
      const results = selectedProblem.testCases.map((testCase) => {
        try {
          // Extract function name from code
          const funcMatch = code.match(/function\s+(\w+)/);
          if (!funcMatch) {
            return { passed: false, message: `${testCase.description}: Could not find function` };
          }
          
          const funcName = funcMatch[1];
          const testCode = `${code}\n${funcName}(${testCase.input})`;
          const testResult = eval(testCode);
          const resultStr = JSON.stringify(testResult);
          const expected = testCase.expected;
          
          const passed = resultStr === expected || String(testResult) === expected;
          return {
            passed,
            message: `${testCase.description}: ${passed ? "Passed" : `Expected ${expected}, got ${resultStr}`}`,
          };
        } catch (e) {
          return { passed: false, message: `${testCase.description}: Error - ${e}` };
        }
      });

      setTestResults(results);
    } catch (error) {
      setOutput([`Error: ${error}`]);
      setTestResults([{ passed: false, message: `Runtime error: ${error}` }]);
    }

    setIsRunning(false);
  };

  const resetCode = () => {
    if (selectedProblem) {
      setCode(selectedProblem.starterCode);
      setOutput([]);
      setTestResults([]);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "engineering": return <Code2 className="h-4 w-4" />;
      case "data": return <Database className="h-4 w-4" />;
      case "design": return <Palette className="h-4 w-4" />;
      case "product": return <Briefcase className="h-4 w-4" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Code Playground</h1>
              <p className="text-sm text-muted-foreground">Practice coding problems for interviews</p>
            </div>
          </div>
          
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="product">Product</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Problem List */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="text-lg font-semibold text-foreground mb-4">Problems</h2>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {filteredProblems.map((problem) => (
                <Card
                  key={problem.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedProblem?.id === problem.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleSelectProblem(problem)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate">{problem.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{problem.category}</p>
                      </div>
                      <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {problem.roleCategories.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs px-1.5 py-0">
                          {getRoleIcon(role)}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">
                        {problem.language.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Editor & Output */}
          <div className="lg:col-span-9">
            {selectedProblem ? (
              <div className="space-y-4">
                {/* Problem Description */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedProblem.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {selectedProblem.category} • {selectedProblem.language.toUpperCase()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={getDifficultyColor(selectedProblem.difficulty)}>
                        {selectedProblem.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedProblem.description}
                    </p>
                    {selectedProblem.hint && (
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHint(!showHint)}
                          className="text-primary"
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          {showHint ? "Hide Hint" : "Show Hint"}
                        </Button>
                        {showHint && (
                          <p className="mt-2 text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                            💡 {selectedProblem.hint}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Code Editor */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Code Editor</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetCode}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                        <Button size="sm" onClick={runCode} disabled={isRunning}>
                          <Play className="h-4 w-4 mr-2" />
                          {isRunning ? "Running..." : "Run Code"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-t border-border">
                      <Editor
                        height="350px"
                        language={selectedProblem.language === "sql" ? "sql" : "javascript"}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: "on",
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: "on",
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Output & Test Results */}
                <Tabs defaultValue="output" className="w-full">
                  <TabsList>
                    <TabsTrigger value="output">Output</TabsTrigger>
                    <TabsTrigger value="tests">
                      Test Results
                      {testResults.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {testResults.filter(t => t.passed).length}/{testResults.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="output">
                    <Card>
                      <CardContent className="p-4">
                        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm min-h-[120px]">
                          {output.length > 0 ? (
                            output.map((line, i) => (
                              <div key={i} className="text-green-400">{line}</div>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Run your code to see output...</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="tests">
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {testResults.length > 0 ? (
                            testResults.map((result, i) => (
                              <div
                                key={i}
                                className={`flex items-center gap-2 p-3 rounded-lg ${
                                  result.passed 
                                    ? "bg-green-500/10 border border-green-500/20" 
                                    : "bg-red-500/10 border border-red-500/20"
                                }`}
                              >
                                {result.passed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-400" />
                                )}
                                <span className={result.passed ? "text-green-400" : "text-red-400"}>
                                  {result.message}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted-foreground text-center py-4">
                              Run your code to see test results...
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Select a Problem</h3>
                  <p className="text-muted-foreground mt-2">
                    Choose a problem from the list to start practicing
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePlayground;
