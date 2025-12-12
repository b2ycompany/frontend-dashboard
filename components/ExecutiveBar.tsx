// frontend-dashboard/components/ExecutiveBar.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react"; 
import ReactECharts from "echarts-for-react";

// Supressão de linter (mantida)
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
  // Inicializa o gradiente como null e o calcula em useMemo.
  // Isso resolve o problema de tempo de execução (timing issue)
  const gradientColor = useMemo(() => {
    // Acessa 'window.echarts' SOMENTE no lado do cliente e se a biblioteca carregou.
    if (typeof window !== 'undefined' && window.echarts && window.echarts.graphic) {
      return new window.echarts.graphic.LinearGradient( 
        0, 0, 0, 1,
        [{ offset: 0, color: "#00eaff" }, { offset: 1, color: "#0077ff" }]
      );
    }
    return null; 
  }, []); // Dependência vazia: roda apenas no mount do componente cliente.

  // 2. useMemo: Constrói o objeto de opção COMPLETAMENTE.
  const option = useMemo(() => {
    // Se o gradiente ainda não foi inicializado (i.e., Echarts não carregou a tempo), retorna um objeto vazio
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
            color: gradientColor,
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
    };
  }, [labels, values, gradientColor]); // Dependências: garante que o objeto 'option' é atualizado APENAS quando os dados mudam.

  // Renderiza a caixa de carregamento se option estiver vazio
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
      <h3 className="text-gray-300 text-lg mb-4 font-semibold">{title}</h3>
      {option && Object.keys(option).length > 0 ? (
        <ReactECharts option={option} style={{ height: "260px", width: "100%" }} />
      ) : (
        <div style={{ height: "260px", color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            Carregando Gráfico...
        </div>
      )}
    </div>
  );
};

export default ExecutiveBar;