// frontend-dashboard/app/page.tsx
"use client";

import { db } from '../utils/firebaseConfig';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  DocumentData,
  doc, 
  updateDoc 
} from 'firebase/firestore'; 
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import dynamic from 'next/dynamic'; 
// REMOVIDO: Import Image from 'next/image' (usaremos <img> nativa para o CSS complexo do logo)

// Ícones
import { FiBarChart2, FiHardDrive, FiUsers } from 'react-icons/fi'; 

// Componentes
import DashboardChart from '../components/DashboardChart'; 
import FlowMap from '../components/FlowMap'; 
import LogModal from '../components/LogModal'; 

// Importação Dinâmica para SSR
const ExecutiveDashboardClient = dynamic(() => import('../components/ExecutiveDashboard'), {
  ssr: false, 
});


// Interface ajustada para incluir client_id
interface Anomalia extends DocumentData {
  timestamp: string;
  metricName: string;
  value: number;
  host: string;
  causaRaiz: string;
  status: 'NORMAL' | 'TICKET_ABERTO' | 'EM_ESCALONAMENTO' | 'CORRIGIDO_SUCESSO' | 'CORRIGIDO_FALHA';
  logID: string; 
  data_type: string;
  client_id: string; // CAMPO CRÍTICO PARA O FILTRO
  ticket_id?: string; // NOVO CAMPO PARA O ID DO TICKET
}

const ALL_CLIENTS = 'TODOS_CLIENTES';
const FILTER_TYPES = ['TODOS', 'FLUXO_ONBOARDING', 'APLICACAO_AUTH', 'INFRA_TRANSACAO', 'FLUXO_SINISTRO', 'INFRA_DB_LOCKS'];

// Mapeamento de Status para Cor e Texto (Melhor Prática de UI)
const STATUS_MAP = {
    'TICKET_ABERTO': { text: 'TICKET ABERTO', class: 'bg-blue-600 text-white pulse-cyan' },
    'EM_ESCALONAMENTO': { text: 'ESCALONADO', class: 'bg-yellow-600 text-gray-900' }, 
    'CORRIGIDO_SUCESSO': { text: 'CORRIGIDO (AIOps)', class: 'bg-green-600 text-white' },
    'CORRIGIDO_FALHA': { text: 'FALHA CORREÇÃO', class: 'bg-red-600 text-white' },
    'NORMAL': { text: 'NORMAL', class: 'bg-gray-700 text-gray-300' },
};


// Componente de Card (Tema Neon)
const Card: React.FC<{ title: string, value: number }> = ({ title, value }) => (
  <div className={`card-neon p-6 rounded-xl transition duration-300`}>
    <p className="text-sm font-medium text-gray-400">{title}</p>
    <p className="text-4xl font-extrabold mt-2 text-white">
        <span className="text-cyan-400">{value}</span>
    </p>
  </div>
);


