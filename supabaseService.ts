import { supabase, QA_TABLE } from './supabaseClient';
import { SpreadsheetRow, GherkinValidationResult, PipelineConfirmationLog } from './types';

// Default values para campos JSONB
const DEFAULT_GHERKIN_VALIDATION: GherkinValidationResult = {
  errors: [],
  isValid: false,
  warnings: [],
  validatedAt: null
};

const DEFAULT_PIPELINE_LOG: PipelineConfirmationLog[] = [];

// Converter de snake_case (DB) para camelCase (App)
const mapFromDB = (row: any): SpreadsheetRow => ({
  id: row.id,
  contactDate: row.contact_date || '',
  date: row.date || '',
  dateHistory: row.date_history ? JSON.parse(row.date_history) : [],
  status: row.status || 'Pendente',
  responsibleQA: row.responsible_qa || '',
  product: row.product || '',
  flowKnowledge: row.flow_knowledge || '',
  gherkin: row.gherkin || '',
  outOfScope: row.out_of_scope || false,
  // Novos campos
  evidenciamentoAsIs: row.evidenciamento_as_is || '',
  insumosParaTestes: row.insumos_para_testes || '',
  acionamento: row.acionamento || '',
  // Campos legados (retrocompatibilidade)
  dataMass: row.data_mass || '',
  environment: row.environment || '',
  // Stakeholder
  responsible: row.responsible || '',
  role: row.role || '',
  techLeadName: row.tech_lead_name || '',
  approvalRequestedEmail: row.approval_requested_email || '',
  approvedByClient: row.approved_by_client || '',
  blockedSinceDate: row.blocked_since_date || '',
  daysBlocked: row.days_blocked || 0,
  priority: row.priority || 'Media',
  escalationReason: row.escalation_reason || '',
  escalationResponsible: row.escalation_responsible || '',
  escalationStatus: row.escalation_status || '',
  escalationObs: row.escalation_obs || '',
  notes: row.notes || '',
  // ============================================
  // NOVOS CAMPOS DO PIPELINE DE TESTES (v2.0.0)
  // ============================================
  testPipelineStatus: row.test_pipeline_status || 'Não Iniciado',
  gherkinValidationResult: row.gherkin_validation_result || DEFAULT_GHERKIN_VALIDATION,
  lastTestExecution: row.last_test_execution || '',
  evidenceUrl: row.evidence_url || '',
  pipelineConfirmationLog: row.pipeline_confirmation_log || DEFAULT_PIPELINE_LOG
});

// Converter de camelCase (App) para snake_case (DB)
const mapToDB = (row: SpreadsheetRow): any => ({
  id: row.id,
  contact_date: row.contactDate,
  date: row.date,
  date_history: row.dateHistory ? JSON.stringify(row.dateHistory) : '[]',
  status: row.status,
  responsible_qa: row.responsibleQA,
  product: row.product,
  flow_knowledge: row.flowKnowledge,
  gherkin: row.gherkin,
  out_of_scope: row.outOfScope,
  // Novos campos
  evidenciamento_as_is: row.evidenciamentoAsIs,
  insumos_para_testes: row.insumosParaTestes,
  acionamento: row.acionamento,
  // Campos legados (retrocompatibilidade)
  data_mass: row.dataMass,
  environment: row.environment,
  // Stakeholder
  responsible: row.responsible,
  role: row.role,
  tech_lead_name: row.techLeadName,
  approval_requested_email: row.approvalRequestedEmail,
  approved_by_client: row.approvedByClient,
  blocked_since_date: row.blockedSinceDate || null, // DATE não aceita string vazia
  days_blocked: row.daysBlocked,
  priority: row.priority,
  escalation_reason: row.escalationReason,
  escalation_responsible: row.escalationResponsible,
  escalation_status: row.escalationStatus,
  escalation_obs: row.escalationObs,
  notes: row.notes,
  // ============================================
  // NOVOS CAMPOS DO PIPELINE DE TESTES (v2.0.0)
  // ============================================
  test_pipeline_status: row.testPipelineStatus || 'Não Iniciado',
  gherkin_validation_result: row.gherkinValidationResult || DEFAULT_GHERKIN_VALIDATION,
  last_test_execution: row.lastTestExecution || null,
  evidence_url: row.evidenceUrl || null,
  pipeline_confirmation_log: row.pipelineConfirmationLog || DEFAULT_PIPELINE_LOG
});

// Buscar todos os dados
export const fetchAllData = async (): Promise<SpreadsheetRow[]> => {
  const { data, error } = await supabase
    .from(QA_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar dados:', error);
    throw error;
  }
  
  return (data || []).map(mapFromDB);
};

// Inserir nova linha
export const insertRow = async (row: SpreadsheetRow): Promise<SpreadsheetRow> => {
  const { data, error } = await supabase
    .from(QA_TABLE)
    .insert(mapToDB(row))
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao inserir:', error);
    throw error;
  }
  
  return mapFromDB(data);
};

