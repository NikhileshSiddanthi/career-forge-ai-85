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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      career_roles: {
        Row: {
          category: Database["public"]["Enums"]["career_category"]
          created_at: string | null
          day_in_life: string | null
          demand_level: string | null
          description: string
          growth_outlook: string | null
          id: string
          salary_max_inr: number | null
          salary_min_inr: number | null
          slug: string
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["career_category"]
          created_at?: string | null
          day_in_life?: string | null
          demand_level?: string | null
          description: string
          growth_outlook?: string | null
          id?: string
          salary_max_inr?: number | null
          salary_min_inr?: number | null
          slug: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["career_category"]
          created_at?: string | null
          day_in_life?: string | null
          demand_level?: string | null
          description?: string
          growth_outlook?: string | null
          id?: string
          salary_max_inr?: number | null
          salary_min_inr?: number | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          id: string
          issued_at: string
          learning_path_id: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          id?: string
          issued_at?: string
          learning_path_id: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          id?: string
          issued_at?: string
          learning_path_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          interview_difficulty: string | null
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          interview_difficulty?: string | null
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          interview_difficulty?: string | null
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          learning_path_id: string
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          learning_path_id: string
          order_index?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          learning_path_id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          created_at: string
          difficulty: string | null
          id: string
          question: string
          question_type: string | null
          round_id: string
          sample_answer: string | null
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          id?: string
          question: string
          question_type?: string | null
          round_id: string
          sample_answer?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          id?: string
          question?: string
          question_type?: string | null
          round_id?: string
          sample_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "interview_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_rounds: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          role_id: string
          round_name: string
          round_number: number
          tips: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          role_id: string
          round_name: string
          round_number: number
          tips?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          role_id?: string
          round_name?: string
          round_number?: number
          tips?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_rounds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_rounds_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          role_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          role_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          role_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          estimated_minutes: number | null
          id: string
          lesson_type: string | null
          order_index: number
          title: string
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          lesson_type?: string | null
          order_index?: number
          title: string
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          lesson_type?: string | null
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          experience_level: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          career_goals: string[] | null
          completed_at: string | null
          education_level: string | null
          existing_role: string | null
          experience_years: number | null
          id: string
          interest_areas: string[] | null
          learning_time_weekly: number | null
          preferred_work_style: string | null
          user_id: string
        }
        Insert: {
          career_goals?: string[] | null
          completed_at?: string | null
          education_level?: string | null
          existing_role?: string | null
          experience_years?: number | null
          id?: string
          interest_areas?: string[] | null
          learning_time_weekly?: number | null
          preferred_work_style?: string | null
          user_id: string
        }
        Update: {
          career_goals?: string[] | null
          completed_at?: string | null
          education_level?: string | null
          existing_role?: string | null
          experience_years?: number | null
          id?: string
          interest_areas?: string[] | null
          learning_time_weekly?: number | null
          preferred_work_style?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_simulations: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          scenario: string
          steps: Json
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          scenario: string
          steps: Json
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          scenario?: string
          steps?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_simulations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_skills: {
        Row: {
          id: string
          importance: string | null
          role_id: string
          skill_id: string
        }
        Insert: {
          id?: string
          importance?: string | null
          role_id: string
          skill_id: string
        }
        Update: {
          id?: string
          importance?: string | null
          role_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_skills_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_career_paths: {
        Row: {
          id: string
          phase: string | null
          role_id: string
          selected_at: string
          user_id: string
        }
        Insert: {
          id?: string
          phase?: string | null
          role_id: string
          selected_at?: string
          user_id: string
        }
        Update: {
          id?: string
          phase?: string | null
          role_id?: string
          selected_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_career_paths_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_completed_lessons: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_completed_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interview_progress: {
        Row: {
          company_id: string
          completed_at: string | null
          current_round: number | null
          id: string
          role_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          current_round?: number | null
          id?: string
          role_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          current_round?: number | null
          id?: string
          role_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interview_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interview_progress_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_progress: {
        Row: {
          completed_at: string | null
          current_course_id: string | null
          current_lesson_id: string | null
          id: string
          learning_path_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_course_id?: string | null
          current_lesson_id?: string | null
          id?: string
          learning_path_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_course_id?: string | null
          current_lesson_id?: string | null
          id?: string
          learning_path_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_progress_current_course_id_fkey"
            columns: ["current_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_progress_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_progress_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_simulation_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          id: string
          score: number | null
          simulation_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          score?: number | null
          simulation_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          score?: number | null
          simulation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_simulation_progress_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "role_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          created_at: string | null
          id: string
          proficiency: number | null
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency?: number | null
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency?: number | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "mentor" | "student"
      career_category: "engineering" | "data" | "design" | "product"
      skill_category:
        | "language"
        | "framework"
        | "tool"
        | "concept"
        | "soft_skill"
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
      app_role: ["admin", "mentor", "student"],
      career_category: ["engineering", "data", "design", "product"],
      skill_category: [
        "language",
        "framework",
        "tool",
        "concept",
        "soft_skill",
      ],
    },
  },
} as const
