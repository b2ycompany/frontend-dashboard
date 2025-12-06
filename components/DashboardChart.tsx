// frontend-dashboard/components/DashboardChart.tsx
"use client";

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface AnomaliaData {
  timestamp: string;
  value: number;
  metricName: string;
  data_type: string;
}

interface DashboardChartProps {
  data: AnomaliaData[];
  title: string;
}

/**
 * Converte e agrupa os dados de anomalias para o formato que o Recharts espera.
 */
const formatChartData = (anomalias: AnomaliaData[]) => {
  const dataMap: { [key: string]: number } = {};
  
  anomalias.forEach(item => {
    const timeKey = new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    dataMap[timeKey] = Math.max(dataMap[timeKey] || 0, item.value);
  });

  return Object.keys(dataMap).sort().map(key => ({
    time: key,
    value: dataMap[key],
  }));
};

const DashboardChart: React.FC<DashboardChartProps> = ({ data, title }) => {
  const chartData = formatChartData(data);
  
  if (chartData.length === 0 || data.length === 0) {
    return <div className="p-6 bg-white rounded-lg shadow-lg text-center text-gray-500">Nenhuma métrica de anomalia registrada neste filtro.</div>;
  }
  
  const unitName = data[0].metricName.includes('ms') 
    ? 'ms (Latência)' 
    : data[0].metricName.includes('percent') 
    ? '%' 
    : 'Contagem / TPS';

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title} - Tendência de Picos Anômalos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="time" tick={{ fill: '#555' }} />
          <YAxis label={{ value: unitName, angle: -90, position: 'insideLeft', fill: '#555' }} />
          
          {/* CÓDIGO CORRIGIDO: Usando 'string | number' para resolver o erro 'no-explicit-any' */}
          <Tooltip 
            formatter={(value: string | number, name: string) => {
              if (typeof value === 'number') {
                // toFixed() é seguro aqui
                return [`${value.toFixed(2)} ${unitName}`, name];
              }
              return [value, name]; 
            }}
            labelFormatter={(label) => `Tempo: ${label}`}
          />
          {/* FIM CÓDIGO CORRIGIDO */}
          
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            name={`Pico de ${unitName}`} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardChart;