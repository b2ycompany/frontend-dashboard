"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

interface PieData {
  name: string;
  value: number;
}

const ExecutivePie = ({ title, data }: { title: string; data: PieData[] }) => {
  const option = {
    tooltip: { trigger: "item" },
    legend: {
      top: "bottom",
      textStyle: { color: "#ccc" },
    },
    series: [
      {
        name: title,
        type: "pie",
        radius: "70%",
        itemStyle: {
          borderRadius: 8,
          borderColor: "#111",
          borderWidth: 2,
        },
        label: { color: "#ddd" },
        data,
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30 transition">
      <h3 className="text-gray-300 text-lg mb-4 font-semibold">{title}</h3>
      <ReactECharts option={option} style={{ height: "260px", width: "100%" }} />
    </div>
  );
};

export default ExecutivePie;
