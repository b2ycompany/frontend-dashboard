// frontend-dashboard/app/page.tsx
"use client";

import { db } from '../utils/firebaseConfig';
import { collection, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import dynamic from 'next/dynamic'; 

// Importa os componentes de visualização
import DashboardChart from '../components/DashboardChart'; 
import FlowMap from '../components/FlowMap'; 
import LogModal from '../components/LogModal'; 
import ExecutiveDashboard from '../components/ExecutiveDashboard';

// Importação Dinâmica para SSR
const ExecutiveDashboardClient = dynamic(() => import('../components/ExecutiveDashboard'), {
  ssr: false, 
});


// Interface ajustada
interface Anomalia extends DocumentData {
  timestamp: string;
  metricName: string;
  value: number;
  host: string;
  causaRaiz: string;
  status: 'PENDENTE' | 'CORRIGIDO' | 'FALHA_CORRECAO';
  logID: string; 
  data_type: string;
  client_id: string; 
}

const ALL_CLIENTS = 'TODOS_CLIENTES';
const FILTER_TYPES = ['TODOS', 'FLUXO_ONBOARDING', 'APLICACAO_AUTH', 'INFRA_TRANSACAO', 'FLUXO_SINISTRO', 'INFRA_DB_LOCKS'];

// Componente de Card (Design Light Mode Profissional)
const Card: React.FC<{ title: string, value: number }> = ({ title, value }) => (
  // Design Light: Fundo branco, sombra sutil, borda de foco
  <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-lg transition duration-300 hover:shadow-cyan-200`}>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="text-4xl font-extrabold mt-2 text-gray-900">
        <span className="text-cyan-600">{value}</span>
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
      setAnomalias(anomaliasData);
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
    setIsLogModalOpen(logID);
  };

  // Funções de manipulação de filtro OTIMIZADAS PARA O MAPA
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
    // NOVO TEMA: Fundo cinza claro
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900"> 
        
      {isLogModalOpen && (
          <LogModal 
              logID={isLogModalOpen} 
              onClose={() => setIsLogModalOpen(null)} 
          />
      )}

      {/* ========================================================= */}
      {/* 1. PAINEL PRINCIPAL (LAYOUT PRINCIPAL) */}
      {/* ========================================================= */}
      <header className="flex justify-start items-center mb-10">
          <h1 className="text-5xl font-extrabold text-cyan-600 tracking-wider">
              Painel de Monitoramento Multicliente (AIOps)
          </h1>
      </header>

      {/* --- FILTROS & KPIs (Seção Superior Otimizada) --- */}
      <section className="space-y-6 mb-12">
          
          {/* BLOCo 1: SELEÇÃO DE CLIENTE (Design Profissional) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-2">
                  1. Seleção de Contas Monitoradas
              </h3>
              <div className="flex flex-wrap gap-4">
                  {clients.map((client) => (
                    <button
                      key={client}
                      onClick={() => handleClientSelect(client)}
                      // BOTÃO LIGHT MODE: Foco no azul ciano sólido quando selecionado
                      className={`px-6 py-3 rounded-lg text-lg font-semibold transition duration-200 border-2 
                        ${selectedClient === client 
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-300/50' // Selecionado: Cor sólida
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' // Não Selecionado: Fundo clean
                        }`}
                    >
                      {client.replace('_', ' ')}
                    </button>
                  ))}
              </div>
          </div>
          
          {/* BLOCo 2: FILTROS DE FLUXO E KPIs (Horizontal) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Coluna 1: Filtros de Tipo */}
              <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-2">
                      2. Filtros de Jornada (Ativa Mapa)
                  </h3>
                  <div className="flex flex-col space-y-3">
                      {FILTER_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => handleFlowTypeSelect(type)}
                          // BOTÃO LIGHT MODE: Foco no azul ciano sólido quando selecionado
                          className={`w-full text-left px-4 py-2.5 rounded-md text-base font-medium transition duration-200 border 
                            ${filterType === type 
                              ? 'bg-cyan-600 text-white border-cyan-600' // Selecionado: Cor sólida
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' // Não Selecionado: Fundo clean
                            }`}
                        >
                          {type.replace('_', ' ')} ({anomalias.filter(a => a.data_type === type && (selectedClient === ALL_CLIENTS || a.client_id === selectedClient)).length})
                        </button>
                      ))}
                  </div>
              </div>

              {/* Colunas 2-4: KPIs */}
              <div className="lg:col-span-3 grid grid-cols-3 gap-8">
                  <Card title="Total Anomalias Filtradas" value={filteredAnomalias.length} />
                  <Card title="Pendentes de Correção" value={filteredAnomalias.filter(a => a.status === 'PENDENTE').length} />
                  <Card title="Corrigidas (Robô)" value={filteredAnomalias.filter(a => a.status === 'CORRIGIDO').length} />
              </div>
          </div>

      </section>
      
      {/* --- DASHBOARD EXECUTIVO (Indicadores de Nível Milionário) --- */}
      <section className="space-y-6 mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 border-b border-gray-300 pb-2">
              3. Indicadores Executivos e Visualizações
          </h2>
          {/* CONTAINER BRANCO PARA O EXECUTIVE DASHBOARD */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xl">
              {/* Nota: O ExecutiveDashboard em si DEVE ser adaptado internamente para Light Mode,
                 especialmente os gráficos (eixos, legendas). */}
              <ExecutiveDashboardClient anomalias={filteredAnomalias} />
          </div>
      </section>
      
      {/* --- MAPA DE FLUXO E ARQUITETURA --- */}
      <section className="space-y-6 mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 border-b border-gray-300 pb-2">
              4. Mapa de Erros no Fluxo de Serviço (Visão de Arquitetura)
          </h2>
          {/* CONTAINER BRANCO PARA O FLOW MAP */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xl">
              {selectedClient !== ALL_CLIENTS && filteredAnomalias.length > 0 && filterType !== 'TODOS' ? (
                  // Nota: O FlowMap.tsx também deve ter seu background ajustado internamente.
                  <FlowMap 
                      client={selectedClient}
                      flowType={filterType}
                      anomalies={mapAnomalies}
                  />
              ) : (
                  <div className="text-gray-500 p-4 text-center">
                      Selecione um **Cliente E** um **Tipo de Fluxo** para visualizar o mapa de arquitetura.
                  </div>
              )}
          </div>
      </section>
      
      {/* --- GRÁFICOS (Time Series e Performance) --- */}
      <section className="space-y-6 mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 border-b border-gray-300 pb-2">
              5. Análise Gráfica de Performance (Time Series)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.keys(chartDataGrouped).length === 0 ? (
                  <div className="p-6 bg-white rounded-lg text-center text-gray-500 border border-gray-200 md:col-span-2 shadow-lg">
                      Nenhuma anomalia filtrada para plotar os gráficos de série temporal.
                  </div>
              ) : (
                  // CONTAINER BRANCO PARA CADA GRÁFICO INDIVIDUAL
                  Object.keys(chartDataGrouped).map(metricKey => (
                    <div key={metricKey} className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg">
                        <DashboardChart
                          title={metricKey.split('_').join(' ')}
                          data={chartDataGrouped[metricKey]}
                        />
                    </div>
                  ))
              )}
          </div>
      </section>

      
      {/* --- TABELA DE ANOMALIAS (Logs Estruturados) --- */}
      <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b border-gray-300 pb-2">
              6. Anomalias Filtradas ({filteredAnomalias.length})
          </h2>
          
          <div className="overflow-x-auto">
            {/* TABELA COM FUNDO BRANCO */}
            <table className="min-w-full bg-white shadow-xl rounded-lg border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Cliente</th> 
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Tipo</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Timestamp (BR)</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Métrica</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Causa Raiz (IA)</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status Robô</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Log</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnomalias.map((a, index) => (
                  <tr key={a.logID || index} className="border-b border-gray-200 hover:bg-gray-50 transition duration-150">
                    <td className="py-3 px-4 font-bold text-gray-800">{a.client_id?.replace('_', ' ') || 'N/A'}</td> 
                    <td className="py-3 px-4 text-gray-600">{a.data_type?.split('_').join(' ') || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600">
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
                    <td className="py-3 px-4 text-gray-600">{a.metricName} ({a.value.toFixed(2)})</td>
                    <td className="py-3 px-4 text-gray-600">{a.causaRaiz}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                        ${a.status === 'CORRIGIDO' ? 'bg-green-100 text-green-700' : 
                          a.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        } shadow-sm`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => openLogModal(a.logID)} 
                        className="text-cyan-600 hover:text-cyan-800 font-medium disabled:opacity-50"
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