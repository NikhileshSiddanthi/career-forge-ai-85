import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  interview_difficulty: string;
}

interface CompanySelectorProps {
  companies: Company[];
  onSelect: (company: Company) => void;
}

export default function CompanySelector({ companies, onSelect }: CompanySelectorProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <button
          key={company.id}
          className="bg-card/80 backdrop-blur-sm rounded-xl p-6 terminal-border text-left hover:border-primary transition-all hover:scale-[1.02] group"
          onClick={() => onSelect(company)}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                {company.name}
              </h3>
              <p className="text-xs text-muted-foreground">{company.industry}</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {company.description}
          </p>
          
          <Badge 
            variant={
              company.interview_difficulty === 'hard' 
                ? 'destructive' 
                : company.interview_difficulty === 'medium'
                  ? 'default'
                  : 'secondary'
            }
          >
            {company.interview_difficulty} difficulty
          </Badge>
        </button>
      ))}
    </div>
  );
}