export default function Home() {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [filterType, setFilterType] = useState<string>('TODOS'); 
  const [selectedClient, setSelectedClient] = useState<string>(ALL_CLIENTS); 
  const [isLogModalOpen, setIsLogModalOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
        console.error("ERRO CRÍTICO: Firebase DB não inicializado.");
        return;
    }

    const q = query(collection(db, "anomalias"), orderBy("timestamp", "desc")); 
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const anomaliasData: Anomalia[] = [];
      querySnapshot.forEach((doc) => {
        anomaliasData.push(doc.data() as Anomalia);
      });
      setAnomalias(anomaliasData.filter(a => a.status !== 'NORMAL'));
    }, (error) => {
        console.error("DEBUG: ERRO na Leitura do Firestore:", error.code, error.message);
    });

    return () => unsubscribe();
  }, []);

  // 1. EXTRAI LISTA ÚNICA DE CLIENTES 
  const clients = useMemo(() => {
    const clientList = anomalias
        .map(a => a.client_id)
        .filter((id): id is string => id !== undefined && id !== null && id.length > 0); 
    
    return [ALL_CLIENTS, ...Array.from(new Set(clientList))];
  }, [anomalias]);
  
  // 2. FILTRO BASEADO EM CLIENTE E TIPO
  const filteredAnomalias = anomalias.filter(a => 
    (selectedClient === ALL_CLIENTS || a.client_id === selectedClient) &&
    (filterType === 'TODOS' || a.data_type === filterType)
  );

  // 3. AGRUPA DADOS FILTRADOS POR MÉTRICA PARA OS GRÁFICOS
  const chartDataGrouped = useMemo(() => {
    const groups: { [key: string]: Anomalia[] } = {};
    if (filteredAnomalias.length > 0) {
        filteredAnomalias.forEach(a => {
            if (!a.metricName) return; 
            
            const key = a.metricName;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(a);
        });
    }
    return groups;
  }, [filteredAnomalias]);

  // 4. PREPARA DADOS PARA O MAPA DE FLUXO
  const mapAnomalies = filteredAnomalias.map(a => ({
    host: a.host,
    status: (a.status === 'CORRIGIDO_SUCESSO' ? 'CORRIGIDO' : 'PENDENTE') as 'PENDENTE' | 'CORRIGIDO' | 'FALHA_CORRECAO'
  }));


  const openLogModal = (logID: string) => {
    setIsLogModalOpen(logID);
  };

  // FUNÇÃO DE ESCALONAMENTO CORRIGIDA COM SINTAXE V9
  const handleEscalation = (anomaly: Anomalia) => {
    const anomalyRef = doc(db, 'anomalias', anomaly.logID);
    updateDoc(anomalyRef, { status: 'EM_ESCALONAMENTO' });
    alert(`Anomalia ${anomaly.logID} escalonada para o time SRE. Status atualizado.`);
  };

  const handleClientSelect = (client: string) => {
      setSelectedClient(client);
      if (client !== ALL_CLIENTS && filterType === 'TODOS' && FILTER_TYPES.length > 1) {
          setFilterType(FILTER_TYPES.find(type => type !== 'TODOS') || 'TODOS'); 
      }
  };

  const handleFlowTypeSelect = (type: string) => {
    setFilterType(type);
    if (type !== 'TODOS' && selectedClient === ALL_CLIENTS && clients.length > 1) {
        setSelectedClient(clients.find(client => client !== ALL_CLIENTS) || ALL_CLIENTS);
    }
  };


  return (
    // TEMA DARK BASE
    <div className="min-h-screen bg-gray-950 text-gray-100"> 
        
      {isLogModalOpen && (
          <LogModal 
              logID={isLogModalOpen} 
              onClose={() => setIsLogModalOpen(null)} 
          />
      )}

      {/* ========================================================= */}
      {/* CABEÇALHO COM LOGO DOMINANTE E CENTRALIZADO */}
      {/* ========================================================= */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-xl py-6 mb-8 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center">
              
              {/* Contêiner do Logo com Efeito Neon (AGORA REDONDO E XL) */}
              <div className="flex flex-col items-center justify-center mb-4 space-y-2">
                  <div className="logo-hero xl border-neon pulse-cyan">
                      {/* Usando <img> nativa para o CSS customizado */}
                      <img src="/logo_lr_monitor.jpeg" alt="LR Monitor" />
                  </div>
                  
                  {/* Título Secundário */}
                  <h1 className="text-xl font-extrabold text-cyan-400 tracking-wide">
                      Dashboard Operacional AIOps
                  </h1>
              </div>

              {/* Linha Divisória */}
              <div className="w-full h-px bg-gray-700 mt-2"></div>
          </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (Centralizado e Alinhado) */}
      <div className="max-w-7xl mx-auto px-6 p-4"> 
        
        {/* --- 1. FILTROS DE CLIENTE --- */}
        <section className="space-y-6 mb-8">
            <div className="bg-gray-900/70 p-5 rounded-lg border-neon shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">
                    Seleção de Contas Monitoradas
                </h3>
                <div className="flex flex-wrap gap-3">
                    {clients.map((client) => (
                      <button
                        key={client}
                        onClick={() => handleClientSelect(client)}
                        className={`px-5 py-2.5 rounded-lg text-lg font-bold tracking-wider transition duration-200 
                          ${selectedClient === client 
                            ? 'bg-cyan-600 text-white border-neon shadow-cyan-500/50 pulse-cyan' 
                            : 'bg-gray-800 text-gray-300 border border-gray-700 hover-neon' 
                          }`}
                      >
                        {client.replace('_', ' ')}
                      </button>
                    ))}
                </div>
            </div>
        </section>

        {/* --- 2. FILTROS DE FLUXO & KPIs --- */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
            
            {/* Coluna 1: Filtros de Tipo */}
            <div className="lg:col-span-1 bg-gray-900/70 p-5 rounded-lg border-neon shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">
                    Seleção de Jornada (Ativa Mapa)
                </h3>
                <div className="flex flex-col space-y-3">
                    {FILTER_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleFlowTypeSelect(type)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-base font-medium transition duration-200 border 
                          ${filterType === type 
                            ? 'bg-cyan-600 text-white border-neon shadow-cyan-500/50 pulse-cyan' 
                            : 'bg-gray-800 text-gray-300 border border-gray-700 hover-neon' 
                          }`}
                      >
                        {type.replace('_', ' ')} ({anomalias.filter(a => a.data_type === type && (selectedClient === ALL_CLIENTS || a.client_id === selectedClient)).length})
                      </button>
                    ))}
                </div>
            </div>

            {/* Colunas 2-4: KPIs */}
            <div className="lg:col-span-3 grid grid-cols-3 gap-6">
                <Card title="Total Anomalias Ativas" value={filteredAnomalias.length} />
                <Card title="Tickets Abertos (Escalonamento)" value={filteredAnomalias.filter(a => a.status === 'TICKET_ABERTO' || a.status === 'CORRIGIDO_FALHA').length} />
                <Card title="Corrigidas (AIOps Sucesso)" value={filteredAnomalias.filter(a => a.status === 'CORRIGIDO_SUCESSO').length} />
            </div>

        </section>
        
        {/* ========================================================= */}
        {/* 3. GESTÃO DE INCIDENTES (ORQUESTRAÇÃO DE TICKETS) */}
        {/* ========================================================= */}
        <section className="space-y-6 mb-10">
            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
                Gestão de Incidentes (Fila de Trabalho)
            </h2>
            <div className="chart-box p-6 rounded-lg shadow-xl">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">
                  Incidentes Pendentes de Ação Manual ou Escalonamento
              </h3>
              
              {/* LAYOUT DE CARDS PARA FILAS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Fila 1: FALHA CORREÇÃO (Máxima Prioridade) */}
                  <div className="bg-red-700/80 p-6 rounded-xl border border-red-500 shadow-xl pulse-red">
                      <p className="text-sm font-medium text-white">FALHA CORREÇÃO (Reaberto)</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-5xl font-extrabold text-white">
                            {filteredAnomalias.filter(a => a.status === 'CORRIGIDO_FALHA').length}
                        </p>
                        <FiBarChart2 className="w-12 h-12 text-red-300 opacity-60" /> 
                      </div>
                      <p className="text-xs text-red-200 mt-3 border-t border-red-600 pt-2">Exige atenção imediata e escalonamento manual.</p>
                  </div>

                  {/* Fila 2: TICKET ABERTO (Aguardando Robô) */}
                  <div className="bg-blue-700/80 p-6 rounded-xl border border-blue-500 shadow-xl">
                      <p className="text-sm font-medium text-white">TICKET ABERTO (Robô Acionado)</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-5xl font-extrabold text-white">
                            {filteredAnomalias.filter(a => a.status === 'TICKET_ABERTO').length}
                        </p>
                        <FiHardDrive className="w-12 h-12 text-blue-300 opacity-60" /> 
                      </div>
                      <p className="text-xs text-blue-200 mt-3 border-t border-blue-600 pt-2">Aguardando resultado da autocorreção.</p>
                  </div>

                  {/* Fila 3: EM ESCALONAMENTO (Operador) */}
                  <div className="bg-yellow-600/80 p-6 rounded-xl border border-yellow-500 shadow-xl">
                      <p className="text-sm font-medium text-gray-900">EM ESCALONAMENTO (Operador)</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-5xl font-extrabold text-gray-900">
                            {filteredAnomalias.filter(a => a.status === 'EM_ESCALONAMENTO').length}
                        </p>
                        <FiUsers className="w-12 h-12 text-gray-900 opacity-60" /> 
                      </div>
                      <p className="text-xs text-gray-800 mt-3 border-t border-yellow-700 pt-2">Incidente em fila SRE/NOC no sistema externo.</p>
                  </div>
              </div>
            </div>
        </section>


        {/* --- 4. DASHBOARD EXECUTIVO --- */}
        <section className="space-y-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
                Indicadores Executivos e Visualizações
            </h2>
            <div className="chart-box p-6 rounded-lg shadow-xl">
                <ExecutiveDashboardClient anomalias={filteredAnomalias} />
            </div>
        </section>
        
        {/* --- 5. MAPA DE FLUXO E ARQUITETURA --- */}
        <section className="space-y-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
                Mapa de Erros no Fluxo de Serviço (Visão de Arquitetura)
            </h2>
            <div className="chart-box p-6 rounded-lg shadow-xl">
                {selectedClient !== ALL_CLIENTS && filteredAnomalias.length > 0 && filterType !== 'TODOS' ? (
                    <FlowMap 
                        client={selectedClient}
                        flowType={filterType}
                        anomalies={mapAnomalies}
                    />
                ) : (
                    <div className="text-gray-400 p-4 text-center">
                        Selecione um **Cliente E** um **Tipo de Fluxo** (acima) para visualizar o mapa de arquitetura.
                    </div>
                )}
            </div>
        </section>
        
        {/* --- 6. GRÁFICOS (Time Series e Performance) --- */}
        <section className="space-y-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
                Análise Gráfica de Performance (Time Series)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(chartDataGrouped).length === 0 ? (
                    <div className="chart-box p-6 rounded-lg text-center text-gray-400 md:col-span-2">
                        Nenhuma anomalia filtrada para plotar os gráficos de série temporal.
                    </div>
                ) : (
                    Object.keys(chartDataGrouped).map(metricKey => (
                      <div key={metricKey} className="chart-box p-6 rounded-lg">
                          <DashboardChart
                            title={metricKey.split('_').join(' ')}
                            data={chartDataGrouped[metricKey]}
                          />
                      </div>
                    ))
                )}
            </div>
        </section>

        
        {/* --- 7. TABELA DE ANOMALIAS (Logs Estruturados) --- */}
        <section>
            <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">
                Logs de Anomalias (Para Diagnóstico)
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-neon">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Ticket ID</th> 
                    <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Cliente</th> 
                    <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Tipo</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Timestamp (BR)</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Causa Raiz (IA)</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Status</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnomalias.map((a, index) => {
                    const statusInfo = STATUS_MAP[a.status] || STATUS_MAP.TICKET_ABERTO;
                    
                    const needsEscalation = a.status === 'TICKET_ABERTO' || a.status === 'CORRIGIDO_FALHA';
                    
                    return (
                      <tr key={a.logID || index} className="border-b border-gray-700 hover:bg-gray-700/50 transition duration-150">
                        
                        <td className="py-3 px-4 text-blue-400 font-medium">{a.ticket_id || 'N/A'}</td>

                        <td className="py-3 px-4 font-bold text-gray-200">{a.client_id?.replace('_', ' ') || 'N/A'}</td> 
                        <td className="py-3 px-4 text-gray-300">{a.data_type?.split('_').join(' ') || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-300">
                          {new Date(a.timestamp).toLocaleString('pt-BR', { 
                            timeZone: 'America/Sao_Paulo', 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                          })}
                        </td>
                        <td className="py-3 px-4 text-gray-300">{a.causaRaiz}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.class}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex flex-col space-y-1">
                          <button 
                            onClick={() => openLogModal(a.logID)} 
                            className="text-cyan-400 hover:text-cyan-300 font-medium disabled:opacity-50"
                            disabled={!a.logID}
                          >
                            Ver Log
                          </button>
                          {needsEscalation && (
                              <button
                                  onClick={() => handleEscalation(a)}
                                  className="text-red-400 hover:text-red-300 font-medium text-xs underline mt-1"
                              >
                                  Escalonar (Manual)
                              </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </section>
      </div> {/* Fim do Conteúdo Principal */}
    </div>
  );
}