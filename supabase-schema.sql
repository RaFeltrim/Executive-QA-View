-- ===========================================
-- STUDIO QA - SUPABASE SCHEMA
-- Cliente: EBV | Projeto: CNPJ Alfa Numérico
-- ===========================================

-- Criar tabela principal de dados QA
CREATE TABLE IF NOT EXISTS qa_spreadsheet_data (
  id TEXT PRIMARY KEY,
  
  -- Metadata & Tracking
  contact_date TEXT,
  date TEXT,
  date_history TEXT DEFAULT '[]', -- JSON array de datas anteriores (inefetivas - aparecem riscadas)
  status TEXT DEFAULT 'Pendente',
  responsible_qa TEXT,
  
  -- Product / Front Details
  product TEXT,
  flow_knowledge TEXT,
  gherkin TEXT,
  out_of_scope BOOLEAN DEFAULT FALSE,
  
  -- Novos campos da planilha atualizada (2026-02-05)
  evidenciamento_as_is TEXT, -- Ambiente Liberado, Bloqueado - bug no Amb, Evidencias Disponibilizadas, Evidencias QA - OK, Impactado - Sem Insumos
  insumos_para_testes TEXT, -- Responsável QA, Responsável Lider Tecnico, GP - Necessário Envolver Áreas, etc.
  acionamento TEXT, -- Responsável QA, GP - Necessário Envolver Áreas, Impactado - Sem Insumos, Área Envolvida - Comprometida
  
  -- Campos legados (mantidos para retrocompatibilidade)
  data_mass TEXT, -- @deprecated - usar insumos_para_testes
  environment TEXT, -- @deprecated - usar evidenciamento_as_is
  
  -- Stakeholder Details
  responsible TEXT,
  role TEXT,
  tech_lead_name TEXT,
  
  -- Approval Details
  approval_requested_email TEXT,
  approved_by_client TEXT,
  
  -- Blockage & Escalation
  days_blocked INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'Media',
  escalation_reason TEXT, -- Opções fixas: Agenda Indisponível, Sem retorno, Não Compareceu nas agendas, Agenda Inefetiva
  escalation_responsible TEXT,
  escalation_status TEXT,
  escalation_obs TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MIGRATION SCRIPT: Adicionar novas colunas
-- Execute este bloco se a tabela já existir
-- =============================================
-- ALTER TABLE qa_spreadsheet_data ADD COLUMN IF NOT EXISTS evidenciamento_as_is TEXT;
-- ALTER TABLE qa_spreadsheet_data ADD COLUMN IF NOT EXISTS insumos_para_testes TEXT;
-- ALTER TABLE qa_spreadsheet_data ADD COLUMN IF NOT EXISTS acionamento TEXT;
-- ALTER TABLE qa_spreadsheet_data ADD COLUMN IF NOT EXISTS date_history TEXT DEFAULT '[]';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_qa_product ON qa_spreadsheet_data(product);
CREATE INDEX IF NOT EXISTS idx_qa_status ON qa_spreadsheet_data(status);
CREATE INDEX IF NOT EXISTS idx_qa_responsible ON qa_spreadsheet_data(responsible);

-- Habilitar RLS (Row Level Security)
ALTER TABLE qa_spreadsheet_data ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso público (ajuste conforme necessidade de autenticação)
CREATE POLICY "Allow all access to qa_spreadsheet_data" ON qa_spreadsheet_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Habilitar Realtime para sincronização
ALTER PUBLICATION supabase_realtime ADD TABLE qa_spreadsheet_data;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_qa_spreadsheet_data_updated_at
  BEFORE UPDATE ON qa_spreadsheet_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
