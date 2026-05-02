CREATE OR REPLACE FUNCTION "public"."registrar_log_intencao"("p_classificacao" "text", "p_id_mensagem_whatsapp" "text", "p_mensagem_normalizada" "text", "p_mensagem_recebida" "text", "p_telefone_usuario" "text", "p_termo_identificado" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_id_usuario uuid;
  v_id uuid;
BEGIN
  -- valida classificacao (espelha o CHECK da tabela)
  IF p_classificacao NOT IN ('busca','saudacao','desconhecido') THEN
    RAISE EXCEPTION 'classificacao invalida: %', p_classificacao;
  END IF;

  INSERT INTO public.usuarios (
    telefone,
    ultimo_acesso_em
  ) VALUES (
    p_telefone_usuario,
    now()
  )
  ON CONFLICT (telefone) DO UPDATE SET
    ultimo_acesso_em = now()
  RETURNING id INTO v_id_usuario;

  INSERT INTO public.log_intencoes (
    id_usuario,
    classificacao,
    termo_identificado,
    mensagem_recebida,
    mensagem_normalizada,
    id_mensagem_whatsapp
  ) VALUES (
    v_id_usuario,
    p_classificacao,
    p_termo_identificado,
    p_mensagem_recebida,
    p_mensagem_normalizada,
    p_id_mensagem_whatsapp
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

ALTER FUNCTION "public"."registrar_log_intencao"("p_classificacao" "text", "p_id_mensagem_whatsapp" "text", "p_mensagem_normalizada" "text", "p_mensagem_recebida" "text", "p_telefone_usuario" "text", "p_termo_identificado" "text") OWNER TO "postgres";
