import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

interface CodeExerciseProps {
  starterCode: string;
  language?: 'javascript' | 'html' | 'css';
  onComplete?: () => void;
}

export function CodeExercise({ starterCode, language = 'javascript', onComplete }: CodeExerciseProps) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runCode = () => {
    setIsRunning(true);
    setOutput([]);

    if (language === 'html' || language === 'css') {
      setOutput(['✓ Code looks good! Preview would render in a real browser.']);
      setHasRun(true);
      setIsRunning(false);
      return;
    }

    // JavaScript execution
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        logs.push(args.map(a => 
          typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
        ).join(' '));
      };

      console.error = (...args) => {
        logs.push('❌ ' + args.map(a => String(a)).join(' '));
      };

      // Execute the code
      const result = eval(code);
      
      console.log = originalLog;
      console.error = originalError;

      if (logs.length > 0) {
        setOutput(logs);
      } else if (result !== undefined) {
        setOutput([`Result: ${JSON.stringify(result)}`]);
      } else {
        setOutput(['✓ Code executed successfully (no output)']);
      }

      setHasRun(true);
    } catch (error) {
      setOutput([`❌ Error: ${error}`]);
    }

    setIsRunning(false);
  };

  const resetCode = () => {
    setCode(starterCode);
    setOutput([]);
    setHasRun(false);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Card className="my-6 border-primary/30 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Coding Exercise
          </CardTitle>
          <Badge variant="outline" className="text-xs uppercase">
            {language}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code Editor */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Editor
            height="300px"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 16 },
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button onClick={runCode} disabled={isRunning} size="sm">
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running...' : 'Run Code'}
          </Button>
          <Button variant="outline" onClick={resetCode} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          {hasRun && !output.some(o => o.startsWith('❌')) && (
            <Button variant="secondary" onClick={handleComplete} size="sm" className="ml-auto">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Exercise Complete
            </Button>
          )}
        </div>

        {/* Output */}
        {output.length > 0 && (
          <div className="bg-black/60 rounded-lg p-4 font-mono text-sm">
            <p className="text-muted-foreground text-xs mb-2">Output:</p>
            {output.map((line, i) => (
              <div 
                key={i} 
                className={line.startsWith('❌') ? 'text-red-400' : 'text-green-400'}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
