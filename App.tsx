
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { 
  BookOpen, CheckCircle2, Clock, Download, ShieldCheck, 
  Users2, Target, AlertTriangle, Layers, UserCircle2, 
  FileSpreadsheet, Slash, Plus, Trash2, Scan, Settings, Save, RefreshCw,
  FileUp, FileDown, Cloud, CloudOff, Loader2, MessageSquare
} from 'lucide-react';

// Utility: Generate UUID v4 for consistent IDs
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Utility: Format date to ISO (yyyy-MM-dd) for HTML input
const formatDateToISO = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  // Already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Validar se não é data epoch (1970-01-01)
    if (dateStr === '1970-01-01') return '';
    return dateStr;
  }
  // Convert from dd/mm/yyyy to yyyy-MM-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    // Validar se não é data epoch
    if (year === '1970' && month === '01' && day === '01') return '';
    return `${year}-${month}-${day}`;
  }
  // Rejeitar strings que não são datas válidas
  if (!/\d/.test(dateStr)) return '';
  // Try to parse other formats (com validação extra)
  const date = new Date(dateStr);
  if (!isNaN(date.getTime()) && date.getFullYear() > 1970) {
    return date.toISOString().split('T')[0];
  }
  return '';
};

// Utility: Format date from ISO to display (dd/mm/yyyy)
const formatDateToDisplay = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  // Rejeitar data epoch
  if (dateStr === '1970-01-01' || dateStr === '01/01/1970') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    // Não exibir data epoch
    if (year === '1970' && month === '01' && day === '01') return '';
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

// Security: Sanitize input to prevent XSS and SQL injection attacks
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return input;
  // Use DOMPurify to strip HTML/script tags (XSS protection)
  let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  // Additional protection: escape SQL injection patterns
  sanitized = sanitized
    .replace(/'/g, "''") // Escape single quotes
    .replace(/--/g, '') // Remove SQL comment syntax
    .replace(/;/g, '') // Remove semicolons
    .replace(/DROP\s+TABLE/gi, '') // Remove DROP TABLE
    .replace(/DELETE\s+FROM/gi, '') // Remove DELETE FROM
    .replace(/INSERT\s+INTO/gi, '') // Remove INSERT INTO
    .replace(/UPDATE\s+.*SET/gi, '') // Remove UPDATE SET
    .replace(/UNION\s+SELECT/gi, '') // Remove UNION SELECT
    .replace(/SELECT\s+.*FROM/gi, ''); // Remove SELECT FROM
  return sanitized.trim();
};

