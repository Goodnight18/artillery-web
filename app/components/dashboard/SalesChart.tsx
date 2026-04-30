"use client";
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '2011 Q4', uv: 2000, pv: 2400 },
  { name: '2012 Q1', uv: 4000, pv: 1398 },
  { name: '2012 Q2', uv: 3000, pv: 9800 },
  { name: '2012 Q3', uv: 2000, pv: 3908 },
  { name: '2012 Q4', uv: 2780, pv: 4800 },
  { name: '2013 Q1', uv: 1890, pv: 4800 },
  { name: '2013 Q2', uv: 2390, pv: 3800 },
  { name: '2013 Q3', uv: 3490, pv: 4300 },
];

const SalesChart = () => {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-200">
      <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-gray-600 font-semibold flex items-center">
         <span className="mr-2">📈</span> Sales
        </h3>
        <div className="flex space-x-2 text-xs">
            <button className="bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200">Donut</button>
            <button className="bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">Area</button>
        </div>
      </div>
      <div className="p-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="uv" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.6} strokeWidth={2} />
             <Area type="monotone" dataKey="pv" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.4} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
