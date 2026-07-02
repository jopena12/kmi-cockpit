export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string;
          id: string;
          key_hash: string;
          saas_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key_hash: string;
          saas_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          key_hash?: string;
          saas_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_saas_id_fkey';
            columns: ['saas_id'];
            isOneToOne: false;
            referencedRelation: 'saas_apps';
            referencedColumns: ['id'];
          },
        ];
      };
      metrics_snapshots: {
        Row: {
          churned_subscribers: number;
          created_at: string;
          currency: string;
          id: string;
          mrr: number;
          new_subscribers: number;
          saas_id: string;
          snapshot_date: string;
          subscribers_by_plan: Json;
          subscribers_total: number;
        };
        Insert: {
          churned_subscribers?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          mrr: number;
          new_subscribers?: number;
          saas_id: string;
          snapshot_date: string;
          subscribers_by_plan?: Json;
          subscribers_total: number;
        };
        Update: {
          churned_subscribers?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          mrr?: number;
          new_subscribers?: number;
          saas_id?: string;
          snapshot_date?: string;
          subscribers_by_plan?: Json;
          subscribers_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'metrics_snapshots_saas_id_fkey';
            columns: ['saas_id'];
            isOneToOne: false;
            referencedRelation: 'saas_apps';
            referencedColumns: ['id'];
          },
        ];
      };
      saas_apps: {
        Row: {
          accent_color: string;
          category: string | null;
          created_at: string;
          featured_plan: string | null;
          id: string;
          name: string;
          slug: string;
          tagline: string | null;
        };
        Insert: {
          accent_color: string;
          category?: string | null;
          created_at?: string;
          featured_plan?: string | null;
          id?: string;
          name: string;
          slug: string;
          tagline?: string | null;
        };
        Update: {
          accent_color?: string;
          category?: string | null;
          created_at?: string;
          featured_plan?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          tagline?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database['public'];

export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Update'];
