"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

interface Props {
  title: string;
  value: number; // 0 a 100
  color?: string;
}

const ExecutiveDonut: React.FC<Props> = ({ title, value, color = "#00eaff" }) => {
  const option = {
    title: {
      text: `${value}%`,
      left: "center",
      top: "42%",
      textStyle: {
        color: "#e0e0e0",
        fontSize: 28,
        fontWeight: "bold",
      },
    },
    tooltip: { formatter: "{b}: {c}%" },
    series: [
      {
        type: "pie",
        radius: ["70%", "90%"],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: true },
        data: [
          {
            value: value,
            name: "Atual",
            itemStyle: { color },
          },
          {
            value: 100 - value,
            name: "Restante",
            itemStyle: { color: "rgba(255,255,255,0.07)" },
          },
        ],
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30 transition">
      <h3 className="text-gray-300 text-lg mb-4 font-semibold">{title}</h3>
      <ReactECharts option={option} style={{ height: "220px", width: "100%" }} />
    </div>
  );
};

export default ExecutiveDonut;
