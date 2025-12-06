// frontend-dashboard/app/page.tsx
"use client";

import { db } from '../utils/firebaseConfig';
import { collection, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import dynamic from 'next/dynamic'; // Importa o dynamic para o wrapper

// Importa os componentes de visualização
import DashboardChart from '../components/DashboardChart'; 
import FlowMap from '../components/FlowMap'; 
import LogModal from '../components/LogModal'; // Importa o Modal de Log
import ExecutiveDashboard from '../components/ExecutiveDashboard'; // Importa o componente original

// -----------------------------------------------------------------
// CORREÇÃO CRÍTICA DO MÓDULO: Cria o wrapper do Dashboard Executivo 
// AQUI para garantir que ele só carregue no cliente e resolva o erro 2307.
// -----------------------------------------------------------------
const ExecutiveDashboardClient = dynamic(() => import('../components/ExecutiveDashboard'), {
  ssr: false, // Desabilita a renderização no servidor para evitar o erro 'window is not defined'
});
// -----------------------------------------------------------------


// Interface ajustada para incluir client_id
interface Anomalia extends DocumentData {
  timestamp: string;
  metricName: string;
  value: number;
  host: string;
  causaRaiz: string;
  status: 'PENDENTE' | 'CORRIGIDO' | 'FALHA_CORRECAO';
  logID: string; 
  data_type: string;
  client_id: string; // CAMPO CRÍTICO PARA O FILTRO
}

const ALL_CLIENTS = 'TODOS_CLIENTES';
const FILTER_TYPES = ['TODOS', 'FLUXO_ONBOARDING', 'APLICACAO_AUTH', 'INFRA_TRANSACAO', 'FLUXO_SINISTRO', 'INFRA_DB_LOCKS'];

// Componente de Card (Tema Neon)
const Card: React.FC<{ title: string, value: number }> = ({ title, value }) => (
  // Tema Neon: bg-gray-900, border-neon, shadow-neon
  <div className={`bg-gray-900 p-6 rounded-lg border-neon shadow-sm shadow-cyan-500/20 transition duration-300 hover-neon`}>
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
  
  // Implementação do Log Modal
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
      setAnomalias(anomaliasData);
      
      console.log(`DEBUG: Sucesso! Documentos lidos do Firestore: ${anomaliasData.length}`);
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
    status: a.status as 'PENDENTE' | 'CORRIGIDO' | 'FALHA_CORRECAO'
  }));


  const openLogModal = (logID: string) => {
    setIsLogModalOpen(logID); // Abre o modal com o Log ID selecionado
  };

  return (
    // TEMA DARK BASE
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100"> 
        
      {/* RENDERIZA O MODAL DE LOGS SE HOUVER UM ID SELECIONADO */}
      {isLogModalOpen && (
          <LogModal 
              logID={isLogModalOpen} 
              onClose={() => setIsLogModalOpen(null)} 
          />
      )}

      {/* ========================================================= */}
      {/* 1. PAINEL PRINCIPAL (LAYOUT PRINCIPAL) */}
      {/* ========================================================= */}
      <header className="flex justify-start items-center mb-6">
          <h1 className="text-4xl font-extrabold text-cyan-400 tracking-wider">
              Painel de Monitoramento Multicliente (AIOps)
          </h1>
      </header>

      {/* --- FILTROS & KPIs (Seção Superior Otimizada) --- */}
      <section className="space-y-6 mb-8">
          
          {/* BLOCo 1: SELEÇÃO DE CLIENTE (Melhoria de UX/UI) */}
          <div className="bg-gray-900 p-4 rounded-lg border-neon shadow-sm shadow-cyan-500/20">
              <h3 className="text-xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">
                  1. Seleção de Clientes
              </h3>
              <div className="flex flex-wrap gap-2">
                  {clients.map((client) => (
                    <button
                      key={client}
                      onClick={() => setSelectedClient(client)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition duration-150 border 
                        ${selectedClient === client 
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/40' 
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                    >
                      {client.replace('_', ' ')}
                    </button>
                  ))}
              </div>
          </div>
          
          {/* BLOCo 2: FILTROS DE FLUXO E KPIs (Horizontal) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Coluna 1: Filtros de Tipo */}
              <div className="lg:col-span-1 bg-gray-900 p-4 rounded-lg border-neon shadow-sm shadow-cyan-500/20">
                  <h3 className="text-xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">
                      2. Filtros de Fluxo
                  </h3>
                  <div className="flex flex-col space-y-2">
                      {FILTER_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`w-full text-left px-3 py-1 rounded-md text-sm font-medium transition duration-150 border 
                            ${filterType === type 
                              ? 'bg-cyan-600 text-white border-cyan-500' 
                              : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            }`}
                        >
                          {type.replace('_', ' ')} ({anomalias.filter(a => a.data_type === type && (selectedClient === ALL_CLIENTS || a.client_id === selectedClient)).length})
                        </button>
                      ))}
                  </div>
              </div>

              {/* Colunas 2-4: KPIs */}
              <div className="lg:col-span-3 grid grid-cols-3 gap-6">
                  <Card title="Total Anomalias Filtradas" value={filteredAnomalias.length} />
                  <Card title="Pendentes de Correção" value={filteredAnomalias.filter(a => a.status === 'PENDENTE').length} />
                  <Card title="Corrigidas (Robô)" value={filteredAnomalias.filter(a => a.status === 'CORRIGIDO').length} />
              </div>
          </div>

      </section>
      
      {/* --- DASHBOARD EXECUTIVO (Indicadores de Nível Milionário) --- */}
      <section className="space-y-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
              3. Indicadores Executivos e Visualizações
          </h2>
          <div className="bg-gray-900 p-6 rounded-lg border-neon shadow-xl shadow-cyan-500/20">
              {/* Integra o Dashboard Executivo (Gráficos, Barra, Donut/Pie) */}
              <ExecutiveDashboardClient anomalias={filteredAnomalias} />
          </div>
      </section>
      
      {/* --- MAPA DE FLUXO E ARQUITETURA --- */}
      <section className="space-y-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
              4. Mapa de Erros no Fluxo de Serviço (Visão de Arquitetura)
          </h2>
          {selectedClient !== ALL_CLIENTS && filteredAnomalias.length > 0 && filterType !== 'TODOS' ? (
              <FlowMap 
                  client={selectedClient}
                  flowType={filterType}
                  anomalies={mapAnomalies}
              />
          ) : (
              <div className="bg-gray-900 p-6 rounded-lg text-gray-400 border-neon">
                  Selecione um **Cliente E** um **Tipo de Fluxo** específico para visualizar o mapa de arquitetura e diagnosticar o erro.
              </div>
          )}
      </section>
      
      {/* --- GRÁFICOS (Time Series e Performance) --- */}
      <section className="space-y-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
              5. Análise Gráfica de Performance (Time Series)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(chartDataGrouped).length === 0 ? (
                  <div className="p-6 bg-gray-900 rounded-lg text-center text-gray-400 border-neon md:col-span-2">
                      Nenhuma anomalia filtrada para plotar os gráficos de série temporal.
                  </div>
              ) : (
                  Object.keys(chartDataGrouped).map(metricKey => (
                    <DashboardChart
                      key={metricKey}
                      title={metricKey.split('_').join(' ')}
                      data={chartDataGrouped[metricKey]}
                    />
                  ))
              )}
          </div>
      </section>

      
      {/* --- TABELA DE ANOMALIAS (Logs Estruturados) --- */}
      <section>
          <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">
              6. Anomalias Filtradas ({filteredAnomalias.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 shadow-xl rounded-lg border-neon">
              <thead className="bg-gray-800">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Cliente</th> 
                  <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Tipo</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Timestamp (BR)</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Métrica</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Causa Raiz (IA)</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Status Robô</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Log</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnomalias.map((a, index) => (
                  <tr key={a.logID || index} className="border-b border-gray-700 hover:bg-gray-700/50 transition duration-150">
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
                    <td className="py-3 px-4 text-gray-300">{a.metricName} ({a.value.toFixed(2)})</td>
                    <td className="py-3 px-4 text-gray-300">{a.causaRaiz}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                        ${a.status === 'CORRIGIDO' ? 'bg-green-600 text-white' : 
                          a.status === 'PENDENTE' ? 'bg-yellow-600 text-gray-900' : 'bg-red-600 text-white'
                        } shadow-md`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => openLogModal(a.logID)} 
                        className="text-cyan-400 hover:text-cyan-300 font-medium disabled:opacity-50"
                        disabled={!a.logID}
                      >
                        Ver Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </section>
    </div>
  );
}