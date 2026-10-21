export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      anamneses: {
        Row: {
          altura_cm: number;
          braco_cm: number | null;
          cintura_cm: number | null;
          coxa_cm: number | null;
          criado_em: string;
          dias_disponiveis: number;
          id: string;
          idade: number;
          lesoes: string | null;
          local_treino: string;
          meta_peso_kg: number | null;
          meta_prazo: string | null;
          nivel: string;
          objetivo: string;
          observacoes: string | null;
          peito_cm: number | null;
          pescoco_cm: number | null;
          peso_inicial_kg: number;
          quadril_cm: number | null;
          sexo: string | null;
          user_id: string;
          versao: number;
        };
        ComputedFields: never;
        Insert: {
          altura_cm: number;
          braco_cm?: number | null;
          cintura_cm?: number | null;
          coxa_cm?: number | null;
          criado_em?: string;
          dias_disponiveis: number;
          id?: string;
          idade: number;
          lesoes?: string | null;
          local_treino: string;
          meta_peso_kg?: number | null;
          meta_prazo?: string | null;
          nivel: string;
          objetivo: string;
          observacoes?: string | null;
          peito_cm?: number | null;
          pescoco_cm?: number | null;
          peso_inicial_kg: number;
          quadril_cm?: number | null;
          sexo?: string | null;
          user_id?: string;
          versao: number;
        };
        Update: {
          altura_cm?: number;
          braco_cm?: number | null;
          cintura_cm?: number | null;
          coxa_cm?: number | null;
          criado_em?: string;
          dias_disponiveis?: number;
          id?: string;
          idade?: number;
          lesoes?: string | null;
          local_treino?: string;
          meta_peso_kg?: number | null;
          meta_prazo?: string | null;
          nivel?: string;
          objetivo?: string;
          observacoes?: string | null;
          peito_cm?: number | null;
          pescoco_cm?: number | null;
          peso_inicial_kg?: number;
          quadril_cm?: number | null;
          sexo?: string | null;
          user_id?: string;
          versao?: number;
        };
        Relationships: [];
      };
      config_ia: {
        Row: {
          atualizado_em: string;
          claude_key_secret_id: string | null;
          gemini_key_secret_id: string | null;
          modelo_padrao: string;
          provedor_padrao: Database["public"]["Enums"]["provedor_ia"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          atualizado_em?: string;
          claude_key_secret_id?: string | null;
          gemini_key_secret_id?: string | null;
          modelo_padrao: string;
          provedor_padrao?: Database["public"]["Enums"]["provedor_ia"];
          user_id?: string;
        };
        Update: {
          atualizado_em?: string;
          claude_key_secret_id?: string | null;
          gemini_key_secret_id?: string | null;
          modelo_padrao?: string;
          provedor_padrao?: Database["public"]["Enums"]["provedor_ia"];
          user_id?: string;
        };
        Relationships: [];
      };
      exercicios: {
        Row: {
          criado_em: string;
          dica_casa: string | null;
          equipamento: string | null;
          grupo_muscular: string;
          id: string;
          imagem_url: string | null;
          nome: string;
          origem: Database["public"]["Enums"]["origem_exercicio"];
          user_id: string | null;
          youtube_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          criado_em?: string;
          dica_casa?: string | null;
          equipamento?: string | null;
          grupo_muscular: string;
          id?: string;
          imagem_url?: string | null;
          nome: string;
          origem?: Database["public"]["Enums"]["origem_exercicio"];
          user_id?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          criado_em?: string;
          dica_casa?: string | null;
          equipamento?: string | null;
          grupo_muscular?: string;
          id?: string;
          imagem_url?: string | null;
          nome?: string;
          origem?: Database["public"]["Enums"]["origem_exercicio"];
          user_id?: string | null;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      fotos_progresso: {
        Row: {
          criado_em: string;
          id: string;
          registrado_em: string;
          storage_path: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          criado_em?: string;
          id?: string;
          registrado_em?: string;
          storage_path: string;
          user_id?: string;
        };
        Update: {
          criado_em?: string;
          id?: string;
          registrado_em?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      geracoes_ia: {
        Row: {
          criado_em: string;
          erro: string | null;
          id: string;
          modelo: string;
          prompt_enviado: NonNullable<Json>;
          provedor: Database["public"]["Enums"]["provedor_ia"];
          resposta_bruta: Json | null;
          sucesso: boolean;
          tipo_acao: string;
          tokens_entrada: number | null;
          tokens_saida: number | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          criado_em?: string;
          erro?: string | null;
          id?: string;
          modelo: string;
          prompt_enviado: NonNullable<Json>;
          provedor: Database["public"]["Enums"]["provedor_ia"];
          resposta_bruta?: Json | null;
          sucesso: boolean;
          tipo_acao: string;
          tokens_entrada?: number | null;
          tokens_saida?: number | null;
          user_id?: string;
        };
        Update: {
          criado_em?: string;
          erro?: string | null;
          id?: string;
          modelo?: string;
          prompt_enviado?: NonNullable<Json>;
          provedor?: Database["public"]["Enums"]["provedor_ia"];
          resposta_bruta?: Json | null;
          sucesso?: boolean;
          tipo_acao?: string;
          tokens_entrada?: number | null;
          tokens_saida?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      medidas: {
        Row: {
          braco_cm: number | null;
          cintura_cm: number | null;
          id: string;
          outras: Json | null;
          peito_cm: number | null;
          peso_kg: number | null;
          registrado_em: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          braco_cm?: number | null;
          cintura_cm?: number | null;
          id?: string;
          outras?: Json | null;
          peito_cm?: number | null;
          peso_kg?: number | null;
          registrado_em?: string;
          user_id?: string;
        };
        Update: {
          braco_cm?: number | null;
          cintura_cm?: number | null;
          id?: string;
          outras?: Json | null;
          peito_cm?: number | null;
          peso_kg?: number | null;
          registrado_em?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      perfis: {
        Row: {
          cargo: Database["public"]["Enums"]["cargo_usuario"];
          criado_em: string;
          data_nascimento: string | null;
          email: string;
          nome: string | null;
          telefone: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cargo?: Database["public"]["Enums"]["cargo_usuario"];
          criado_em?: string;
          data_nascimento?: string | null;
          email: string;
          nome?: string | null;
          telefone?: string | null;
          user_id: string;
        };
        Update: {
          cargo?: Database["public"]["Enums"]["cargo_usuario"];
          criado_em?: string;
          data_nascimento?: string | null;
          email?: string;
          nome?: string | null;
          telefone?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      sessao_series: {
        Row: {
          carga_real_kg: number | null;
          concluida_em: string;
          exercicio_realizado_id: string | null;
          id: string;
          numero_serie: number;
          origem_offline: boolean;
          repeticoes_real: number | null;
          rpe: number | null;
          sessao_id: string;
          treino_exercicio_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          carga_real_kg?: number | null;
          concluida_em?: string;
          exercicio_realizado_id?: string | null;
          id?: string;
          numero_serie: number;
          origem_offline?: boolean;
          repeticoes_real?: number | null;
          rpe?: number | null;
          sessao_id: string;
          treino_exercicio_id?: string | null;
          user_id?: string;
        };
        Update: {
          carga_real_kg?: number | null;
          concluida_em?: string;
          exercicio_realizado_id?: string | null;
          id?: string;
          numero_serie?: number;
          origem_offline?: boolean;
          repeticoes_real?: number | null;
          rpe?: number | null;
          sessao_id?: string;
          treino_exercicio_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessao_series_exercicio_realizado_id_fkey";
            columns: ["exercicio_realizado_id"];
            isOneToOne: false;
            referencedRelation: "exercicios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessao_series_sessao_id_fkey";
            columns: ["sessao_id"];
            isOneToOne: false;
            referencedRelation: "sessoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessao_series_treino_exercicio_id_fkey";
            columns: ["treino_exercicio_id"];
            isOneToOne: false;
            referencedRelation: "treino_exercicios";
            referencedColumns: ["id"];
          },
        ];
      };
      sessoes: {
        Row: {
          dor: string | null;
          duracao_segundos: number | null;
          energia: number | null;
          finalizada_em: string | null;
          id: string;
          iniciada_em: string;
          notas: string | null;
          sono: number | null;
          treino_dia_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          dor?: string | null;
          duracao_segundos?: number | null;
          energia?: number | null;
          finalizada_em?: string | null;
          id?: string;
          iniciada_em?: string;
          notas?: string | null;
          sono?: number | null;
          treino_dia_id?: string | null;
          user_id?: string;
        };
        Update: {
          dor?: string | null;
          duracao_segundos?: number | null;
          energia?: number | null;
          finalizada_em?: string | null;
          id?: string;
          iniciada_em?: string;
          notas?: string | null;
          sono?: number | null;
          treino_dia_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessoes_treino_dia_id_fkey";
            columns: ["treino_dia_id"];
            isOneToOne: false;
            referencedRelation: "treino_dias";
            referencedColumns: ["id"];
          },
        ];
      };
      treino_dias: {
        Row: {
          grupos_musculares: string[];
          id: string;
          nome: string;
          ordem: number;
          treino_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          grupos_musculares?: string[];
          id?: string;
          nome: string;
          ordem: number;
          treino_id: string;
          user_id?: string;
        };
        Update: {
          grupos_musculares?: string[];
          id?: string;
          nome?: string;
          ordem?: number;
          treino_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treino_dias_treino_id_fkey";
            columns: ["treino_id"];
            isOneToOne: false;
            referencedRelation: "treinos";
            referencedColumns: ["id"];
          },
        ];
      };
      treino_exercicio_alternativas: {
        Row: {
          exercicio_id: string;
          id: string;
          ordem: number;
          treino_exercicio_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          exercicio_id: string;
          id?: string;
          ordem: number;
          treino_exercicio_id: string;
          user_id?: string;
        };
        Update: {
          exercicio_id?: string;
          id?: string;
          ordem?: number;
          treino_exercicio_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treino_exercicio_alternativas_exercicio_id_fkey";
            columns: ["exercicio_id"];
            isOneToOne: false;
            referencedRelation: "exercicios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treino_exercicio_alternativas_treino_exercicio_id_fkey";
            columns: ["treino_exercicio_id"];
            isOneToOne: false;
            referencedRelation: "treino_exercicios";
            referencedColumns: ["id"];
          },
        ];
      };
      treino_exercicios: {
        Row: {
          carga_sugerida_kg: number | null;
          descanso_segundos: number;
          exercicio_id: string | null;
          id: string;
          metodo: Database["public"]["Enums"]["metodo_serie"];
          nome_exercicio_sugerido: string | null;
          observacao: string | null;
          ordem: number;
          repeticoes_max: number;
          repeticoes_min: number;
          series: number;
          treino_dia_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          carga_sugerida_kg?: number | null;
          descanso_segundos?: number;
          exercicio_id?: string | null;
          id?: string;
          metodo?: Database["public"]["Enums"]["metodo_serie"];
          nome_exercicio_sugerido?: string | null;
          observacao?: string | null;
          ordem: number;
          repeticoes_max: number;
          repeticoes_min: number;
          series: number;
          treino_dia_id: string;
          user_id?: string;
        };
        Update: {
          carga_sugerida_kg?: number | null;
          descanso_segundos?: number;
          exercicio_id?: string | null;
          id?: string;
          metodo?: Database["public"]["Enums"]["metodo_serie"];
          nome_exercicio_sugerido?: string | null;
          observacao?: string | null;
          ordem?: number;
          repeticoes_max?: number;
          repeticoes_min?: number;
          series?: number;
          treino_dia_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treino_exercicios_exercicio_id_fkey";
            columns: ["exercicio_id"];
            isOneToOne: false;
            referencedRelation: "exercicios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treino_exercicios_treino_dia_id_fkey";
            columns: ["treino_dia_id"];
            isOneToOne: false;
            referencedRelation: "treino_dias";
            referencedColumns: ["id"];
          },
        ];
      };
      treinos: {
        Row: {
          arquivado_em: string | null;
          criado_em: string;
          duracao_semanas: number;
          geracao_ia_id: string | null;
          id: string;
          justificativa_ia: string | null;
          nome_ciclo: string;
          origem: Database["public"]["Enums"]["origem_treino"];
          status: Database["public"]["Enums"]["status_treino"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          arquivado_em?: string | null;
          criado_em?: string;
          duracao_semanas?: number;
          geracao_ia_id?: string | null;
          id?: string;
          justificativa_ia?: string | null;
          nome_ciclo: string;
          origem: Database["public"]["Enums"]["origem_treino"];
          status?: Database["public"]["Enums"]["status_treino"];
          user_id?: string;
        };
        Update: {
          arquivado_em?: string | null;
          criado_em?: string;
          duracao_semanas?: number;
          geracao_ia_id?: string | null;
          id?: string;
          justificativa_ia?: string | null;
          nome_ciclo?: string;
          origem?: Database["public"]["Enums"]["origem_treino"];
          status?: Database["public"]["Enums"]["status_treino"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treinos_geracao_ia_fk";
            columns: ["geracao_ia_id"];
            isOneToOne: false;
            referencedRelation: "geracoes_ia";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      anamnese_atual: {
        Row: {
          altura_cm: number | null;
          braco_cm: number | null;
          cintura_cm: number | null;
          coxa_cm: number | null;
          criado_em: string | null;
          dias_disponiveis: number | null;
          id: string | null;
          idade: number | null;
          lesoes: string | null;
          local_treino: string | null;
          meta_peso_kg: number | null;
          meta_prazo: string | null;
          nivel: string | null;
          objetivo: string | null;
          observacoes: string | null;
          peito_cm: number | null;
          pescoco_cm: number | null;
          peso_inicial_kg: number | null;
          quadril_cm: number | null;
          sexo: string | null;
          user_id: string | null;
          versao: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      atualizar_dica_casa: { Args: { p_dica: string; p_exercicio_id: string }; Returns: undefined };
      sou_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      vault_get_ai_key: {
        Args: { p_provedor: Database["public"]["Enums"]["provedor_ia"] };
        Returns: string;
      };
      vault_set_ai_key: {
        Args: { p_chave: string; p_provedor: Database["public"]["Enums"]["provedor_ia"] };
        Returns: undefined;
      };
    };
    Enums: {
      cargo_usuario: "admin" | "professor" | "aluno";
      metodo_serie: "normal" | "biset" | "drop_set" | "rest_pause" | "piramide";
      origem_exercicio: "base" | "usuario";
      origem_treino: "manual" | "claude" | "gemini";
      provedor_ia: "claude" | "gemini";
      status_treino: "ativo" | "arquivado" | "rascunho_ia";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cargo_usuario: ["admin", "professor", "aluno"],
      metodo_serie: ["normal", "biset", "drop_set", "rest_pause", "piramide"],
      origem_exercicio: ["base", "usuario"],
      origem_treino: ["manual", "claude", "gemini"],
      provedor_ia: ["claude", "gemini"],
      status_treino: ["ativo", "arquivado", "rascunho_ia"],
    },
  },
} as const;
