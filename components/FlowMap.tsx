// frontend-dashboard/components/FlowMap.tsx
"use client";
import React from 'react';

// 1. INTERFACES DE DADOS E ESTRUTURA

interface AnomaliaData {
  host: string;
  status: 'PENDENTE' | 'CORRIGIDO' | 'FALHA_CORRECAO';
}

interface FlowStep {
    id: string;
    label: string;
    host: string;
}

interface FlowDiagramData {
    title: string;
    steps: FlowStep[];
}

interface FlowMapProps {
  client: string;
  flowType: string;
  anomalies: AnomaliaData[];
}

const FlowMap: React.FC<FlowMapProps> = ({ client, flowType, anomalies }) => {
  
  // 1. LÓGICA DE DETECÇÃO DE STATUS POR HOST/SERVIÇO
  const statusMap = anomalies.reduce((acc, anomaly) => {
    // Se o status for PENDENTE ou FALHA, marca o host como vermelho
    if (anomaly.status === 'PENDENTE' || anomaly.status === 'FALHA_CORRECAO') {
      acc[anomaly.host] = 'red';
    } 
    // Se não for PENDENTE, pode ser verde (corrigido) ou neutro
    return acc;
  }, {} as { [host: string]: 'red' | 'green' });

  // 2. FUNÇÃO CORRIGIDA: Agora retorna o objeto de dados (FlowDiagramData), não o JSX
  const getFlowDiagramData = (): FlowDiagramData => {
    // ESTA PARTE DEVE SER ADAPTADA PARA CADA FLUXO (Ex: FLUXO_ONBOARDING, FLUXO_SINISTRO)
    return {
      title: `${client.replace('_', ' ')} - Fluxo de ${flowType.replace('_', ' ')}`,
      steps: [
        { id: 'auth-service', label: '1. Serviço de Autenticação', host: 'api-auth-01' },
        { id: 'core-api', label: '2. API Central de Negócios', host: 'api-core-01' },
        { id: 'db-write', label: '3. Persistência de Dados (DB)', host: 'db-master' },
        { id: 'log-ingest', label: '4. Ingestão de Logs', host: 'log-ingestor' },
      ]
    };
  };

  // Armazena a estrutura do diagrama
  const diagramData = getFlowDiagramData();

  return (
    <div className="bg-gray-800/70 p-6 rounded-lg shadow-xl shadow-gray-900/50 mb-8 border border-gray-700">
      
      {/* CORRIGIDO: Acessando diretamente o title da variável diagramData */}
      <h3 className="text-xl font-bold text-gray-100 mb-6">{diagramData.title}</h3>
      
      <div className="flex flex-col items-center space-y-2">
        
        {/* CORRIGIDO: Iterando sobre diagramData.steps e tipando corretamente */}
        {diagramData.steps.map((step: FlowStep, index: number) => (
          <React.Fragment key={step.id}>
            
            {/* Renderiza a caixa de passo */}
            <div className={`
                p-4 rounded-lg shadow-md text-white font-bold w-64 text-center transform transition duration-300 hover:scale-105
                ${statusMap[step.host] === 'red' ? 'bg-red-600 ring-4 ring-red-400/50' : 'bg-gray-700'}
            `}>
              {statusMap[step.host] === 'red' ? '🚨' : '✅'} {step.label}
              <div className="text-sm font-light mt-1 text-gray-400">{step.host}</div>
            </div>
            
            {/* Renderiza a seta de fluxo, exceto após o último passo */}
            {index < diagramData.steps.length - 1 && (
              <svg className="w-8 h-8 text-gray-500 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FlowMap;