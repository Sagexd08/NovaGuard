export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          subscription_tier: 'free' | 'pro' | 'enterprise'
          credits_remaining: number
          total_audits: number
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          credits_remaining?: number
          total_audits?: number
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          credits_remaining?: number
          total_audits?: number
        }
      }
      contracts: {
        Row: {
          id: string
          user_id: string
          name: string
          address: string
          chain: string
          source_code: string | null
          abi: Json | null
          bytecode: string | null
          verified: boolean
          created_at: string
          updated_at: string
          deployment_tx: string | null
          compiler_version: string | null
          optimization_enabled: boolean | null
          optimization_runs: number | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          address: string
          chain: string
          source_code?: string | null
          abi?: Json | null
          bytecode?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
          deployment_tx?: string | null
          compiler_version?: string | null
          optimization_enabled?: boolean | null
          optimization_runs?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          address?: string
          chain?: string
          source_code?: string | null
          abi?: Json | null
          bytecode?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
          deployment_tx?: string | null
          compiler_version?: string | null
          optimization_enabled?: boolean | null
          optimization_runs?: number | null
        }
      }
      audits: {
        Row: {
          id: string
          user_id: string
          contract_id: string
          audit_type: 'security' | 'gas' | 'comprehensive'
          status: 'pending' | 'running' | 'completed' | 'failed'
          results: Json | null
          vulnerabilities_found: number
          security_score: number | null
          gas_optimization_score: number | null
          created_at: string
          completed_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          contract_id: string
          audit_type: 'security' | 'gas' | 'comprehensive'
          status?: 'pending' | 'running' | 'completed' | 'failed'
          results?: Json | null
          vulnerabilities_found?: number
          security_score?: number | null
          gas_optimization_score?: number | null
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          contract_id?: string
          audit_type?: 'security' | 'gas' | 'comprehensive'
          status?: 'pending' | 'running' | 'completed' | 'failed'
          results?: Json | null
          vulnerabilities_found?: number
          security_score?: number | null
          gas_optimization_score?: number | null
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
        }
      }
      vulnerabilities: {
        Row: {
          id: string
          audit_id: string
          name: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          description: string
          location: string | null
          line_numbers: number[] | null
          fix_suggestion: string | null
          confidence: number
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          name: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          description: string
          location?: string | null
          line_numbers?: number[] | null
          fix_suggestion?: string | null
          confidence: number
          created_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          name?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          description?: string
          location?: string | null
          line_numbers?: number[] | null
          fix_suggestion?: string | null
          confidence?: number
          created_at?: string
        }
      }
      gas_optimizations: {
        Row: {
          id: string
          audit_id: string
          optimization_type: string
          description: string
          location: string | null
          line_numbers: number[] | null
          gas_saved: number | null
          implementation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          optimization_type: string
          description: string
          location?: string | null
          line_numbers?: number[] | null
          gas_saved?: number | null
          implementation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          optimization_type?: string
          description?: string
          location?: string | null
          line_numbers?: number[] | null
          gas_saved?: number | null
          implementation?: string | null
          created_at?: string
        }
      }
      plugins: {
        Row: {
          id: string
          name: string
          version: string
          description: string
          author: string
          manifest: Json
          active: boolean
          install_count: number
          rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          version: string
          description: string
          author: string
          manifest: Json
          active?: boolean
          install_count?: number
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          version?: string
          description?: string
          author?: string
          manifest?: Json
          active?: boolean
          install_count?: number
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_plugins: {
        Row: {
          id: string
          user_id: string
          plugin_id: string
          active: boolean
          settings: Json | null
          installed_at: string
          last_used: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plugin_id: string
          active?: boolean
          settings?: Json | null
          installed_at?: string
          last_used?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plugin_id?: string
          active?: boolean
          settings?: Json | null
          installed_at?: string
          last_used?: string | null
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          permissions: string[]
          last_used: string | null
          expires_at: string | null
          created_at: string
          revoked: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          permissions: string[]
          last_used?: string | null
          expires_at?: string | null
          created_at?: string
          revoked?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          permissions?: string[]
          last_used?: string | null
          expires_at?: string | null
          created_at?: string
          revoked?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'pro' | 'enterprise'
      audit_status: 'pending' | 'running' | 'completed' | 'failed'
      audit_type: 'security' | 'gas' | 'comprehensive'
      severity_level: 'low' | 'medium' | 'high' | 'critical'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
