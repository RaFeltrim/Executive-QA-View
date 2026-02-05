-- ===========================================
-- MIGRATION v2.0.0: Schema Completo com Esteira de Testes
-- Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico
-- Data: 05/02/2026
-- ===========================================

-- =============================================
-- PARTE 1: NOVAS COLUNAS PARA ESTEIRA DE TESTES
-- =============================================

-- Campo: Status na Esteira de Testes
ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS test_pipeline_status TEXT 
  DEFAULT 'Não Iniciado';

-- Constraint para valores permitidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_test_pipeline_status'
  ) THEN
    ALTER TABLE qa_spreadsheet_data 
    ADD CONSTRAINT chk_test_pipeline_status 
    CHECK (test_pipeline_status IN (
      'Não Iniciado', 
      'Aguardando Gherkin', 
      'Gherkin Validado', 
      'Em Execução', 
      'Concluído', 
      'Falhou'
    ));
  END IF;
END $$;

-- Campo: Resultado da Validação do Gherkin (JSON)
ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS gherkin_validation_result JSONB 
  DEFAULT '{"isValid": false, "errors": [], "warnings": [], "validatedAt": null}';

-- Campo: Data/Hora da Última Execução de Teste
ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS last_test_execution TIMESTAMPTZ;

-- Campo: URL das Evidências
ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- Campo: Log de Confirmação de Uso da Esteira (JSON Array)
ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS pipeline_confirmation_log JSONB 
  DEFAULT '[]';

-- =============================================
-- PARTE 2: CONSTRAINT PARA MOTIVOS DE ESCALATION
-- =============================================

-- Remover constraint antiga se existir
ALTER TABLE qa_spreadsheet_data 
DROP CONSTRAINT IF EXISTS chk_escalation_reason;

-- Adicionar constraint com valores da aba Base
-- NOTA: Deixando flexível para aceitar texto livre também (apenas validação leve)
-- Para forçar estritamente, remova as condições IS NULL e = ''
ALTER TABLE qa_spreadsheet_data 
ADD CONSTRAINT chk_escalation_reason 
CHECK (
  escalation_reason IS NULL 
  OR escalation_reason = '' 
  OR escalation_reason IN (
    'Agenda Indisponível',
    'Sem retorno',
    'Não Compareceu nas agendas',
    'Agenda Inefetiva',
    -- Valores extras para retrocompatibilidade
    'Bloqueado por falta de insumos',
    'Aguardando retorno do cliente',
    'Problema técnico/ambiente'
  )
);

-- =============================================
-- PARTE 3: ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_qa_pipeline_status 
ON qa_spreadsheet_data(test_pipeline_status);

CREATE INDEX IF NOT EXISTS idx_qa_last_execution 
ON qa_spreadsheet_data(last_test_execution);

CREATE INDEX IF NOT EXISTS idx_qa_evidence_url 
ON qa_spreadsheet_data(evidence_url) 
WHERE evidence_url IS NOT NULL;

-- Índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_qa_status_priority 
ON qa_spreadsheet_data(status, priority);

-- Índice para busca por QA responsável
CREATE INDEX IF NOT EXISTS idx_qa_responsible_qa 
ON qa_spreadsheet_data(responsible_qa);

-- =============================================
-- PARTE 4: COMENTÁRIOS DE DOCUMENTAÇÃO
-- =============================================

COMMENT ON COLUMN qa_spreadsheet_data.test_pipeline_status IS 
  'Status atual do item na esteira de testes automatizados. Valores: Não Iniciado, Aguardando Gherkin, Gherkin Validado, Em Execução, Concluído, Falhou';

COMMENT ON COLUMN qa_spreadsheet_data.gherkin_validation_result IS 
  'Resultado da validação do Gherkin em formato JSON: {isValid: boolean, errors: [], warnings: [], metrics: {scenarioCount, stepCount}, validatedAt: timestamp}';

COMMENT ON COLUMN qa_spreadsheet_data.pipeline_confirmation_log IS 
  'Log de eventos de confirmação de uso da esteira em formato JSON array: [{timestamp, action, details, executedBy}]';

COMMENT ON COLUMN qa_spreadsheet_data.evidence_url IS 
  'URL para evidências de teste (screenshots, vídeos, relatórios)';

COMMENT ON COLUMN qa_spreadsheet_data.last_test_execution IS 
  'Data/hora da última execução de teste automatizado para este item';

COMMENT ON COLUMN qa_spreadsheet_data.date_history IS 
  'Histórico de datas de agenda anteriores (inefetivas) em formato JSON array. Usado para rastrear reagendamentos.';

-- =============================================
-- PARTE 5: FUNÇÃO PARA ADICIONAR ENTRADA NO LOG
-- =============================================

