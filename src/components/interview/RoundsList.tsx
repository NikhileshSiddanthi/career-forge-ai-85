import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Building2, CheckCircle, Circle, Clock, 
  Play, Lock 
} from 'lucide-react';

interface Round {
  id: string;
  round_number: number;
  round_name: string;
  description: string;
  duration_minutes: number;
  tips: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
}

interface RoundsListProps {
  company: Company;
  rounds: Round[];
  roleTitle?: string;
  completedRounds: Set<number>;
  onSelectRound: (round: Round) => void;
  onBack: () => void;
}

export default function RoundsList({
  company,
  rounds,
  roleTitle,
  completedRounds,
  onSelectRound,
  onBack,
}: RoundsListProps) {
  const allCompleted = rounds.length > 0 && rounds.every(r => completedRounds.has(r.round_number));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          All Companies
        </Button>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{company.name}</h2>
            <p className="text-muted-foreground">
              {roleTitle || 'General'} Interview Process
            </p>
          </div>
        </div>

        {allCompleted && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <p className="text-primary font-semibold">🎉 All rounds completed! You're ready for the real interview.</p>
          </div>
        )}
      </div>

      {/* Interview Pipeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Interview Rounds</h3>

        {rounds.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 terminal-border text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No interview data available for this company/role combination yet.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-border" />

            <div className="space-y-4">
              {rounds.map((round, index) => {
                const isCompleted = completedRounds.has(round.round_number);
                const isLocked = index > 0 && !completedRounds.has(rounds[index - 1].round_number);

                return (
                  <div
                    key={round.id}
                    className={`relative bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border transition-all ${
                      isLocked ? 'opacity-50' : 'hover:border-primary cursor-pointer'
                    }`}
                    onClick={() => !isLocked && onSelectRound(round)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status indicator */}
                      <div
                        className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : isLocked
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="mb-1">
                              Round {round.round_number}
                            </Badge>
                            <h4 className="text-lg font-bold text-foreground">{round.round_name}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {round.duration_minutes} min
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">{round.description}</p>

                        {!isLocked && !isCompleted && (
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Start Round
                          </Button>
                        )}

                        {isCompleted && (
                          <Button size="sm" variant="outline">
                            Practice Again
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