// Atualizar linha existente
export const updateRow = async (id: string, updates: Partial<SpreadsheetRow>): Promise<void> => {
  const dbUpdates: any = {};
  
  // Mapear apenas os campos que foram atualizados
  if (updates.contactDate !== undefined) dbUpdates.contact_date = updates.contactDate;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.dateHistory !== undefined) dbUpdates.date_history = JSON.stringify(updates.dateHistory);
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.responsibleQA !== undefined) dbUpdates.responsible_qa = updates.responsibleQA;
  if (updates.product !== undefined) dbUpdates.product = updates.product;
  if (updates.flowKnowledge !== undefined) dbUpdates.flow_knowledge = updates.flowKnowledge;
  if (updates.gherkin !== undefined) dbUpdates.gherkin = updates.gherkin;
  if (updates.outOfScope !== undefined) dbUpdates.out_of_scope = updates.outOfScope;
  // Novos campos
  if (updates.evidenciamentoAsIs !== undefined) dbUpdates.evidenciamento_as_is = updates.evidenciamentoAsIs;
  if (updates.insumosParaTestes !== undefined) dbUpdates.insumos_para_testes = updates.insumosParaTestes;
  if (updates.acionamento !== undefined) dbUpdates.acionamento = updates.acionamento;
  // Campos legados (retrocompatibilidade)
  if (updates.dataMass !== undefined) dbUpdates.data_mass = updates.dataMass;
  if (updates.environment !== undefined) dbUpdates.environment = updates.environment;
  // Stakeholder
  if (updates.responsible !== undefined) dbUpdates.responsible = updates.responsible;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.techLeadName !== undefined) dbUpdates.tech_lead_name = updates.techLeadName;
  if (updates.approvalRequestedEmail !== undefined) dbUpdates.approval_requested_email = updates.approvalRequestedEmail;
  if (updates.approvedByClient !== undefined) dbUpdates.approved_by_client = updates.approvedByClient;
  // blockedSinceDate: enviar null se vazio (campo DATE não aceita string vazia)
  if (updates.blockedSinceDate !== undefined) dbUpdates.blocked_since_date = updates.blockedSinceDate || null;
  if (updates.daysBlocked !== undefined) dbUpdates.days_blocked = updates.daysBlocked;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.escalationReason !== undefined) dbUpdates.escalation_reason = updates.escalationReason;
  if (updates.escalationResponsible !== undefined) dbUpdates.escalation_responsible = updates.escalationResponsible;
  if (updates.escalationStatus !== undefined) dbUpdates.escalation_status = updates.escalationStatus;
  if (updates.escalationObs !== undefined) dbUpdates.escalation_obs = updates.escalationObs;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  // Pipeline de Testes Automatizados
  if (updates.testPipelineStatus !== undefined) dbUpdates.test_pipeline_status = updates.testPipelineStatus;
  if (updates.gherkinValidationResult !== undefined) dbUpdates.gherkin_validation_result = updates.gherkinValidationResult;
  if (updates.lastTestExecution !== undefined) dbUpdates.last_test_execution = updates.lastTestExecution;
  if (updates.evidenceUrl !== undefined) dbUpdates.evidence_url = updates.evidenceUrl;
  if (updates.pipelineConfirmationLog !== undefined) dbUpdates.pipeline_confirmation_log = updates.pipelineConfirmationLog;

  const { error } = await supabase
    .from(QA_TABLE)
    .update(dbUpdates)
    .eq('id', id);
  
  if (error) {
    console.error('Erro ao atualizar:', error);
    throw error;
  }
};

// Deletar linha
export const deleteRow = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(QA_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Erro ao deletar:', error);
    throw error;
  }
};

// Deletar todos os dados (para importação completa)
export const deleteAllRows = async (): Promise<void> => {
  const { error } = await supabase
    .from(QA_TABLE)
    .delete()
    .neq('id', ''); // Deleta todos os registros
  
  if (error) {
    console.error('Erro ao deletar todos:', error);
    throw error;
  }
};

// Inserir em batch (para importação - após deletar tudo)
export const insertBatch = async (rows: SpreadsheetRow[]): Promise<void> => {
  if (rows.length === 0) return;
  
  const dbRows = rows.map(mapToDB);
  
  // Insert in chunks of 100 to avoid timeout
  const chunkSize = 100;
  for (let i = 0; i < dbRows.length; i += chunkSize) {
    const chunk = dbRows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(QA_TABLE)
      .insert(chunk);
    
    if (error) {
      console.error(`Erro no insert batch (chunk ${i}):`, error);
      throw error;
    }
  }
};

// Upsert em batch (para sincronização parcial)
export const upsertBatch = async (rows: SpreadsheetRow[]): Promise<void> => {
  if (rows.length === 0) return;
  
  // Filter out rows without valid IDs
  const validRows = rows.filter(row => row.id && row.id.trim() !== '');
  if (validRows.length === 0) {
    console.warn('Nenhum registro válido para upsert');
    return;
  }
  
  const dbRows = validRows.map(mapToDB);
  
  // Upsert in chunks of 100 to avoid timeout
  const chunkSize = 100;
  for (let i = 0; i < dbRows.length; i += chunkSize) {
    const chunk = dbRows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(QA_TABLE)
      .upsert(chunk, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`Erro no upsert batch (chunk ${i}):`, error);
      throw error;
    }
  }
  
  console.log(`✅ Upsert concluído: ${validRows.length} registros`);
};

// Subscribe para Realtime
export const subscribeToChanges = (
  onInsert: (row: SpreadsheetRow) => void,
  onUpdate: (row: SpreadsheetRow) => void,
  onDelete: (id: string) => void,
  onBulkChange?: () => void
) => {
  let bulkDeleteCount = 0;
  let bulkDeleteTimer: ReturnType<typeof setTimeout> | null = null;

  const channel = supabase
    .channel('qa-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: QA_TABLE },
      (payload) => onInsert(mapFromDB(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: QA_TABLE },
      (payload) => onUpdate(mapFromDB(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: QA_TABLE },
      (payload) => {
        bulkDeleteCount++;
        // Se muitos deletes em sequência, é uma importação - recarregar tudo
        if (bulkDeleteTimer) clearTimeout(bulkDeleteTimer);
        bulkDeleteTimer = setTimeout(() => {
          if (bulkDeleteCount > 5 && onBulkChange) {
            onBulkChange();
          } else {
            onDelete(payload.old.id);
          }
          bulkDeleteCount = 0;
        }, 500);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