import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import { 
  SpreadsheetRow, 
  EffectivenessMetric, FrontCompleteness, FrontStakeholderMapping 
} from './types';
import { 
  INITIAL_SPREADSHEET_DATA 
} from './constants';
import {
  fetchAllData,
  insertRow as dbInsertRow,
  updateRow as dbUpdateRow,
  deleteRow as dbDeleteRow,
  upsertBatch,
  deleteAllRows,
  insertBatch,
  subscribeToChanges
} from './supabaseService';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'executive' | 'logbook' | 'spreadsheet' | 'stakeholders'>('spreadsheet');
  
  // Spreadsheet data with persistence
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetRow[]>([]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Check Supabase connection
  const checkSupabaseConnection = useCallback(async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url) {
      setIsOnline(false);
      return false;
    }
    try {
      const { error } = await supabase.from('qa_spreadsheet_data').select('id').limit(1);
      setIsOnline(!error);
      return !error;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, []);

  // Load data from Supabase or localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const online = await checkSupabaseConnection();
      
      if (online) {
        try {
          const data = await fetchAllData();
          if (data.length > 0) {
            setSpreadsheetData(data);
          } else {
            // Se DB vazio, carregar dados iniciais e sincronizar
            const saved = localStorage.getItem('ebv_qa_data');
            const initialData = saved ? JSON.parse(saved) : INITIAL_SPREADSHEET_DATA;
            setSpreadsheetData(initialData);
            await upsertBatch(initialData);
          }
        } catch (err) {
          console.error('Erro ao carregar do Supabase:', err);
          const saved = localStorage.getItem('ebv_qa_data');
          setSpreadsheetData(saved ? JSON.parse(saved) : INITIAL_SPREADSHEET_DATA);
        }
      } else {
        const saved = localStorage.getItem('ebv_qa_data');
        setSpreadsheetData(saved ? JSON.parse(saved) : INITIAL_SPREADSHEET_DATA);
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [checkSupabaseConnection]);

  // Function to reload all data from Supabase
  const reloadFromSupabase = useCallback(async () => {
    if (!isOnline) return;
    try {
      const data = await fetchAllData();
      setSpreadsheetData(data);
      localStorage.setItem('ebv_qa_data', JSON.stringify(data));
    } catch (err) {
      console.error('Erro ao recarregar dados:', err);
    }
  }, [isOnline]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isOnline) return;

    const unsubscribe = subscribeToChanges(
      // On Insert
      (newRow) => {
        setSpreadsheetData(prev => {
          if (prev.some(r => r.id === newRow.id)) return prev;
          return [newRow, ...prev];
        });
      },
      // On Update
      (updatedRow) => {
        setSpreadsheetData(prev => 
          prev.map(r => r.id === updatedRow.id ? updatedRow : r)
        );
      },
      // On Delete
      (deletedId) => {
        setSpreadsheetData(prev => prev.filter(r => r.id !== deletedId));
      },
      // On Bulk Change (importação detectada)
      () => {
        reloadFromSupabase();
      }
    );

    return unsubscribe;
  }, [isOnline, reloadFromSupabase]);

  // Persistence effect - backup to localStorage
  // Only save when we have data or explicitly empty (not on initial load)
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (!isLoading && hasInitialized) {
      localStorage.setItem('ebv_qa_data', JSON.stringify(spreadsheetData));
    }
    if (!isLoading && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [spreadsheetData, isLoading, hasInitialized]);

  const handleUpdateAndSave = async () => {
    if (spreadsheetData.length === 0) {
      alert('Nenhum dado para salvar.');
      return;
    }
    
    setIsUpdating(true);
    setSyncStatus('syncing');
    try {
      // Validate all rows have valid IDs
      const validData = spreadsheetData.map(row => ({
        ...row,
        id: row.id || generateUUID()
      }));
      
      if (isOnline) {
        await upsertBatch(validData);
      }
      localStorage.setItem('ebv_qa_data', JSON.stringify(validData));
      setSpreadsheetData(validData);
      setSyncStatus('synced');
      console.log(`✅ ${validData.length} registros salvos com sucesso`);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setSyncStatus('error');
      alert('Erro ao sincronizar. Os dados foram salvos localmente.');
    } finally {
      setIsUpdating(false);
    }
  };

  // EXCEL IMPORT FEATURE
  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      if (data) {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to SpreadsheetRow properties (with XSS/SQL sanitization)
        const mappedData: SpreadsheetRow[] = json.map((row, idx) => ({
          id: generateUUID(),
          product: sanitizeInput(row['Produto (Frente)'] || row['product'] || ''),
          gherkin: row['Gherkin'] || row['gherkin'] || '',
          flowKnowledge: row['Fluxo'] || row['flowKnowledge'] || '',
          // Novos campos da planilha atualizada
          evidenciamentoAsIs: row['Evidenciamento As Is'] || row['evidenciamentoAsIs'] || '',
          insumosParaTestes: row['Insumos p/ Testes'] || row['Insumos para Testes'] || row['insumosParaTestes'] || '',
          acionamento: row['Acionamento'] || row['acionamento'] || '',
          // Campos legados (retrocompatibilidade)
          environment: row['Ambiente'] || row['environment'] || '',
          dataMass: row['Massa'] || row['dataMass'] || '',
          outOfScope: String(row['Fora Escopo']).toLowerCase() === 'true' || row['outOfScope'] === true,
          responsibleQA: sanitizeInput(row['Resp. QA'] || row['responsibleQA'] || ''),
          contactDate: formatDateToISO(row['Data Acionamento'] || row['contactDate'] || ''),
          responsible: sanitizeInput(row['Stakeholder'] || row['responsible'] || ''),
          role: sanitizeInput(row['Função'] || row['role'] || ''),
          techLeadName: sanitizeInput(row['Tech Lead'] || row['techLeadName'] || ''),
          status: row['Status Agenda'] || row['status'] || 'Pendente',
          date: formatDateToISO(row['Data Agenda'] || row['date'] || ''),
          approvalRequestedEmail: row['Aprovação Solicitada por email'] || row['approvalRequestedEmail'] || '',
          approvedByClient: row['Aprovado Pelo Cliente'] || row['approvedByClient'] || '',
          daysBlocked: Number(row['Dias Bloq.'] || row['daysBlocked'] || 0),
          priority: row['Prioridade'] || row['priority'] || 'Media',
          escalationReason: sanitizeInput(row['Motivo Bloqueio (Escalada)'] || row['escalationReason'] || ''),
          escalationResponsible: sanitizeInput(row['Responsável Escalation'] || row['escalationResponsible'] || ''),
          escalationStatus: row['Status Escalation'] || row['escalationStatus'] || ' ',
          escalationObs: sanitizeInput(row['OBS Escalation'] || row['escalationObs'] || ''),
          notes: sanitizeInput(row['Observacoes'] || row['notes'] || '')
        }));

        if (mappedData.length > 0) {
          const confirmUpdate = window.confirm(`Deseja importar ${mappedData.length} registros e substituir os dados atuais?`);
          if (confirmUpdate) {
            setSpreadsheetData(mappedData);
            localStorage.setItem('ebv_qa_data', JSON.stringify(mappedData));
            if (isOnline) {
              try {
                // Deletar todos os dados antigos e inserir os novos
                await deleteAllRows();
                await insertBatch(mappedData);
              } catch (err) {
                console.error('Erro ao sincronizar importação:', err);
              }
            }
            alert('Dados importados com sucesso!');
          }
        } else {
          alert('Nenhum dado válido encontrado no arquivo.');
        }
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    event.target.value = '';
  };

  // IA SCANNING FEATURE
  const handleAIScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType: file.type } },
              { text: `Extraia as frentes de trabalho, stakeholders, e dados de escalation deste dashboard de projeto. 
                      Retorne APENAS um JSON no formato de array de objetos SpreadsheetRow. 
                      Cada objeto deve ter: product (string), responsible (string), responsibleQA (string), status (Pendente|Realizada|Inefetiva|Bloqueada), flowKnowledge (OK|NOK), dataMass (OK|NOK), gherkin (OK|NOK), environment (OK|NOK), daysBlocked (number), priority (Alta|Media|Baixa), escalationReason (string).
                      Seja muito preciso com os nomes e números vistos na imagem.` }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const extractedData = JSON.parse(response.text || '[]');
      const formattedData = extractedData.map((row: any, idx: number) => ({
        ...row,
        id: generateUUID(),
        date: formatDateToISO(row.date || ''),
        contactDate: formatDateToISO(row.contactDate || ''),
        notes: 'Importado via IA Scan'
      }));

      const newData = [...formattedData, ...spreadsheetData];
      setSpreadsheetData(newData);
      localStorage.setItem('ebv_qa_data', JSON.stringify(newData));
      if (isOnline) {
        try {
          await upsertBatch(formattedData);
        } catch (err) {
          console.error('Erro ao sincronizar scan IA:', err);
        }
      }
      alert(`${formattedData.length} registros extraídos com sucesso pela IA!`);
    } catch (error) {
      console.error('Erro no scan:', error);
      alert('Erro ao processar imagem com IA. Verifique se a imagem é clara.');
    } finally {
      setIsScanning(false);
    }
  };

  // DERIVED DATA: Executive Panel - Fronts Completeness & Evolution
  const frontsCompleteness = useMemo(() => {
    const fronts: Record<string, FrontCompleteness> = {};
    spreadsheetData.forEach(row => {
      const name = row.product || 'TBD';
      if (!fronts[name]) {
        // Novos campos: evidenciamentoAsIs e insumosParaTestes
        const evidenciamentoOk = row.evidenciamentoAsIs === 'Ambiente Liberado' || row.evidenciamentoAsIs === 'Evidencias QA - OK';
        const insumosOk = row.insumosParaTestes === 'Responsável QA' || !row.insumosParaTestes?.includes('Impactado');
        
        fronts[name] = {
          frontName: name,
          flowKnowledge: row.flowKnowledge === 'OK',
          gherkinReady: row.gherkin === 'OK',
          evidenciamentoAsIsOk: evidenciamentoOk,
          insumosParaTestesOk: insumosOk,
          approvalRequestedEmail: row.approvalRequestedEmail === 'SIM',
          approvedByClient: row.approvedByClient === 'SIM',
          completionPercentage: 0,
          outOfScope: row.outOfScope,
          // Campos legados para retrocompatibilidade
          dataMassInfo: row.dataMass === 'OK' || insumosOk,
          envAccess: row.environment === 'OK' || evidenciamentoOk
        };
      } else {
        if (row.flowKnowledge === 'OK') fronts[name].flowKnowledge = true;
        if (row.gherkin === 'OK') fronts[name].gherkinReady = true;
        // Novos campos
        const evidenciamentoOk = row.evidenciamentoAsIs === 'Ambiente Liberado' || row.evidenciamentoAsIs === 'Evidencias QA - OK';
        const insumosOk = row.insumosParaTestes === 'Responsável QA' || !row.insumosParaTestes?.includes('Impactado');
        if (evidenciamentoOk) fronts[name].evidenciamentoAsIsOk = true;
        if (insumosOk) fronts[name].insumosParaTestesOk = true;
        // Legados
        if (row.dataMass === 'OK' || insumosOk) fronts[name].dataMassInfo = true;
        if (row.environment === 'OK' || evidenciamentoOk) fronts[name].envAccess = true;
        if (row.approvalRequestedEmail === 'SIM') fronts[name].approvalRequestedEmail = true;
        if (row.approvedByClient === 'SIM') fronts[name].approvedByClient = true;
        if (row.outOfScope) fronts[name].outOfScope = true;
      }
    });

    return Object.values(fronts).map(f => {
      if (f.outOfScope) return { ...f, completionPercentage: 0 };
      const items = [
        f.flowKnowledge, f.gherkinReady, 
        f.evidenciamentoAsIsOk, f.insumosParaTestesOk,
        f.approvalRequestedEmail, f.approvedByClient
      ];
      const completed = items.filter(Boolean).length;
      return { ...f, completionPercentage: Math.round((completed / 6) * 100) };
    });
  }, [spreadsheetData]);

  // DERIVED DATA: Executive Panel - Effectiveness
  const effectivenessData = useMemo(() => {
    const metrics: Record<string, EffectivenessMetric> = {};
    spreadsheetData.forEach(row => {
      const person = row.responsible || 'Sem Nome';
      if (!metrics[person]) {
        metrics[person] = { person, conductedAgendas: 0, pendingAgendas: 0, ineffectiveAgendas: 0, incompleteAgendas: 0, status: 'On Track' };
      }
      const s = row.status?.toLowerCase();
      if (s === 'realizada' || s === 'executado') metrics[person].conductedAgendas++;
      if (s === 'pendente') metrics[person].pendingAgendas++;
      if (s === 'inefetiva' || s === 'bloqueada') metrics[person].ineffectiveAgendas++;
    });
    return Object.values(metrics).filter(m => m.person !== 'N/A').map(m => ({
      ...m,
      status: m.ineffectiveAgendas > 1 ? 'Critical' : m.pendingAgendas > 2 ? 'Warning' : 'On Track'
    }));
  }, [spreadsheetData]);

  // DERIVED DATA: Executive Panel - Escalations
  const escalations = useMemo(() => {
    return spreadsheetData
      .filter(row => (row.daysBlocked && row.daysBlocked > 0) || row.status === 'Bloqueada')
      .map(row => ({
        id: row.id,
        qa: row.responsibleQA || 'QA Team',
        product: row.product || 'TBD',
        stakeholder: row.responsible || 'TBD',
        reason: row.escalationReason || row.notes || 'Bloqueio sem motivo especificado.',
        daysBlocked: row.daysBlocked || 0,
        priority: (row.priority as any) || 'Média',
        responsible: row.escalationResponsible || '-',
        status: row.escalationStatus || ' ',
        obs: row.escalationObs || '-'
      }));
  }, [spreadsheetData]);

  const stakeholderMap = useMemo(() => {
    const maps: Record<string, FrontStakeholderMapping> = {};
    spreadsheetData.forEach(row => {
      const name = row.product || 'TBD';
      if (!maps[name]) {
        maps[name] = {
          frontName: name,
          po: { name: row.responsible || 'TBD', role: row.role || 'PO' },
          techLead: { name: row.techLeadName || 'TBD', role: 'TL' },
          status: row.status === 'Realizada' ? 'Ativo' : row.status === 'Pendente' ? 'Pendente' : 'Mapeado'
        };
      }
    });
    return Object.values(maps);
  }, [spreadsheetData]);

  const executiveMetrics = useMemo(() => ({
    activeFronts: frontsCompleteness.filter(f => !f.outOfScope).length,
    mappedStakeholders: effectivenessData.length,
    status: 'Em Andamento',
    riskLevel: escalations.length > 3 ? 'Risco Alto' : 'Risco Controlado',
    goLiveDate: '01.JUL.2026'
  }), [frontsCompleteness, effectivenessData, escalations]);

  // Função auxiliar: calcular dias bloqueados a partir da data de acionamento
  const calculateDaysBlocked = (contactDate: string, status: string): number => {
    if (!contactDate || status === 'Realizada') return 0;
    const contact = new Date(contactDate);
    const today = new Date();
    const diffTime = today.getTime() - contact.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const updateRow = async (id: string, field: keyof SpreadsheetRow, value: any) => {
    setSpreadsheetData(prev => prev.map(r => {
      if (r.id !== id) return r;
      
      let updatedRow = { ...r, [field]: value };
      
      // LÓGICA ESPECIAL: Quando status muda para 'Inefetiva', move a data atual para o histórico
      if (field === 'status' && value === 'Inefetiva' && r.date) {
        const currentHistory = r.dateHistory || [];
        // Só adiciona se a data ainda não estiver no histórico
        if (!currentHistory.includes(r.date)) {
          updatedRow.dateHistory = [...currentHistory, r.date];
        }
      }
      
      // LÓGICA: Quando status sai de 'Inefetiva', limpa o histórico se necessário
      if (field === 'status' && r.status === 'Inefetiva' && value !== 'Inefetiva') {
        // Mantém o histórico, apenas limpa se for 'Realizada'
        if (value === 'Realizada') {
          updatedRow.dateHistory = [];
        }
      }
      
      // LÓGICA: Calcular dias bloqueados automaticamente quando contactDate é alterado
      if (field === 'contactDate') {
        updatedRow.daysBlocked = calculateDaysBlocked(value, r.status);
      }
      
      // LÓGICA: Recalcular dias bloqueados quando status muda
      if (field === 'status' && r.contactDate) {
        updatedRow.daysBlocked = calculateDaysBlocked(r.contactDate, value);
      }
      
      return updatedRow;
    }));
    
    if (isOnline) {
      try {
        // Se mudou para Inefetiva, também atualizar o dateHistory no banco
        if (field === 'status' && value === 'Inefetiva') {
          const row = spreadsheetData.find(r => r.id === id);
          if (row?.date) {
            const newHistory = [...(row.dateHistory || []), row.date];
            await dbUpdateRow(id, { [field]: value, dateHistory: newHistory });
            return;
          }
        }
        await dbUpdateRow(id, { [field]: value });
      } catch (err) {
        console.error('Erro ao atualizar no Supabase:', err);
      }
    }
  };

  const addRow = async () => {
    const newRow: SpreadsheetRow = {
      id: generateUUID(),
      gherkin: '', flowKnowledge: '',
      evidenciamentoAsIs: '', insumosParaTestes: '', acionamento: '',
      environment: '', dataMass: '', // legados
      outOfScope: false, responsibleQA: 'QA', product: '', 
      responsible: '', role: '', techLeadName: '',
      status: 'Pendente', contactDate: '', date: '', 
      dateHistory: [],
      daysBlocked: 0, priority: 'Media', notes: '', escalationReason: '',
      escalationResponsible: '', escalationStatus: ' ', escalationObs: '',
      approvalRequestedEmail: '', approvedByClient: ''
    };
    const newData = [newRow, ...spreadsheetData];
    setSpreadsheetData(newData);
    localStorage.setItem('ebv_qa_data', JSON.stringify(newData));
    
    if (isOnline) {
      try {
        await dbInsertRow(newRow);
      } catch (err) {
        console.error('Erro ao inserir no Supabase:', err);
      }
    }
  };

  const deleteRowHandler = async (id: string) => {
    const newData = spreadsheetData.filter(r => r.id !== id);
    setSpreadsheetData(newData);
    localStorage.setItem('ebv_qa_data', JSON.stringify(newData));
    
    if (isOnline) {
      try {
        await dbDeleteRow(id);
      } catch (err) {
        console.error('Erro ao deletar no Supabase:', err);
      }
    }
  };

  const SidebarItem: React.FC<{ id: string; icon: React.ReactNode; label: string }> = ({ id, icon, label }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      data-testid={`tab-${id}`}
      aria-label={label}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all ${
        activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
      }`}
    >
      {icon}
      {label && <span className="font-medium text-sm">{label}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900" data-testid="app-container">
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center" data-testid="loading-overlay">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="animate-spin text-blue-600" />
            <p className="text-slate-600 font-medium">Carregando dados...</p>
          </div>
        </div>
      )}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shrink-0" data-testid="sidebar">
        <div>
          <h1 className="text-xl font-bold text-blue-800 tracking-tight leading-tight">Studio QA</h1>
          <div className="mt-1 space-y-0.5">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Cliente: EBV</p>
            <p className="text-[10px] text-slate-500 font-bold">Projeto: CNPJ Alfa Numérico</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow overflow-y-auto pr-2">
          <SidebarItem id="spreadsheet" icon={<FileSpreadsheet size={20} />} label="Visão Planilha (Base)" />
          <SidebarItem id="executive" icon={<ShieldCheck size={20} />} label="Painel Executivo" />
          <SidebarItem id="stakeholders" icon={<Layers size={20} />} label="Mapa Stakeholders" />
          <SidebarItem id="logbook" icon={<BookOpen size={20} />} label="Diário de Bordo QA" />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">EBV</div>
            <div>
              <p className="text-sm font-semibold">QA Automation</p>
              <p className="text-xs text-slate-500">Mapeamento</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-grow flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {activeTab.replace('_', ' ')}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" data-testid="sync-indicator">
              {isOnline ? (
                <Cloud size={16} className="text-green-500" data-testid="online-indicator" />
              ) : (
                <CloudOff size={16} className="text-slate-400" data-testid="offline-indicator" />
              )}
              <span data-testid="sync-status" className={`text-xs font-medium px-2 py-1 rounded ${
                isOnline 
                  ? syncStatus === 'synced' 
                    ? 'bg-green-100 text-green-700' 
                    : syncStatus === 'syncing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {isOnline 
                  ? syncStatus === 'synced' 
                    ? 'Sincronizado (Supabase)' 
                    : syncStatus === 'syncing'
                    ? 'Sincronizando...'
                    : 'Erro de Sync'
                  : 'Modo Offline (Local)'
                }
              </span>
            </div>
            <span className="text-xs text-slate-400">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-8 bg-[#f8fafc]">
          {activeTab === 'spreadsheet' && (
            <SpreadsheetView 
              data={spreadsheetData} 
              onEdit={updateRow} 
              onAdd={addRow} 
              onDelete={deleteRowHandler}
              onScan={handleAIScan}
              isScanning={isScanning}
              onUpdateAndSave={handleUpdateAndSave}
              isUpdating={isUpdating}
              onExcelImport={handleExcelImport}
              isOnline={isOnline}
              onReload={reloadFromSupabase}
            />
          )}
          {activeTab === 'executive' && (
            <ExecutivePanelView 
              fronts={frontsCompleteness} 
              effectiveness={effectivenessData} 
              escalations={escalations} 
              metrics={executiveMetrics} 
            />
          )}
          {activeTab === 'stakeholders' && <MapaStakeholdersView mapping={stakeholderMap} />}
          {activeTab === 'logbook' && <LogbookView data={spreadsheetData} />}
        </div>
      </main>
    </div>
  );
};

/* --- SUBCOMPONENTS --- */

const SpreadsheetView: React.FC<{ 
  data: SpreadsheetRow[], 
  onEdit: (id: string, field: keyof SpreadsheetRow, value: any) => void,
  onAdd: () => void,
  onDelete: (id: string) => void,
  onScan: (e: React.ChangeEvent<HTMLInputElement>) => void,
  isScanning: boolean,
  onUpdateAndSave: () => void,
  isUpdating: boolean,
  onExcelImport: (e: React.ChangeEvent<HTMLInputElement>) => void,
  isOnline: boolean,
  onReload: () => void
}> = ({ data, onEdit, onAdd, onDelete, onScan, isScanning, onUpdateAndSave, isUpdating, onExcelImport, isOnline, onReload }) => {
  
  const handleExcelExport = () => {
    const exportData = data.map(row => ({
      'Produto (Frente)': row.product,
      'Gherkin': row.gherkin,
      'Evidenciamento As Is': row.evidenciamentoAsIs || '',
      'Fluxo': row.flowKnowledge,
      'Insumos p/ Testes': row.insumosParaTestes || '',
      'Fora Escopo': row.outOfScope ? 'true' : 'false',
      'Resp. QA': row.responsibleQA,
      'Data Acionamento': row.contactDate,
      'Stakeholder': row.responsible,
      'Função': row.role,
      'Tech Lead': row.techLeadName,
      'Status Agenda': row.status,
      'Acionamento': row.acionamento || '',
      'Data Agenda': row.date,
      'Aprovação Solicitada por email': row.approvalRequestedEmail,
      'Aprovado Pelo Cliente': row.approvedByClient,
      'Dias Bloq.': row.daysBlocked,
      'Motivo Bloqueio (Escalada)': row.escalationReason,
      'Prioridade': row.priority,
      'Responsável Escalation': row.escalationResponsible,
      'Status Escalation': row.escalationStatus,
      'OBS Escalation': row.escalationObs,
      'Observacoes': row.notes
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'QA Data');
    XLSX.writeFile(workbook, `StudioQA_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-140px)] max-w-[99%] mx-auto">
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl"><FileSpreadsheet size={24} /></div>
          <div>
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Backoffice Diário de Bordo</h3>
            <p className="text-xs font-medium text-slate-500">Gerencie a base de dados para alimentar os painéis executivos.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onReload}
            disabled={!isOnline}
            data-testid="btn-sync"
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-xl text-xs font-black hover:bg-slate-700 transition shadow-lg disabled:opacity-50"
            title="Recarregar dados do servidor"
          >
            <RefreshCw size={14} /> Sincronizar
          </button>

          <button 
            onClick={onUpdateAndSave}
            disabled={isUpdating}
            data-testid="btn-update-data"
            className={`flex items-center gap-2 px-4 py-2 ${isUpdating ? 'bg-slate-400' : 'bg-blue-600'} text-white rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-lg disabled:cursor-not-allowed`}
          >
            {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {isUpdating ? 'Salvando...' : 'Atualizar Dados'}
          </button>

          <button 
            onClick={handleExcelExport}
            data-testid="btn-export-excel"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition shadow-lg"
          >
            <FileDown size={14} /> Exportar Excel
          </button>

          <label className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition shadow-lg cursor-pointer text-center`} data-testid="btn-import-excel">
            <FileUp size={14} />
            Importar Excel
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={onExcelImport} data-testid="import-excel-input" />
          </label>
          
          <label className={`flex items-center gap-2 px-4 py-2 ${isScanning ? 'bg-slate-400' : 'bg-amber-500'} text-white rounded-xl text-xs font-black hover:bg-amber-600 transition shadow-lg cursor-pointer text-center`} data-testid="btn-scan-ai">
            {isScanning ? <Clock size={14} className="animate-spin" /> : <Scan size={14} />}
            {isScanning ? 'Lendo Imagem...' : 'Escanear IA'}
            {!isScanning && <input type="file" className="hidden" accept="image/*" onChange={onScan} data-testid="scan-ai-input" />}
          </label>
          
          <button 
            onClick={onAdd}
            data-testid="btn-add-row"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black hover:bg-green-700 transition shadow-lg"
          >
            <Plus size={14} /> Nova Linha
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-grow bg-white" data-testid="spreadsheet-container">
        <table className="w-full text-left text-[11px] border-collapse table-auto min-w-[4200px]" data-testid="spreadsheet-table">
          <thead className="sticky top-0 bg-slate-100 shadow-sm z-10 font-black uppercase tracking-widest text-slate-500">
            <tr>
              <th className="p-4 border-b border-r border-slate-200">Produto (Frente)</th>
              <th className="p-4 border-b border-r border-slate-200">Gherkin</th>
              <th className="p-4 border-b border-r border-slate-200 bg-purple-50 text-purple-700">Evidenciamento As Is</th>
              <th className="p-4 border-b border-r border-slate-200">Fluxo</th>
              <th className="p-4 border-b border-r border-slate-200 bg-purple-50 text-purple-700">Insumos p/ Testes</th>
              <th className="p-4 border-b border-r border-slate-200 text-center">Fora Escopo</th>
              <th className="p-4 border-b border-r border-slate-200">Resp. QA</th>
              <th className="p-4 border-b border-r border-slate-200">Data Acionamento</th>
              <th className="p-4 border-b border-r border-slate-200">Stakeholder</th>
              <th className="p-4 border-b border-r border-slate-200">Função</th>
              <th className="p-4 border-b border-r border-slate-200">Tech Lead</th>
              <th className="p-4 border-b border-r border-slate-200">Status Agenda</th>
              <th className="p-4 border-b border-r border-slate-200 bg-green-50 text-green-700">Acionamento</th>
              <th className="p-4 border-b border-r border-slate-200">Data Agenda</th>
              
              <th className="p-4 border-b border-r border-slate-200 bg-blue-50 text-blue-700">Aprovação Solicitada por email</th>
              <th className="p-4 border-b border-r border-slate-200 bg-blue-50 text-blue-700">Aprovado Pelo Cliente</th>
              
              <th className="p-4 border-b border-r border-slate-200 text-center">Dias Bloq.</th>
              <th className="p-4 border-b border-r border-slate-200">Motivo Bloqueio (Escalada)</th>
              <th className="p-4 border-b border-r border-slate-200">Prioridade</th>
              <th className="p-4 border-b border-r border-slate-200 bg-red-50 text-red-700">Responsável Escalation</th>
              <th className="p-4 border-b border-r border-slate-200 bg-red-50 text-red-700">Status Escalation</th>
              <th className="p-4 border-b border-r border-slate-200 bg-red-50 text-red-700">OBS Escalation</th>
              <th className="p-4 border-b border-r border-slate-200">Observações</th>
              <th className="p-4 border-b border-slate-200 text-center">Excluir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100" data-testid="spreadsheet-body">
            {data.map((row) => {
              const isEscalationDisabled = row.daysBlocked === 0 && row.status !== 'Bloqueada';
              return (
                <tr key={row.id} data-testid={`row-${row.id}`} data-row-id={row.id} className={`hover:bg-blue-50/40 transition-colors group ${row.outOfScope ? 'bg-slate-50/50 opacity-60' : ''}`}>
                  <td className="p-2 border-r border-slate-100" data-field="product">
                    <EditableInput value={row.product} onChange={(v) => onEdit(row.id, 'product', v)} bold />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="gherkin">
                    <EditableSelect value={row.gherkin || ''} onChange={(v) => onEdit(row.id, 'gherkin', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-purple-50/30" data-field="evidenciamentoAsIs">
                    <EditableSelectEvidenciamento value={row.evidenciamentoAsIs || ''} onChange={(v) => onEdit(row.id, 'evidenciamentoAsIs', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="flowKnowledge">
                    <EditableSelect value={row.flowKnowledge || ''} onChange={(v) => onEdit(row.id, 'flowKnowledge', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-purple-50/30" data-field="insumosParaTestes">
                    <EditableSelectAcionamento value={row.insumosParaTestes || ''} onChange={(v) => onEdit(row.id, 'insumosParaTestes', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100 text-center" data-field="outOfScope">
                    <input type="checkbox" checked={row.outOfScope} onChange={(e) => onEdit(row.id, 'outOfScope', e.target.checked)} className="w-4 h-4 rounded" data-testid="checkbox-out-of-scope" />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="responsibleQA">
                    <EditableInput value={row.responsibleQA} onChange={(v) => onEdit(row.id, 'responsibleQA', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="contactDate">
                    <input 
                      type="date" 
                      value={formatDateToISO(row.contactDate || '')} 
                      onChange={(e) => onEdit(row.id, 'contactDate', e.target.value)} 
                      data-testid="input-contact-date"
                      className="w-full bg-transparent border-0 text-center font-medium text-slate-600 text-[11px]"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="responsible">
                    <EditableInput value={row.responsible} onChange={(v) => onEdit(row.id, 'responsible', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="role">
                    <EditableInput value={row.role || ''} onChange={(v) => onEdit(row.id, 'role', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="techLeadName">
                    <EditableInput value={row.techLeadName || ''} onChange={(v) => onEdit(row.id, 'techLeadName', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="status">
                     <select 
                      value={row.status} 
                      onChange={(e) => onEdit(row.id, 'status', e.target.value)}
                      data-testid="select-status"
                      className={`w-full p-1 rounded font-black text-[10px] uppercase border-0 ${
                        row.status === 'Realizada' ? 'bg-green-50 text-green-700' : 
                        row.status === 'Inefetiva' ? 'bg-amber-50 text-amber-700' : 
                        row.status === 'Bloqueada' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Realizada">Realizada</option>
                      <option value="Inefetiva">Inefetiva</option>
                      <option value="Bloqueada">Bloqueada</option>
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-green-50/30" data-field="acionamento">
                    <EditableSelectAcionamento value={row.acionamento || ''} onChange={(v) => onEdit(row.id, 'acionamento', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100" data-field="date">
                    <DateCellWithHistory 
                      currentDate={row.date || ''}
                      dateHistory={row.dateHistory || []}
                      status={row.status}
                      onChange={(v) => onEdit(row.id, 'date', v)}
                    />
                  </td>

                  <td className="p-2 border-r border-slate-100 bg-blue-50/30">
                     <EditableBoolSelect 
                      value={row.approvalRequestedEmail || ''} 
                      onChange={(v) => onEdit(row.id, 'approvalRequestedEmail', v)} 
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-blue-50/30">
                     <EditableBoolSelect 
                      value={row.approvedByClient || ''} 
                      onChange={(v) => onEdit(row.id, 'approvedByClient', v)} 
                    />
                  </td>

                  <td className="p-2 border-r border-slate-100">
                    <input 
                      type="number" 
                      value={row.daysBlocked || 0} 
                      readOnly
                      title="Calculado automaticamente a partir da Data de Acionamento"
                      className="w-full bg-transparent border-0 text-center font-black text-red-600 cursor-not-allowed" 
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <EditableSelectMotivoBloqueio value={row.escalationReason || ''} onChange={(v) => onEdit(row.id, 'escalationReason', v)} />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <select value={row.priority || ''} onChange={(e) => onEdit(row.id, 'priority', e.target.value)} className="w-full bg-transparent border-0 font-black uppercase text-[10px]">
                      <option value="Baixa">Baixa</option>
                      <option value="Media">Média</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-red-50/30">
                    <EditableInput 
                      value={row.escalationResponsible || ''} 
                      onChange={(v) => onEdit(row.id, 'escalationResponsible', v)} 
                      disabled={isEscalationDisabled}
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-red-50/30">
                     <select 
                      value={row.escalationStatus || ' '} 
                      onChange={(e) => onEdit(row.id, 'escalationStatus', e.target.value)}
                      disabled={isEscalationDisabled}
                      className={`w-full p-1 rounded font-black text-[10px] uppercase border-0 bg-white/50 text-slate-700 ${isEscalationDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      <option value=" "> </option>
                      <option value="Aberto">Aberto</option>
                      <option value="Resolvido">Resolvido</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Aguardando Cliente">Aguardando Cliente</option>
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-red-50/30">
                    <EditableInput 
                      value={row.escalationObs || ''} 
                      onChange={(v) => onEdit(row.id, 'escalationObs', v)} 
                      disabled={isEscalationDisabled}
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <EditableInput 
                      value={row.notes || ''} 
                      onChange={(v) => onEdit(row.id, 'notes', v)} 
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => onDelete(row.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EditableInput: React.FC<{ 
  value: string; 
  onChange: (v: string) => void; 
  bold?: boolean; 
  center?: boolean;
  disabled?: boolean;
}> = ({ value, onChange, bold, center, disabled }) => (
  <input 
    type="text" 
    value={value} 
    onChange={(e) => onChange(sanitizeInput(e.target.value))}
    disabled={disabled}
    className={`w-full bg-transparent border-0 focus:bg-white focus:ring-1 focus:ring-blue-300 p-1 rounded ${bold ? 'font-black text-slate-800' : 'font-medium text-slate-600'} ${center ? 'text-center' : ''} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  />
);

const EditableSelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <select 
    value={value} 
    onChange={(e) => onChange(e.target.value)}
    className={`w-full p-1 rounded font-black text-[10px] border-0 ${
      value === 'OK' ? 'bg-green-100 text-green-700' : value === 'NOK' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'
    }`}
  >
    <option value="">-</option>
    <option value="OK">OK</option>
    <option value="NOK">NOK</option>
  </select>
);

// Novo: Select para Evidenciamento Axis (conforme aba Base coluna G)
const EditableSelectEvidenciamento: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const getStyle = () => {
    switch (value) {
      case 'Ambiente Liberado': return 'bg-green-100 text-green-700';
      case 'Evidencias QA - OK': return 'bg-green-100 text-green-700';
      case 'Evidencias Disponibilizadas': return 'bg-blue-100 text-blue-700';
      case 'Bloqueado - bug no Amb': return 'bg-red-100 text-red-700';
      case 'Impactado - Sem Insumos': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-400';
    }
  };
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-1 rounded font-black text-[9px] border-0 ${getStyle()}`}
    >
      <option value="">-</option>
      <option value="Ambiente Liberado">Ambiente Liberado</option>
      <option value="Bloqueado - bug no Amb">Bloqueado - bug no Amb</option>
      <option value="Evidencias Disponibilizadas">Evidencias Disponibilizadas</option>
      <option value="Evidencias QA - OK">Evidencias QA - OK</option>
      <option value="Impactado - Sem Insumos">Impactado - Sem Insumos</option>
    </select>
  );
};

// Novo: Select para Acionamento e Insumos para Testes (conforme aba Base coluna I)
const EditableSelectAcionamento: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const getStyle = () => {
    switch (value) {
      case 'Responsável QA': return 'bg-green-100 text-green-700';
      case 'Responsável Lider Tecnico': return 'bg-blue-100 text-blue-700';
      case 'GP - Necessário Envolver Áreas': return 'bg-purple-100 text-purple-700';
      case 'Impactado - Sem Insumos': return 'bg-amber-100 text-amber-700';
      case 'Área Envolvida - Comprometida': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-400';
    }
  };
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-1 rounded font-black text-[9px] border-0 ${getStyle()}`}
    >
      <option value="">-</option>
      <option value="Responsável QA">Responsável QA</option>
      <option value="Responsável Lider Tecnico">Responsável Lider Tecnico</option>
      <option value="GP - Necessário Envolver Áreas">GP - Necessário Envolver Áreas</option>
      <option value="Impactado - Sem Insumos">Impactado - Sem Insumos</option>
      <option value="Área Envolvida - Comprometida">Área Envolvida - Comprometida</option>
    </select>
  );
};

const EditableBoolSelect: React.FC<{ value: string; onChange: (v: 'SIM' | 'NÃO' | '') => void }> = ({ value, onChange }) => (
  <select 
    value={value} 
    onChange={(e) => onChange(e.target.value as any)}
    className={`w-full p-1 rounded font-black text-[10px] border-0 ${
      value === 'SIM' ? 'bg-green-100 text-green-700' : value === 'NÃO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'
    }`}
  >
    <option value="">-</option>
    <option value="SIM">SIM</option>
    <option value="NÃO">NÃO</option>
  </select>
);

// Novo: Select para Motivo do Bloqueio (conforme aba Base coluna K)
const EditableSelectMotivoBloqueio: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const getStyle = () => {
    switch (value) {
      case 'Agenda Indisponível': return 'bg-amber-100 text-amber-700';
      case 'Sem retorno': return 'bg-red-100 text-red-700';
      case 'Não Compareceu nas agendas': return 'bg-red-100 text-red-700';
      case 'Agenda Inefetiva': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-400';
    }
  };
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-1 rounded font-black text-[9px] border-0 ${getStyle()}`}
    >
      <option value="">-</option>
      <option value="Agenda Indisponível">Agenda Indisponível</option>
      <option value="Sem retorno">Sem retorno</option>
      <option value="Não Compareceu nas agendas">Não Compareceu nas agendas</option>
      <option value="Agenda Inefetiva">Agenda Inefetiva</option>
    </select>
  );
};

// Novo: Célula de Data com histórico de datas inefetivas (riscadas)
const DateCellWithHistory: React.FC<{ 
  currentDate: string; 
  dateHistory: string[]; 
  status: string;
  onChange: (v: string) => void 
}> = ({ currentDate, dateHistory, status, onChange }) => {
  
  // Verificar se a data é válida (não é epoch, não é placeholder)
  const isValidDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    if (dateStr === '1970-01-01' || dateStr === '01/01/1970') return false;
    if (dateStr.includes('dd') || dateStr.includes('mm') || dateStr.includes('aaaa')) return false;
    return true;
  };

  // Formatar data para exibição (dd/mm/yyyy)
  const formatDate = (dateStr: string): string => {
    if (!isValidDate(dateStr)) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  // Formatar data para input (yyyy-mm-dd)
  const formatForInput = (dateStr: string): string => {
    if (!isValidDate(dateStr)) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }
    return '';
  };
  
  // Filtrar histórico de datas para remover datas inválidas
  const validDateHistory = dateHistory?.filter(isValidDate) || [];

  return (
    <div className="flex flex-col gap-1">
      {/* Datas anteriores (inefetivas) - aparecem riscadas */}
      {dateHistory && dateHistory.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {dateHistory.map((histDate, idx) => (
            <span 
              key={idx} 
              className="text-[10px] text-slate-400 line-through text-center"
              title="Agenda inefetiva"
            >
              {formatDate(histDate)}
            </span>
          ))}
        </div>
      )}
      {/* Data atual */}
      <input 
        type="date" 
        value={formatForInput(currentDate)} 
        onChange={(e) => onChange(e.target.value)} 
        data-testid="input-agenda-date"
        className={`w-full bg-transparent border-0 text-center font-black text-[11px] ${
          status === 'Inefetiva' ? 'text-amber-600' : 'text-slate-800'
        }`}
      />
    </div>
  );
};

const ExecutivePanelView: React.FC<{ 
  fronts: FrontCompleteness[], 
  effectiveness: EffectivenessMetric[], 
  escalations: any[],
  metrics: any
}> = ({ fronts, effectiveness, escalations, metrics }) => {
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (exportRef.current === null) return;
    htmlToImage.toPng(exportRef.current, { 
      quality: 1, 
      backgroundColor: '#f8fafc',
      pixelRatio: 2
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `EBV-Executive-Panel.png`;
      link.href = dataUrl;
      link.click();
    });
  };

  return (
    <div className="space-y-8 pb-12" data-testid="executive-panel">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <h3 className="text-slate-500 text-sm font-black tracking-widest uppercase">Painel Executivo (Sincronizado via Backoffice)</h3>
        <button onClick={handleExport} data-testid="btn-export-image" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl font-black text-sm">
          <Download size={18} /> Exportar Imagem
        </button>
      </div>

      <div ref={exportRef} className="max-w-7xl mx-auto p-12 bg-slate-50 space-y-12">
        <div className="p-10 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl space-y-10">
          <h2 className="text-4xl font-black text-[#004e92] text-center tracking-tight">Status do Projeto – Visão Executiva</h2>
          
          <div className="grid grid-cols-3 gap-8 text-center" data-testid="kpi-cards">
            <div className="bg-[#00529b] text-white p-8 rounded-3xl" data-testid="kpi-frentes">
              <p className="text-5xl font-black">{metrics.activeFronts}</p>
              <p className="text-lg font-bold">Frentes Ativas</p>
            </div>
            <div className="bg-[#6aa84f] text-white p-8 rounded-3xl" data-testid="kpi-stakeholders">
              <p className="text-5xl font-black">{metrics.mappedStakeholders}</p>
              <p className="text-lg font-bold">Stakeholders</p>
            </div>
            <div className={`p-8 rounded-3xl border-4 ${metrics.riskLevel.includes('Alto') ? 'bg-red-50 border-red-500 text-red-600' : 'bg-green-50 border-green-500 text-green-600'}`} data-testid="kpi-risk">
              <p className="text-4xl font-black uppercase text-center leading-tight">EM<br/>ANDAMENTO</p>
              <p className="text-lg font-bold">{metrics.riskLevel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6" data-testid="fronts-completeness">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3"><Target className="text-blue-600" /> Plenitude Técnica (Evolução por Frente)</h4>
              {fronts.map(f => (
                <div key={f.frontName} data-testid={`front-${f.frontName.replace(/\s/g, '-').toLowerCase()}`} className={`p-6 rounded-2xl border ${f.outOfScope ? 'bg-slate-50 opacity-50' : 'bg-white shadow-sm space-y-4'} overflow-hidden`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800 text-lg uppercase truncate" title={f.frontName}>{f.frontName}</p>
                      {!f.outOfScope && (
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">
                          Evolução Consolidada: {f.completionPercentage}%
                        </p>
                      )}
                    </div>
                    <div className="p-2">
                      {f.outOfScope ? <Slash size={18} className="text-slate-300" /> : (f.completionPercentage === 100 ? <CheckCircle2 className="text-green-500" size={24} /> : <Clock className="text-amber-500" size={24} />)}
                    </div>
                  </div>

                  {!f.outOfScope ? (
                    <>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${f.completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                          style={{ width: `${f.completionPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <MiniPill active={f.flowKnowledge} label="Fluxo" />
                        <MiniPill active={f.gherkinReady} label="Gherkin" />
                        <MiniPill active={f.evidenciamentoAsIsOk} label="Evidenc. As Is" />
                        <MiniPill active={f.insumosParaTestesOk} label="Insumos" />
                        <MiniPill active={f.approvalRequestedEmail} label="Email Solic." />
                        <MiniPill active={f.approvedByClient} label="Aprov. Cli." />
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-slate-400">Fora de Escopo - Sem Ações QA</span>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6">
               <h4 className="text-xl font-black text-slate-800 flex items-center gap-3"><Users2 className="text-blue-600" /> Agenda & Stakeholders</h4>
               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 overflow-hidden">
                 <table className="w-full text-[11px] table-fixed">
                   <thead>
                     <tr className="text-slate-400 font-black uppercase border-b border-slate-100">
                       <th className="p-2 text-left w-[40%]">Stakeholder</th>
                       <th className="p-2 text-center w-[20%]">Realizada</th>
                       <th className="p-2 text-center w-[20%]">Pendente</th>
                       <th className="p-2 text-center w-[20%]">Inefetiva</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {effectiveness.map(m => (
                       <tr key={m.person}>
                         <td className="p-2 font-black text-slate-700 truncate" title={m.person}>{m.person}</td>
                         <td className="p-2 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg font-black">{m.conductedAgendas}</span></td>
                         <td className="p-2 text-center"><span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg font-black">{m.pendingAgendas}</span></td>
                         <td className="p-2 text-center"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black">{m.ineffectiveAgendas}</span></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               <h4 className="text-xl font-black text-slate-800 flex items-center gap-3 mt-8"><AlertTriangle className="text-red-600" /> Escalation - Monitoramento</h4>
               <div className="bg-white rounded-2xl border border-red-50 overflow-hidden shadow-md">
                 <table className="w-full text-[9px] table-fixed">
                   <thead className="bg-red-50 text-red-700 font-black uppercase">
                     <tr>
                       <th className="p-2 text-left w-[80px]">QA</th>
                       <th className="p-2 text-left w-[120px]">Frente</th>
                       <th className="p-2 text-left w-[100px]">Stakeholder</th>
                       <th className="p-2 text-center w-[50px]">Dias</th>
                       <th className="p-2 text-center w-[60px]">Prior.</th>
                       <th className="p-2 text-left w-[100px]">Resp. Esc.</th>
                       <th className="p-2 text-left w-[90px]">Status</th>
                       <th className="p-2 text-left w-[150px]">OBS</th>
                     </tr>
                   </thead>
                     <tbody className="divide-y divide-red-50">
                       {escalations.map(e => (
                         <tr key={e.id}>
                           <td className="p-2 font-black text-slate-500 whitespace-nowrap max-w-[80px] truncate" title={e.qa}>{e.qa}</td>
                           <td className="p-2 font-bold text-slate-700 max-w-[120px] truncate" title={e.product}>{e.product}</td>
                           <td className="p-2 max-w-[100px]">
                              <p className="font-black text-red-600 uppercase truncate" title={e.stakeholder}>{e.stakeholder}</p>
                           </td>
                           <td className="p-2 text-center font-black text-red-600 whitespace-nowrap">{e.daysBlocked}d</td>
                           <td className="p-2 text-center">
                             <span className="px-2 py-1 rounded-full bg-red-600 text-white font-black text-[8px] uppercase">{e.priority}</span>
                           </td>
                           <td className="p-2 font-bold text-slate-600 max-w-[100px] truncate" title={e.responsible}>{e.responsible}</td>
                           <td className="p-2 font-black text-amber-600 uppercase whitespace-nowrap">{e.status}</td>
                           <td className="p-2 text-slate-500 italic max-w-[150px] truncate" title={e.obs}>{e.obs}</td>
                         </tr>
                       ))}
                     </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniPill: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
    {label}
  </span>
);

const MapaStakeholdersView: React.FC<{ mapping: FrontStakeholderMapping[] }> = ({ mapping }) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto" data-testid="stakeholder-map">
      <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
        <Layers className="text-blue-600" /> Mapa de Frentes X Stakeholders
      </h3>
      <div className="grid grid-cols-3 gap-6" data-testid="stakeholder-cards">
        {mapping.map((map, idx) => (
          <div key={idx} data-testid={`stakeholder-card-${idx}`} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{map.status}</span>
            <h4 className="text-lg font-black text-slate-800 mt-4 mb-4">{map.frontName}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCircle2 size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">PO: {map.po.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">TL: {map.techLead.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LogbookView: React.FC<{ data: SpreadsheetRow[] }> = ({ data }) => {
  // Agrupar atividades por Resp. QA
  const activitiesByQA = useMemo(() => {
    const grouped: Record<string, SpreadsheetRow[]> = {};
    data.forEach(row => {
      const qa = row.responsibleQA || 'Não Atribuído';
      if (!grouped[qa]) grouped[qa] = [];
      grouped[qa].push(row);
    });
    return grouped;
  }, [data]);

  // Últimas atividades (ordenadas por data) - filtrar datas epoch
  const isValidDate = (dateStr: string | undefined): boolean => {
    if (!dateStr || dateStr.trim() === '') return false;
    if (dateStr.includes('1970')) return false;
    return /\d{4}-\d{2}-\d{2}/.test(dateStr) || /\d{2}\/\d{2}\/\d{4}/.test(dateStr);
  };

  const recentActivities = useMemo(() => {
    return [...data]
      .filter(row => isValidDate(row.date) || isValidDate(row.contactDate))
      .sort((a, b) => {
        const dateA = a.date || a.contactDate || '';
        const dateB = b.date || b.contactDate || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 15);
  }, [data]);

  // Resumo por status
  const statusSummary = useMemo(() => {
    const summary = { Realizada: 0, Pendente: 0, Inefetiva: 0, Bloqueada: 0 };
    data.forEach(row => {
      const status = row.status as keyof typeof summary;
      if (summary[status] !== undefined) summary[status]++;
    });
    return summary;
  }, [data]);

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="logbook">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <BookOpen className="text-blue-600" /> Diário de Bordo QA
        </h3>
        <div className="flex gap-4" data-testid="logbook-summary">
          <div className="bg-green-50 px-4 py-2 rounded-xl" data-testid="summary-realizadas">
            <span className="text-2xl font-black text-green-600">{statusSummary.Realizada}</span>
            <span className="text-xs font-bold text-green-600 ml-2">Realizadas</span>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-xl" data-testid="summary-pendentes">
            <span className="text-2xl font-black text-blue-600">{statusSummary.Pendente}</span>
            <span className="text-xs font-bold text-blue-600 ml-2">Pendentes</span>
          </div>
          <div className="bg-amber-50 px-4 py-2 rounded-xl" data-testid="summary-inefetivas">
            <span className="text-2xl font-black text-amber-600">{statusSummary.Inefetiva}</span>
            <span className="text-xs font-bold text-amber-600 ml-2">Inefetivas</span>
          </div>
          <div className="bg-red-50 px-4 py-2 rounded-xl" data-testid="summary-bloqueadas">
            <span className="text-2xl font-black text-red-600">{statusSummary.Bloqueada}</span>
            <span className="text-xs font-bold text-red-600 ml-2">Bloqueadas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Timeline de Atividades Recentes */}
        <div className="col-span-2 bg-white p-8 rounded-3xl border shadow-sm" data-testid="timeline-container">
          <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="text-blue-500" /> Atividades Recentes
          </h4>
          <div className="relative border-l-4 border-slate-100 ml-4 pl-8 space-y-6" data-testid="timeline">
            {recentActivities.map((row, idx) => (
              <div key={row.id} className="relative" data-testid={`timeline-entry-${idx}`}>
                <div className={`absolute -left-[38px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                  row.status === 'Realizada' ? 'bg-green-500' : 
                  row.status === 'Bloqueada' ? 'bg-red-500' : 
                  row.status === 'Inefetiva' ? 'bg-amber-500' : 'bg-blue-400'
                }`}></div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      {formatDateToDisplay(row.date) || formatDateToDisplay(row.contactDate) || 'Sem data'} • {row.responsibleQA}
                    </p>
                    <h5 className="text-sm font-bold text-slate-800 mt-1">{row.product || 'Sem produto'}</h5>
                    <p className="text-xs text-slate-500 mt-1">Stakeholder: {row.responsible || 'N/A'}</p>
                    {row.notes && (
                      <p className="text-xs text-slate-400 mt-2 italic flex items-center gap-1">
                        <MessageSquare size={12} /> {row.notes}
                      </p>
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                    row.status === 'Realizada' ? 'bg-green-100 text-green-700' : 
                    row.status === 'Bloqueada' ? 'bg-red-100 text-red-700' : 
                    row.status === 'Inefetiva' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-slate-400 text-sm">Nenhuma atividade com data registrada.</p>
            )}
          </div>
        </div>

        {/* Atividades por QA */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Users2 className="text-blue-500" /> Por Responsável QA
          </h4>
          <div className="space-y-4">
            {Object.entries(activitiesByQA).map(([qa, rows]) => {
              const realizadas = rows.filter(r => r.status === 'Realizada').length;
              const pendentes = rows.filter(r => r.status === 'Pendente').length;
              const bloqueadas = rows.filter(r => r.status === 'Bloqueada' || r.status === 'Inefetiva').length;
              
              return (
                <div key={qa} className="p-4 bg-slate-50 rounded-xl">
                  <p className="font-black text-slate-700 text-sm">{qa}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      {realizadas} ✓
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      {pendentes} ⏳
                    </span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      {bloqueadas} ⚠
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${(realizadas / rows.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
