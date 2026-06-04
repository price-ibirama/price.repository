export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_members: {
        Row: {
          active: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      auditoria_admin: {
        Row: {
          acao: string
          admin_user_id: string | null
          antes: Json | null
          criado_em: string
          depois: Json | null
          entidade: string
          entidade_id: string | null
          id: string
        }
        Insert: {
          acao: string
          admin_user_id?: string | null
          antes?: Json | null
          criado_em?: string
          depois?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
        }
        Update: {
          acao?: string
          admin_user_id?: string | null
          antes?: Json | null
          criado_em?: string
          depois?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
        }
        Relationships: []
      }
      bairros: {
        Row: {
          criado_em: string | null
          id: string
          id_cidade: string
          nome: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          id_cidade: string
          nome: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          id_cidade?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "bairros_id_cidade_fkey"
            columns: ["id_cidade"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          id: string
          nome: string
          ordem: number | null
          slug: string
        }
        Insert: {
          id?: string
          nome: string
          ordem?: number | null
          slug: string
        }
        Update: {
          id?: string
          nome?: string
          ordem?: number | null
          slug?: string
        }
        Relationships: []
      }
      cidades: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          estado: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          estado?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          estado?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      estabelecimentos: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: string
          id_bairro: string | null
          id_cidade: string
          logradouro: string | null
          nome: string
          tipo: Database["public"]["Enums"]["tipo_estabelecimento"]
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          id_bairro?: string | null
          id_cidade: string
          logradouro?: string | null
          nome: string
          tipo?: Database["public"]["Enums"]["tipo_estabelecimento"]
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          id_bairro?: string | null
          id_cidade?: string
          logradouro?: string | null
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_estabelecimento"]
        }
        Relationships: [
          {
            foreignKeyName: "estabelecimentos_id_bairro_fkey"
            columns: ["id_bairro"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estabelecimentos_id_cidade_fkey"
            columns: ["id_cidade"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      fontes_dados: {
        Row: {
          ativo: boolean
          atualizado_em: string
          config: Json
          criado_em: string
          id: string
          id_estabelecimento: string | null
          nome: string
          tipo: Database["public"]["Enums"]["tipo_fonte_dados"]
          url: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          config?: Json
          criado_em?: string
          id?: string
          id_estabelecimento?: string | null
          nome: string
          tipo?: Database["public"]["Enums"]["tipo_fonte_dados"]
          url?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          config?: Json
          criado_em?: string
          id?: string
          id_estabelecimento?: string | null
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_fonte_dados"]
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fontes_dados_id_estabelecimento_fkey"
            columns: ["id_estabelecimento"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_ingestao: {
        Row: {
          atualizado_em: string
          candidatos: Json
          categoria_sugerida: string | null
          confidence: number | null
          criado_em: string
          embalagem: string | null
          erro: string | null
          fingerprint_origem: string | null
          id: string
          id_lote: string
          id_produto: string | null
          marca: string | null
          nome_normalizado: string | null
          nome_original: string
          observacao: string | null
          preco: number | null
          quantidade: number | null
          raw_payload: Json
          status: Database["public"]["Enums"]["status_item_ingestao"]
          unidade: string | null
          validade_fim: string | null
          validade_inicio: string | null
        }
        Insert: {
          atualizado_em?: string
          candidatos?: Json
          categoria_sugerida?: string | null
          confidence?: number | null
          criado_em?: string
          embalagem?: string | null
          erro?: string | null
          fingerprint_origem?: string | null
          id?: string
          id_lote: string
          id_produto?: string | null
          marca?: string | null
          nome_normalizado?: string | null
          nome_original: string
          observacao?: string | null
          preco?: number | null
          quantidade?: number | null
          raw_payload?: Json
          status?: Database["public"]["Enums"]["status_item_ingestao"]
          unidade?: string | null
          validade_fim?: string | null
          validade_inicio?: string | null
        }
        Update: {
          atualizado_em?: string
          candidatos?: Json
          categoria_sugerida?: string | null
          confidence?: number | null
          criado_em?: string
          embalagem?: string | null
          erro?: string | null
          fingerprint_origem?: string | null
          id?: string
          id_lote?: string
          id_produto?: string | null
          marca?: string | null
          nome_normalizado?: string | null
          nome_original?: string
          observacao?: string | null
          preco?: number | null
          quantidade?: number | null
          raw_payload?: Json
          status?: Database["public"]["Enums"]["status_item_ingestao"]
          unidade?: string | null
          validade_fim?: string | null
          validade_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_ingestao_id_lote_fkey"
            columns: ["id_lote"]
            isOneToOne: false
            referencedRelation: "lotes_ingestao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_ingestao_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      log_intencoes: {
        Row: {
          classificacao: string
          id: string
          id_mensagem_whatsapp: string
          id_usuario: string | null
          mensagem_normalizada: string | null
          mensagem_recebida: string
          recebido_em: string | null
          termo_identificado: string | null
        }
        Insert: {
          classificacao: string
          id?: string
          id_mensagem_whatsapp: string
          id_usuario?: string | null
          mensagem_normalizada?: string | null
          mensagem_recebida: string
          recebido_em?: string | null
          termo_identificado?: string | null
        }
        Update: {
          classificacao?: string
          id?: string
          id_mensagem_whatsapp?: string
          id_usuario?: string | null
          mensagem_normalizada?: string | null
          mensagem_recebida?: string
          recebido_em?: string | null
          termo_identificado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_intencoes_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      log_respostas: {
        Row: {
          id: string
          id_intencao: string
          respondido_em: string | null
          resultados: Json | null
          total_resultados_busca: number | null
        }
        Insert: {
          id?: string
          id_intencao: string
          respondido_em?: string | null
          resultados?: Json | null
          total_resultados_busca?: number | null
        }
        Update: {
          id?: string
          id_intencao?: string
          respondido_em?: string | null
          resultados?: Json | null
          total_resultados_busca?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "log_respostas_id_intencao_fkey"
            columns: ["id_intencao"]
            isOneToOne: false
            referencedRelation: "log_intencoes"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes_ingestao: {
        Row: {
          arquivo_origem: string | null
          atualizado_em: string
          conteudo_original: string | null
          criado_em: string
          criado_por: string | null
          id: string
          id_estabelecimento: string | null
          id_fonte: string | null
          publicado_em: string | null
          publicado_por: string | null
          raw_payload: Json
          revisado_por: string | null
          status: Database["public"]["Enums"]["status_lote_ingestao"]
          total_itens: number
        }
        Insert: {
          arquivo_origem?: string | null
          atualizado_em?: string
          conteudo_original?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_estabelecimento?: string | null
          id_fonte?: string | null
          publicado_em?: string | null
          publicado_por?: string | null
          raw_payload?: Json
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["status_lote_ingestao"]
          total_itens?: number
        }
        Update: {
          arquivo_origem?: string | null
          atualizado_em?: string
          conteudo_original?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_estabelecimento?: string | null
          id_fonte?: string | null
          publicado_em?: string | null
          publicado_por?: string | null
          raw_payload?: Json
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["status_lote_ingestao"]
          total_itens?: number
        }
        Relationships: [
          {
            foreignKeyName: "lotes_ingestao_id_estabelecimento_fkey"
            columns: ["id_estabelecimento"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_ingestao_id_fonte_fkey"
            columns: ["id_fonte"]
            isOneToOne: false
            referencedRelation: "fontes_dados"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          criado_por: string | null
          fingerprint_origem: string | null
          id: string
          id_estabelecimento: string
          id_item_ingestao: string | null
          id_lote_ingestao: string | null
          id_produto: string
          observacao: string | null
          preco: number
          publicado_em: string | null
          status: string
          validade_fim: string | null
          validade_inicio: string | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          fingerprint_origem?: string | null
          id?: string
          id_estabelecimento: string
          id_item_ingestao?: string | null
          id_lote_ingestao?: string | null
          id_produto: string
          observacao?: string | null
          preco: number
          publicado_em?: string | null
          status?: string
          validade_fim?: string | null
          validade_inicio?: string | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          fingerprint_origem?: string | null
          id?: string
          id_estabelecimento?: string
          id_item_ingestao?: string | null
          id_lote_ingestao?: string | null
          id_produto?: string
          observacao?: string | null
          preco?: number
          publicado_em?: string | null
          status?: string
          validade_fim?: string | null
          validade_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_id_estabelecimento_fkey"
            columns: ["id_estabelecimento"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_id_item_ingestao_fkey"
            columns: ["id_item_ingestao"]
            isOneToOne: false
            referencedRelation: "itens_ingestao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_id_lote_ingestao_fkey"
            columns: ["id_lote_ingestao"]
            isOneToOne: false
            referencedRelation: "lotes_ingestao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          criado_em: string | null
          id: string
          id_categoria: string | null
          nome: string
          nome_search: string | null
          unidade: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          id_categoria?: string | null
          nome: string
          nome_search?: string | null
          unidade?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          id_categoria?: string | null
          nome?: string
          nome_search?: string | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      sinonimos: {
        Row: {
          criado_em: string | null
          id: string
          id_produto: string
          termo: string
          termo_search: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          id_produto: string
          termo: string
          termo_search?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          id_produto?: string
          termo?: string
          termo_search?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinonimos_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      termos_busca: {
        Row: {
          aprovado_por: string | null
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          id_categoria: string | null
          id_estabelecimento: string | null
          id_produto: string | null
          marca: string | null
          origem: string
          peso: number
          termo: string
          termo_search: string | null
          tipo_alvo: Database["public"]["Enums"]["tipo_alvo_termo_busca"]
        }
        Insert: {
          aprovado_por?: string | null
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          id_categoria?: string | null
          id_estabelecimento?: string | null
          id_produto?: string | null
          marca?: string | null
          origem?: string
          peso?: number
          termo: string
          termo_search?: string | null
          tipo_alvo?: Database["public"]["Enums"]["tipo_alvo_termo_busca"]
        }
        Update: {
          aprovado_por?: string | null
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          id_categoria?: string | null
          id_estabelecimento?: string | null
          id_produto?: string | null
          marca?: string | null
          origem?: string
          peso?: number
          termo?: string
          termo_search?: string | null
          tipo_alvo?: Database["public"]["Enums"]["tipo_alvo_termo_busca"]
        }
        Relationships: [
          {
            foreignKeyName: "termos_busca_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_busca_id_estabelecimento_fkey"
            columns: ["id_estabelecimento"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_busca_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          id: string
          primeiro_acesso_em: string | null
          telefone: string
          ultimo_acesso_em: string | null
        }
        Insert: {
          id?: string
          primeiro_acesso_em?: string | null
          telefone: string
          ultimo_acesso_em?: string | null
        }
        Update: {
          id?: string
          primeiro_acesso_em?: string | null
          telefone?: string
          ultimo_acesso_em?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_ofertas: {
        Args: { p_id_cidade?: string; p_limite?: number; p_termo: string }
        Returns: {
          bairro: string
          categoria: string
          cidade: string
          estabelecimento: string
          logradouro: string
          observacao: string
          preco: number
          produto: string
          tipo_estabelecimento: string
          validade_fim: string
        }[]
      }
      buscar_termos_sem_resultado: {
        Args: { p_limite?: number }
        Returns: {
          buscas: number
          sem_resultado: number
          termo: string
        }[]
      }
      registrar_log_intencao: {
        Args: {
          p_classificacao: string
          p_id_mensagem_whatsapp: string
          p_mensagem_normalizada: string
          p_mensagem_recebida: string
          p_telefone_usuario: string
          p_termo_identificado: string
        }
        Returns: string
      }
      registrar_log_resposta: {
        Args: {
          p_id_intencao: string
          p_resultados?: Json
          p_total_resultados_busca?: number
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      admin_role: "owner" | "admin" | "editor" | "viewer"
      status_item_ingestao:
        | "pendente"
        | "aprovado"
        | "rejeitado"
        | "publicado"
        | "erro"
      status_lote_ingestao:
        | "rascunho"
        | "processando"
        | "pendente_revisao"
        | "aprovado"
        | "publicado"
        | "rejeitado"
        | "erro"
      tipo_alvo_termo_busca:
        | "produto"
        | "categoria"
        | "marca"
        | "estabelecimento"
      tipo_estabelecimento: "supermercado" | "farmacia" | "posto_combustivel"
      tipo_fonte_dados:
        | "site"
        | "rede_social"
        | "panfleto"
        | "pdf"
        | "imagem"
        | "texto"
        | "outro"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ["owner", "admin", "editor", "viewer"],
      status_item_ingestao: [
        "pendente",
        "aprovado",
        "rejeitado",
        "publicado",
        "erro",
      ],
      status_lote_ingestao: [
        "rascunho",
        "processando",
        "pendente_revisao",
        "aprovado",
        "publicado",
        "rejeitado",
        "erro",
      ],
      tipo_alvo_termo_busca: [
        "produto",
        "categoria",
        "marca",
        "estabelecimento",
      ],
      tipo_estabelecimento: ["supermercado", "farmacia", "posto_combustivel"],
      tipo_fonte_dados: [
        "site",
        "rede_social",
        "panfleto",
        "pdf",
        "imagem",
        "texto",
        "outro",
      ],
    },
  },
} as const

