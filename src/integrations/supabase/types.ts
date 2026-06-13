export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          ai_message_id: string | null
          created_at: string
          id: string
          owner_id: string
          parts: Json
          role: string
          thread_id: string
        }
        Insert: {
          ai_message_id?: string | null
          created_at?: string
          id?: string
          owner_id: string
          parts?: Json
          role: string
          thread_id: string
        }
        Update: {
          ai_message_id?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          parts?: Json
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          game_id: string
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          owner_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      desktop_build_agents: {
        Row: {
          created_at: string
          godot_version: string
          id: string
          last_seen_at: string | null
          name: string
          owner_id: string
          status: string
          supported_platforms: string[]
          token_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          godot_version?: string
          id?: string
          last_seen_at?: string | null
          name: string
          owner_id: string
          status?: string
          supported_platforms?: string[]
          token_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          godot_version?: string
          id?: string
          last_seen_at?: string | null
          name?: string
          owner_id?: string
          status?: string
          supported_platforms?: string[]
          token_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      desktop_build_artifacts: {
        Row: {
          artifact_type: string
          checksum_sha256: string
          created_at: string
          file_name: string
          file_size: number
          game_id: string
          id: string
          installation_instructions: string
          job_id: string
          owner_id: string
          platform: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          artifact_type: string
          checksum_sha256: string
          created_at?: string
          file_name: string
          file_size: number
          game_id: string
          id?: string
          installation_instructions?: string
          job_id: string
          owner_id: string
          platform: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          artifact_type?: string
          checksum_sha256?: string
          created_at?: string
          file_name?: string
          file_size?: number
          game_id?: string
          id?: string
          installation_instructions?: string
          job_id?: string
          owner_id?: string
          platform?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "desktop_build_artifacts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desktop_build_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "desktop_build_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      desktop_build_jobs: {
        Row: {
          agent_id: string | null
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          error_message: string
          game_id: string
          id: string
          known_issues: string
          logs: string
          minimum_requirements: string
          owner_id: string
          package_type: string
          platform: string
          progress_percent: number
          progress_stage: string
          recommended_requirements: string
          release_notes: string
          status: string
          updated_at: string
          verification_results: Json
          version: string
        }
        Insert: {
          agent_id?: string | null
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string
          game_id: string
          id?: string
          known_issues?: string
          logs?: string
          minimum_requirements?: string
          owner_id: string
          package_type: string
          platform: string
          progress_percent?: number
          progress_stage?: string
          recommended_requirements?: string
          release_notes?: string
          status?: string
          updated_at?: string
          verification_results?: Json
          version?: string
        }
        Update: {
          agent_id?: string | null
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string
          game_id?: string
          id?: string
          known_issues?: string
          logs?: string
          minimum_requirements?: string
          owner_id?: string
          package_type?: string
          platform?: string
          progress_percent?: number
          progress_stage?: string
          recommended_requirements?: string
          release_notes?: string
          status?: string
          updated_at?: string
          verification_results?: Json
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "desktop_build_jobs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "desktop_build_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desktop_build_jobs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      development_stages: {
        Row: {
          created_at: string
          deliverables: string[]
          dependencies: string[]
          game_id: string
          id: string
          owner_id: string
          position: number
          stage_key: string
          status: string
          test_summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deliverables?: string[]
          dependencies?: string[]
          game_id: string
          id?: string
          owner_id: string
          position: number
          stage_key: string
          status?: string
          test_summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deliverables?: string[]
          dependencies?: string[]
          game_id?: string
          id?: string
          owner_id?: string
          position?: number
          stage_key?: string
          status?: string
          test_summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_stages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          art_style: string
          created_at: string
          description: string
          genre: string
          id: string
          monetization: string
          name: string
          owner_id: string
          platform: string
          player_mode: string
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          art_style: string
          created_at?: string
          description?: string
          genre: string
          id?: string
          monetization?: string
          name: string
          owner_id: string
          platform: string
          player_mode: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          art_style?: string
          created_at?: string
          description?: string
          genre?: string
          id?: string
          monetization?: string
          name?: string
          owner_id?: string
          platform?: string
          player_mode?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          display_name: string
          id: string
          plan: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string
          id: string
          plan?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string
          id?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_checkpoints: {
        Row: {
          created_at: string
          file_manifest: Json
          game_id: string
          id: string
          label: string
          owner_id: string
          stage_key: string
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_manifest?: Json
          game_id: string
          id?: string
          label: string
          owner_id: string
          stage_key?: string
          summary?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_manifest?: Json
          game_id?: string
          id?: string
          label?: string
          owner_id?: string
          stage_key?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_checkpoints_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          content: string
          created_at: string
          game_id: string
          id: string
          language: string
          owner_id: string
          path: string
          updated_at: string
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          game_id: string
          id?: string
          language?: string
          owner_id: string
          path: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          game_id?: string
          id?: string
          language?: string
          owner_id?: string
          path?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_files_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      tripo_tasks: {
        Row: {
          created_at: string
          external_task_id: string
          id: string
          owner_id: string
          prompt: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_task_id: string
          id?: string
          owner_id: string
          prompt?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_task_id?: string
          id?: string
          owner_id?: string
          prompt?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_desktop_build_job: {
        Args: { _agent_id: string }
        Returns: {
          agent_id: string | null
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          error_message: string
          game_id: string
          id: string
          known_issues: string
          logs: string
          minimum_requirements: string
          owner_id: string
          package_type: string
          platform: string
          progress_percent: number
          progress_stage: string
          recommended_requirements: string
          release_notes: string
          status: string
          updated_at: string
          verification_results: Json
          version: string
        }[]
        SetofOptions: {
          from: "*"
          to: "desktop_build_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      consume_creator_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refund_creator_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "moderator", "user"],
    },
  },
} as const
