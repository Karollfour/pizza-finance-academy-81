export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      compras: {
        Row: {
          created_at: string
          descricao: string | null
          equipe_id: string
          id: string
          produto_id: string | null
          quantidade: number | null
          rodada_id: string | null
          tipo: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          equipe_id: string
          id?: string
          produto_id?: string | null
          quantidade?: number | null
          rodada_id?: string | null
          tipo: string
          valor_total: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          equipe_id?: string
          id?: string
          produto_id?: string | null
          quantidade?: number | null
          rodada_id?: string | null
          tipo?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_loja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_rodada_id_fkey"
            columns: ["rodada_id"]
            isOneToOne: false
            referencedRelation: "rodadas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          descricao: string | null
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      equipes: {
        Row: {
          created_at: string
          gasto_total: number
          id: string
          nome: string
          professor_responsavel: string | null
          saldo_inicial: number
        }
        Insert: {
          created_at?: string
          gasto_total?: number
          id?: string
          nome: string
          professor_responsavel?: string | null
          saldo_inicial?: number
        }
        Update: {
          created_at?: string
          gasto_total?: number
          id?: string
          nome?: string
          professor_responsavel?: string | null
          saldo_inicial?: number
        }
        Relationships: []
      }
      pizzas: {
        Row: {
          avaliado_por: string | null
          created_at: string
          equipe_id: string
          id: string
          justificativa_reprovacao: string | null
          resultado: string | null
          rodada_id: string
          status: string
          tempo_producao_segundos: number | null
          updated_at: string
        }
        Insert: {
          avaliado_por?: string | null
          created_at?: string
          equipe_id: string
          id?: string
          justificativa_reprovacao?: string | null
          resultado?: string | null
          rodada_id: string
          status?: string
          tempo_producao_segundos?: number | null
          updated_at?: string
        }
        Update: {
          avaliado_por?: string | null
          created_at?: string
          equipe_id?: string
          id?: string
          justificativa_reprovacao?: string | null
          resultado?: string | null
          rodada_id?: string
          status?: string
          tempo_producao_segundos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizzas_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizzas_rodada_id_fkey"
            columns: ["rodada_id"]
            isOneToOne: false
            referencedRelation: "rodadas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_loja: {
        Row: {
          created_at: string
          disponivel: boolean
          id: string
          nome: string
          unidade: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          disponivel?: boolean
          id?: string
          nome: string
          unidade: string
          valor_unitario: number
        }
        Update: {
          created_at?: string
          disponivel?: boolean
          id?: string
          nome?: string
          unidade?: string
          valor_unitario?: number
        }
        Relationships: []
      }
      rodadas: {
        Row: {
          created_at: string
          finalizou_em: string | null
          id: string
          iniciou_em: string | null
          numero: number
          status: string
          tempo_limite: number
        }
        Insert: {
          created_at?: string
          finalizou_em?: string | null
          id?: string
          iniciou_em?: string | null
          numero: number
          status?: string
          tempo_limite?: number
        }
        Update: {
          created_at?: string
          finalizou_em?: string | null
          id?: string
          iniciou_em?: string | null
          numero?: number
          status?: string
          tempo_limite?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
