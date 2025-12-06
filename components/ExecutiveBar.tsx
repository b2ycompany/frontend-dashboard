// frontend-dashboard/components/ExecutiveBar.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react"; 
import ReactECharts from "echarts-for-react";

// Supressão de linter para a declaração global de Echarts
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    echarts: any; 
  }
}

const ExecutiveBar = ({ title, labels, values }: {
  title: string;
  labels: string[];
  values: number[];
}) => {
  // 1. Estado para armazenar o objeto de gradiente (que requer 'window').
  const [gradientColor, setGradientColor] = useState(null);
  
  // 2. useEffect: Executa APENAS UMA VEZ no mount para inicializar a cor/gradiente
  // SUPRESSÃO DO ERRO: Ignoramos a regra 'set-state-in-effect' neste bloco,
  // pois a inicialização do gradiente DEVE ser feita no cliente.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    if (typeof window !== 'undefined' && window.echarts) {
      const gradient = new window.echarts.graphic.LinearGradient( 
        0, 0, 0, 1,
        [{ offset: 0, color: "#00eaff" }, { offset: 1, color: "#0077ff" }]
      );
      setGradientColor(gradient);
    }
    // Deixamos a dependência vazia [] para garantir que rode apenas no mount.
  }, []); 

  // 3. useMemo: Constrói o objeto de opção COMPLETAMENTE.
  const option = useMemo(() => {
    // Se o gradiente ainda não foi inicializado (estamos esperando o useEffect rodar), retorna um objeto vazio
    if (!gradientColor) {
        return {};
    }

    return {
      grid: { left: 40, right: 20, top: 40, bottom: 40 },
      tooltip: {},
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: "#bbb" },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#bbb" },
      },
      series: [
        {
          data: values,
          type: "bar",
          itemStyle: {
            color: gradientColor, // Usa o estado memoizado do gradiente
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
    };
  }, [labels, values, gradientColor]); // Dependências: garante que o objeto 'option' é atualizado APENAS quando os dados mudam.

  // Renderiza apenas quando 'option' tiver sido inicializado (i.e., gradientColor está pronto)
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
      <h3 className="text-gray-300 text-lg mb-4 font-semibold">{title}</h3>
      {option && Object.keys(option).length > 0 ? (
        <ReactECharts option={option} style={{ height: "260px", width: "100%" }} />
      ) : (
        <div style={{ height: "260px", color: '#fff' }}>Carregando Gráfico...</div>
      )}
    </div>
  );
};

export default ExecutiveBar;