CREATE OR REPLACE FUNCTION add_pipeline_log_entry(
  p_row_id TEXT,
  p_action TEXT,
  p_details TEXT,
  p_executed_by TEXT DEFAULT 'system'
)
RETURNS VOID AS $$
DECLARE
  v_new_entry JSONB;
  v_current_log JSONB;
BEGIN
  v_new_entry := jsonb_build_object(
    'timestamp', NOW(),
    'action', p_action,
    'details', p_details,
    'executedBy', p_executed_by
  );
  
  SELECT COALESCE(pipeline_confirmation_log, '[]'::JSONB)
  INTO v_current_log
  FROM qa_spreadsheet_data
  WHERE id = p_row_id;
  
  UPDATE qa_spreadsheet_data
  SET pipeline_confirmation_log = v_current_log || v_new_entry
  WHERE id = p_row_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PARTE 6: FUNÇÃO PARA MOVER DATA PARA HISTÓRICO
-- =============================================

CREATE OR REPLACE FUNCTION move_date_to_history()
RETURNS TRIGGER AS $$
DECLARE
  v_current_history JSONB;
  v_current_date TEXT;
BEGIN
  -- Só executa se o status mudou para 'Inefetiva'
  IF NEW.status = 'Inefetiva' AND OLD.status != 'Inefetiva' THEN
    v_current_date := OLD.date;
    v_current_history := COALESCE(OLD.date_history::JSONB, '[]'::JSONB);
    
    -- Adicionar data atual ao histórico se não estiver vazia
    IF v_current_date IS NOT NULL AND v_current_date != '' THEN
      -- Verificar se a data já está no histórico
      IF NOT v_current_history ? v_current_date THEN
        NEW.date_history := (v_current_history || to_jsonb(v_current_date))::TEXT;
      END IF;
    END IF;
  END IF;
  
  -- Limpar histórico se status mudar para 'Realizada'
  IF NEW.status = 'Realizada' AND OLD.status != 'Realizada' THEN
    NEW.date_history := '[]';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mover data para histórico automaticamente
DROP TRIGGER IF EXISTS trg_move_date_to_history ON qa_spreadsheet_data;
CREATE TRIGGER trg_move_date_to_history
  BEFORE UPDATE ON qa_spreadsheet_data
  FOR EACH ROW
  EXECUTE FUNCTION move_date_to_history();

-- =============================================
-- PARTE 7: VIEW PARA RELATÓRIO DE ESTEIRA
-- =============================================

CREATE OR REPLACE VIEW v_pipeline_summary AS
SELECT 
  test_pipeline_status,
  COUNT(*) as total_items,
  COUNT(CASE WHEN gherkin = 'OK' THEN 1 END) as gherkin_ok,
  COUNT(CASE WHEN evidence_url IS NOT NULL THEN 1 END) as with_evidence,
  AVG(days_blocked) as avg_days_blocked,
  MAX(last_test_execution) as last_execution
FROM qa_spreadsheet_data
WHERE out_of_scope = FALSE
GROUP BY test_pipeline_status
ORDER BY 
  CASE test_pipeline_status
    WHEN 'Não Iniciado' THEN 1
    WHEN 'Aguardando Gherkin' THEN 2
    WHEN 'Gherkin Validado' THEN 3
    WHEN 'Em Execução' THEN 4
    WHEN 'Concluído' THEN 5
    WHEN 'Falhou' THEN 6
  END;

-- =============================================
-- PARTE 8: VIEW PARA ESCALATIONS ATIVAS
-- =============================================

CREATE OR REPLACE VIEW v_active_escalations AS
SELECT 
  id,
  product,
  responsible,
  responsible_qa,
  status,
  days_blocked,
  priority,
  escalation_reason,
  escalation_responsible,
  escalation_status,
  escalation_obs,
  contact_date,
  date,
  updated_at
FROM qa_spreadsheet_data
WHERE 
  (days_blocked > 0 OR status = 'Bloqueada')
  AND out_of_scope = FALSE
ORDER BY 
  CASE priority 
    WHEN 'Alta' THEN 1 
    WHEN 'Media' THEN 2 
    WHEN 'Baixa' THEN 3 
  END,
  days_blocked DESC;

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration v2.0.0 concluída com sucesso!';
  RAISE NOTICE '📋 Novas colunas: test_pipeline_status, gherkin_validation_result, last_test_execution, evidence_url, pipeline_confirmation_log';
  RAISE NOTICE '🔧 Novas funções: add_pipeline_log_entry, move_date_to_history';
  RAISE NOTICE '📊 Novas views: v_pipeline_summary, v_active_escalations';
END $$;
