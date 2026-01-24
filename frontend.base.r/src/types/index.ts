
// User
export interface User {
  id: number;
  username: string;
  email: string;
  phone_number?: string;
  bio?: string;
  organization_name?: string;
  organization_inn?: number;
  organization_url?: string;
}

// Product
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
  hero_section_image_url?: any;
  features_section_videoID?: any;
  modules_section?: any;
}

// Plan
export interface Plan {
  id: number;
  name: string;
  description?: string; 
  price: number;
  period?: string;      
  features?: Record<string, boolean>;  
  is_default: boolean;
  is_active: boolean;
  highlight: boolean;
}

// PlanFeature
export interface PlanFeature {
  id: number;
  category: string;
  name: string;
  starter: boolean | string;
  growth: boolean | string;
  scale: boolean | string;
}