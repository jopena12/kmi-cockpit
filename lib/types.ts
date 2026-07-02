export type Period = '7j' | '30j' | '12m';

export interface Plan {
  name: string;
  price: number;
  count: number;
}

export interface SaasApp {
  id: string;
  name: string;
  slug: string;
  accentColor: string;
  tagline: string | null;
  category: string | null;
  featuredPlan: string | null;
}

export interface Snapshot {
  date: string; // yyyy-mm-dd
  mrr: number;
  subscribersTotal: number;
  subscribersByPlan: Plan[];
  newSubscribers: number;
  churnedSubscribers: number;
  currency: string;
}
