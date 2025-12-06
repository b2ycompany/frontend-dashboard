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
import ExecutiveDashboard from '../components/ExecutiveDashboard'; // Importa o original

// -----------------------------------------------------------------
// SOLUÇÃO: Cria o wrapper do Dashboard Executivo AQUI para o dynamic import
// -----------------------------------------------------------------
const ExecutiveDashboardClient = dynamic(() => import('../components/ExecutiveDashboard'), {
  ssr: false, // Desabilita a renderização no servidor para evitar erros de 'window is not defined'
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

// Componente de Card Atualizado (Prop 'color' removida para corrigir o aviso)
const Card: React.FC<{ title: string, value: number }> = ({ title, value }) => (
  // Tema Neon: bg-gray-900, border-neon, shadow-neon
  <div className={`bg-gray-900 p-6 rounded-lg border-neon shadow-sm shadow-cyan-500/20 transition duration-300 hover-neon`}>
    <p className="text-sm font-medium text-gray-400">{title}</p>
    <p className="text-4xl font-extrabold mt-2 text-white">
        {/* Adiciona efeito de contorno/sombra para a fonte */}
        <span className="text-cyan-400">{value}</span>
    </p>
  </div>
);


export default function Home() {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [filterType, setFilterType] = useState<string>('TODOS'); 
  const [selectedClient, setSelectedClient] = useState<string>(ALL_CLIENTS); 
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(true); // Controla o painel lateral

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

  // 1. EXTRAI LISTA ÚNICA DE CLIENTES (com tratamento de erro para client_id)
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


  const viewAutomationLog = (logID: string) => {
    alert(`Visualizando o log de automação para a execução: ${logID}`);
  };

  // Calcula a largura do container principal com base na abertura do painel lateral
  const mainContentWidth = isLogPanelOpen ? 'lg:w-3/4' : 'lg:w-full';

  return (
    // TEMA DARK BASE
    <div className="min-h-screen bg-gray-950 p-6 flex flex-row space-x-4">
      
      {/* ========================================================= */}
      {/* 1. PAINEL PRINCIPAL (KPIs, MAPA, GRÁFICOS, TABELA) */}
      {/* ========================================================= */}
      <div className={`${mainContentWidth} transition-all duration-300 w-full`}>
        <header className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-extrabold text-cyan-400 tracking-wider">
                Painel de Monitoramento Multicliente (AIOps)
            </h1>
            <button 
                onClick={() => setIsLogPanelOpen(!isLogPanelOpen)}
                className="p-2 bg-gray-800 rounded text-cyan-400 hover:bg-gray-700 transition duration-150 border-neon"
            >
                {isLogPanelOpen ? 'Fechar Logs ✕' : 'Abrir Logs ☰'}
            </button>
        </header>

        {/* --- FILTROS & KPIs (Seção Superior Horizontal) --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Bloco 1: Filtros */}
            <div className="lg:col-span-1 bg-gray-900 p-4 rounded-lg border-neon shadow-sm shadow-cyan-500/20">
                <h3 className="text-xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Filtros Operacionais</h3>
                
                <label htmlFor="client-selector" className="block text-sm font-medium text-cyan-400 mb-1">Cliente:</label>
                <select
                    id="client-selector"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="mb-4 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-gray-100 focus:ring-cyan-500 focus:border-cyan-500 rounded-md"
                >
                    {clients.map(client => (
                      <option key={client} value={client}>{client.replace('_', ' ')}</option>
                    ))}
                </select>

                <div className="flex flex-wrap gap-2">
                    {FILTER_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition duration-150 border 
                          ${filterType === type 
                            ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/40' // Ativo
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' // Inativo
                          }`}
                      >
                        {type.replace('_', ' ')} ({anomalias.filter(a => a.data_type === type && (selectedClient === ALL_CLIENTS || a.client_id === selectedClient)).length})
                      </button>
                    ))}
                </div>
            </div>

            {/* Bloco 2 & 3: KPIs */}
            {/* Note: Prop 'color' removida dos Cards abaixo para corrigir o aviso de ESLint */}
            <div className="lg:col-span-2 grid grid-cols-3 gap-6">
                <Card title="Total Anomalias Filtradas" value={filteredAnomalias.length} />
                <Card title="Pendentes de Correção" value={filteredAnomalias.filter(a => a.status === 'PENDENTE').length} />
                <Card title="Corrigidas (Robô)" value={filteredAnomalias.filter(a => a.status === 'CORRIGIDO').length} />
            </div>
        </section>
        
        {/* --- DASHBOARD EXECUTIVO (Gráficos Barra, Pizza, Donut) --- */}
        <section className="space-y-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
                Indicadores Executivos e Visualizações
            </h2>
            <div className="bg-gray-900 p-6 rounded-lg border-neon shadow-xl shadow-cyan-500/20">
                {/* Integra o Dashboard Executivo que contém os gráficos e indicadores */}
                <ExecutiveDashboardClient anomalias={filteredAnomalias} />
            </div>
        </section>
        
        {/* --- MAPA DE FLUXO --- */}
        <section className="space-y-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
                Mapa de Erros no Fluxo de Serviço
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
        
        {/* --- GRÁFICOS (Detalhes por Métrica) --- */}
        <section className="space-y-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">Análise Gráfica de Performance (Time Series)</h2>
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

        
        {/* --- TABELA DE ANOMALIAS --- */}
        <section>
            <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Anomalias Filtradas ({filteredAnomalias.length})</h2>
            
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
                          onClick={() => viewAutomationLog(a.logID)} 
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
      
      {/* ========================================================= */}
      {/* 2. PAINEL LATERAL DE LOGS (ASIDE) */}
      {/* ========================================================= */}
      <aside className={`
        ${isLogPanelOpen ? 'w-full lg:w-1/4 translate-x-0' : 'w-0 lg:w-0 translate-x-full'} 
        bg-gray-900 p-4 rounded-lg border-neon shadow-xl shadow-cyan-500/20 transition-all duration-300 overflow-hidden
      `}>
        <h3 className="text-xl font-extrabold text-cyan-400 mb-4 border-b border-cyan-700 pb-2">
            LOGS OPERACIONAIS
        </h3>
        <div className="text-sm text-gray-400 h-full overflow-y-auto space-y-2">
            <p className="text-green-400">[16:00:00] [SUCCESS] Deployment AIOps-Main concluído.</p>
            <p className="text-yellow-400">[16:00:15] [WARNING] Latência DB atingiu 800ms. Alerta leve.</p>
            <p className="text-red-400">[16:00:30] [ALERT] BANCO NACIONAL: Fluxo Onboarding falhou. Causa Raiz: Alta taxa de erro em Auth.</p>
            <p className="text-cyan-400">[16:00:31] [ROBOT] Acionando Playbook: auth_connection_reset.yml...</p>
            <p className="text-green-400">[16:00:35] [SUCCESS] auth_connection_reset.yml executado com êxito.</p>
            {/* Simule logs recentes baseados em anomalias, usando os dados mais recentes */}
            {anomalias.slice(0, 10).map((a, i) => (
                <p key={i} className={a.status === 'CORRIGIDO' ? 'text-green-400' : 'text-red-400'}>
                    [{new Date(a.timestamp).toLocaleTimeString()}] [{a.status.toUpperCase()}] {a.client_id?.replace('_', ' ')}: {a.causaRaiz}
                </p>
            ))}
            <p className="text-gray-600">[... Logs mais antigos ...]</p>
        </div>
      </aside>
    </div>
  );
}