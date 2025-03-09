export interface RulesConfig {
  topN: number;
  totalPool: number;
  minPayout: number;
  minMods: number;
  vector: {
    views: number;
    likes: number;
    replies: number;
  };
}
