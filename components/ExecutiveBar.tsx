// frontend-dashboard/components/ExecutiveBar.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

declare global {
  interface Window {
    // CORRIGIDO: Aplicamos a supressão diretamente na linha da propriedade 'echarts'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    echarts: any; 
  }
}

const ExecutiveBar = ({ title, labels, values }: {
  title: string;
  labels: string[];
  values: number[];
}) => {
  const option = {
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
          color: new window.echarts.graphic.LinearGradient( 
            0, 0, 0, 1,
            [{ offset: 0, color: "#00eaff" }, { offset: 1, color: "#0077ff" }]
          ),
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
      <h3 className="text-gray-300 text-lg mb-4 font-semibold">{title}</h3>
      <ReactECharts option={option} style={{ height: "260px", width: "100%" }} />
    </div>
  );
};

export default ExecutiveBar;