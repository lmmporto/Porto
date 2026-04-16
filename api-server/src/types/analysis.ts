export interface AnalysisResult {
  executiveSummary: string;
  mainDifficulty: string;
  recommendedAction: string;
  strengths: string[];
  
  managementData: {
    route: 'A' | 'B' | 'C' | 'D';
    product: string;
    competitors: string[];
    objections: string[];
    spinCounts: {
      situation: number;
      problem: number;
      implication: number;
      needPayoff: number;
    };
  };
  
  spinScore: {
    overall: number;
  };
  status: 'Aprovado' | 'Reprovado' | 'Em Análise';
}
