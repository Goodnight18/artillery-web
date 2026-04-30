"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrafficChartProps {
  data: { time: string; value: number }[];
  color?: string; // hex color
  title?: string;
}

const TrafficChart = ({ data, color = "#10b981", title }: TrafficChartProps) => {
  return (
    <div className="h-full w-full bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      {title && (
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
            📈
          </div>
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
      )}
      
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              interval="preserveStartEnd"
            />
            <YAxis 
              hide 
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: color, fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fill={color} 
              fillOpacity={0.1} 
              strokeWidth={2} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrafficChart;
