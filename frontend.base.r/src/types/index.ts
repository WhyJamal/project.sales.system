
// User
export interface Subscription {
  plan_name: string;  
}

export interface OrganizationProduct {
  id: number;
  title: string;
  product_url: string;
  product_id: number;
  order: number;
  chosen: boolean;
  product_name: string;
  subscription: Subscription;
  subscription_end_date: string;
}

export interface Organization {
  id: number;
  name: string;
  inn?: string;
  address?: string;
  products: OrganizationProduct[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone_number?: string;
  bio?: string;
  avatar_url?: string | null;
  organization?: Organization | null;
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
  demo_url?: string;
  plans: Plan[];
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

export interface OrganizationSubscriptionDTO {
  id: number;
  organization?: Organization | null;
  plan?: Plan | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
  [key: string]: any;
}