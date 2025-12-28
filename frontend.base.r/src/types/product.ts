export interface HeroConfig {
    title: string;
    description: string;
    gradient: string;
    primaryBtn: string;
    secondaryBtn: string;
  }
  
  export interface InnovationConfig {
    title: string;
    bullets: string[];
  }
  
  export interface SolutionTab {
    id: string;
    label: string;
  }
  
  export interface SolutionsConfig {
    title: string;
    tabs: SolutionTab[];
  }
  
  export interface ProductConfig {
    hero: HeroConfig;
    innovation: InnovationConfig;
    solutions: SolutionsConfig;
  }
  
  export type ProductKey = 'standart-1c' | 'standart-IFRS' | 'stable-ERP';