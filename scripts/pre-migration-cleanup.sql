-- ===========================================
-- PRE-MIGRATION CLEANUP: Preparação para Migration v2.0.0
-- Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico
-- Data: 05/02/2026
-- ===========================================
-- EXECUTE ESTE SCRIPT ANTES DO migration-v2.0.0.sql
-- ===========================================

-- =============================================
-- PASSO 1: DIAGNÓSTICO - Ver valores atuais de escalation_reason
-- =============================================

-- Execute primeiro para ver quais valores existem:
SELECT DISTINCT 
  escalation_reason,
  COUNT(*) as quantidade
FROM qa_spreadsheet_data
WHERE escalation_reason IS NOT NULL 
  AND escalation_reason != ''
GROUP BY escalation_reason
ORDER BY quantidade DESC;

-- =============================================
-- PASSO 2: NORMALIZAÇÃO DOS DADOS
-- Ajusta valores para os permitidos pela constraint
-- =============================================

-- Normalizar variações de "Agenda Indisponível"
UPDATE qa_spreadsheet_data 
SET escalation_reason = 'Agenda Indisponível'
WHERE LOWER(TRIM(escalation_reason)) LIKE '%agenda indispon%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%indisponibilidade%agenda%';

-- Normalizar variações de "Sem retorno"
UPDATE qa_spreadsheet_data 
SET escalation_reason = 'Sem retorno'
WHERE LOWER(TRIM(escalation_reason)) LIKE '%sem retorno%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%não respondeu%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%nao respondeu%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%sem resposta%';

-- Normalizar variações de "Não Compareceu nas agendas"
UPDATE qa_spreadsheet_data 
SET escalation_reason = 'Não Compareceu nas agendas'
WHERE LOWER(TRIM(escalation_reason)) LIKE '%não compareceu%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%nao compareceu%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%ausente%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%faltou%';

-- Normalizar variações de "Agenda Inefetiva"
UPDATE qa_spreadsheet_data 
SET escalation_reason = 'Agenda Inefetiva'
WHERE LOWER(TRIM(escalation_reason)) LIKE '%agenda inefetiva%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%inefetiva%';

-- Normalizar variações de "Bloqueado por falta de insumos"
UPDATE qa_spreadsheet_data 
SET escalation_reason = 'Bloqueado por falta de insumos'
WHERE LOWER(TRIM(escalation_reason)) LIKE '%falta de insumo%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%sem insumo%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%insumo%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%bloqueado%';

-- Normalizar variações de "Aguardando retorno do cliente"
UPDATE qa_spreadsheet_data 
SET escalation_reason = 'Aguardando retorno do cliente'
WHERE LOWER(TRIM(escalation_reason)) LIKE '%aguardando%cliente%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%aguardando retorno%';

-- Normalizar variações de "Problema técnico/ambiente"
UPDATE qa_spreadsheet_data 
SET escalation_reason = 'Problema técnico/ambiente'
WHERE LOWER(TRIM(escalation_reason)) LIKE '%problema técnico%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%problema tecnico%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%ambiente%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%erro%sistema%'
  OR LOWER(TRIM(escalation_reason)) LIKE '%bug%';

-- =============================================
-- PASSO 3: VALORES NÃO MAPEADOS → Outros
-- Para qualquer valor que não foi normalizado, 
-- definir como NULL (campo opcional) ou um valor genérico
-- =============================================

-- Opção A: Definir como NULL valores não reconhecidos
UPDATE qa_spreadsheet_data 
SET escalation_reason = NULL
WHERE escalation_reason IS NOT NULL 
  AND escalation_reason != ''
  AND escalation_reason NOT IN (
    'Agenda Indisponível',
    'Sem retorno',
    'Não Compareceu nas agendas',
    'Agenda Inefetiva',
    'Bloqueado por falta de insumos',
    'Aguardando retorno do cliente',
    'Problema técnico/ambiente'
  );

-- =============================================
-- PASSO 4: VERIFICAÇÃO FINAL
-- =============================================

-- Execute para confirmar que não há mais valores inválidos:
SELECT DISTINCT 
  escalation_reason,
  COUNT(*) as quantidade
FROM qa_spreadsheet_data
WHERE escalation_reason IS NOT NULL 
  AND escalation_reason != ''
GROUP BY escalation_reason
ORDER BY quantidade DESC;

-- Se a query acima retornar apenas valores permitidos,
-- você pode executar o migration-v2.0.0.sql

-- =============================================
-- LISTA DE VALORES PERMITIDOS (referência):
-- =============================================
-- 'Agenda Indisponível'
-- 'Sem retorno'
-- 'Não Compareceu nas agendas'
-- 'Agenda Inefetiva'
-- 'Bloqueado por falta de insumos'
-- 'Aguardando retorno do cliente'
-- 'Problema técnico/ambiente'
-- NULL (campo vazio)
-- '' (string vazia)
-- =============================================
