export interface Call {
  id: string;
  sdrId: string;
  sdrName: string;
  clientName: string;
  date: string;
  score: number;
  duration: string;
  route?: 'A' | 'B' | 'C' | 'D';
  main_product?: string;
  objections?: string[];
}

export interface SDR {
  id: string;
  name: string;
  ranking_score: number;
  real_average?: number;
  callCount: number;
}
