export interface Product {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  tags?: string[];
  is_active?: boolean;
  hero_section?: any;
  features_section?: any;
  modules_section?: any;
}

export interface HeroConfig {
    title: string;
    description: string;
    gradient: string;
    photo: string;
    primaryBtn?: string;
    secondaryBtn?: string;
  }
  
  export interface InnovationConfig {
    title: string;
    bullets: string[];
    videoId: string;
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