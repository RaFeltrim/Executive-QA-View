-- =====================================================
-- EBV QA Dashboard - Script de Limpeza de Dados
-- Data: 2025-01-XX
-- Descrição: Remove dados infectados por testes de XSS/SQL Injection
-- =====================================================

-- 1. LIMPEZA DE ATAQUES XSS (script tags e HTML malicioso)
-- =====================================================

-- Limpar campo 'product' (Produto/Frente)
UPDATE spreadsheet_data 
SET product = REGEXP_REPLACE(product, '<[^>]*>', '', 'g')
WHERE product LIKE '%<%>%' OR product LIKE '%script%';

-- Limpar campo 'responsible' (Stakeholder)
UPDATE spreadsheet_data 
SET responsible = REGEXP_REPLACE(responsible, '<[^>]*>', '', 'g')
WHERE responsible LIKE '%<%>%' OR responsible LIKE '%script%';

-- Limpar campo 'responsibleQA' (Responsável QA)
UPDATE spreadsheet_data 
SET "responsibleQA" = REGEXP_REPLACE("responsibleQA", '<[^>]*>', '', 'g')
WHERE "responsibleQA" LIKE '%<%>%' OR "responsibleQA" LIKE '%script%';

-- Limpar campo 'techLeadName' (Tech Lead)
UPDATE spreadsheet_data 
SET "techLeadName" = REGEXP_REPLACE("techLeadName", '<[^>]*>', '', 'g')
WHERE "techLeadName" LIKE '%<%>%' OR "techLeadName" LIKE '%script%';

-- Limpar campo 'escalationReason' (Motivo Escalação)
UPDATE spreadsheet_data 
SET "escalationReason" = REGEXP_REPLACE("escalationReason", '<[^>]*>', '', 'g')
WHERE "escalationReason" LIKE '%<%>%' OR "escalationReason" LIKE '%script%';

-- Limpar campo 'notes' (Observações)
UPDATE spreadsheet_data 
SET notes = REGEXP_REPLACE(notes, '<[^>]*>', '', 'g')
WHERE notes LIKE '%<%>%' OR notes LIKE '%script%';

-- 2. LIMPEZA DE ATAQUES SQL INJECTION
-- =====================================================

-- Remover padrões de SQL Injection comuns
UPDATE spreadsheet_data 
SET product = REGEXP_REPLACE(product, '''|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION', '', 'gi')
WHERE product ~* '''|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION';

UPDATE spreadsheet_data 
SET responsible = REGEXP_REPLACE(responsible, '''|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION', '', 'gi')
WHERE responsible ~* '''|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION';

UPDATE spreadsheet_data 
SET "responsibleQA" = REGEXP_REPLACE("responsibleQA", '''|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION', '', 'gi')
WHERE "responsibleQA" ~* '''|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION';

UPDATE spreadsheet_data 
SET notes = REGEXP_REPLACE(notes, '''|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION', '', 'gi')
WHERE notes ~* '''|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION';

-- 3. CORREÇÃO DE TYPOS CONHECIDOS
-- =====================================================

-- Corrigir "Maurifcio" para "Maurício"
UPDATE spreadsheet_data 
SET responsible = REPLACE(responsible, 'Maurifcio', 'Maurício')
WHERE responsible LIKE '%Maurifcio%';

UPDATE spreadsheet_data 
SET "responsibleQA" = REPLACE("responsibleQA", 'Maurifcio', 'Maurício')
WHERE "responsibleQA" LIKE '%Maurifcio%';

UPDATE spreadsheet_data 
SET "techLeadName" = REPLACE("techLeadName", 'Maurifcio', 'Maurício')
WHERE "techLeadName" LIKE '%Maurifcio%';

-- Corrigir "Rafae" para "Rafael" (quando isolado)
UPDATE spreadsheet_data 
SET responsible = REGEXP_REPLACE(responsible, '\bRafae\b', 'Rafael', 'g')
WHERE responsible ~ '\bRafae\b';

UPDATE spreadsheet_data 
SET "responsibleQA" = REGEXP_REPLACE("responsibleQA", '\bRafae\b', 'Rafael', 'g')
WHERE "responsibleQA" ~ '\bRafae\b';

-- 4. REMOVER REGISTROS COMPLETAMENTE CORROMPIDOS
-- =====================================================

-- Deletar registros que são claramente testes de segurança
DELETE FROM spreadsheet_data 
WHERE product LIKE '%<script%' 
   OR product LIKE '%DROP TABLE%'
   OR product LIKE '%alert(%'
   OR product = '';

-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Contar registros restantes
SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN product LIKE '%<%>%' THEN 1 END) as registros_com_html,
  COUNT(CASE WHEN product ~* 'DROP|SELECT|INSERT' THEN 1 END) as registros_com_sql
FROM spreadsheet_data;

-- Listar registros suspeitos para revisão manual
SELECT id, product, responsible, "responsibleQA", notes
FROM spreadsheet_data
WHERE product ~* '<|>|script|DROP|SELECT|INSERT|''|--'
   OR responsible ~* '<|>|script|DROP|SELECT|INSERT|''|--'
   OR notes ~* '<|>|script|DROP|SELECT|INSERT|''|--'
LIMIT 50;
