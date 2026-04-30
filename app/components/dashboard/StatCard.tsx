import React, { ReactNode } from 'react';
import { ArrowRightCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  colorClass: string; // e.g., 'bg-blue-400'
}

const StatCard = ({ title, value, icon, colorClass }: StatCardProps) => {
  return (
    <div className={`${colorClass} rounded shadow text-white flex flex-col relative overflow-hidden h-32`}>
      <div className="p-4 z-10">
        <h3 className="text-3xl font-bold">{value}</h3>
        <p className="text-sm font-medium uppercase tracking-wide opacity-90">{title}</p>
      </div>
      
      <div className="absolute top-3 right-3 opacity-30">
          {icon}
      </div>

      <a href="#" className="mt-auto bg-black/10 py-1 px-4 text-center text-xs flex items-center justify-center hover:bg-black/20 transition-colors cursor-pointer">
        More info <ArrowRightCircle size={14} className="ml-1" />
      </a>
    </div>
  );
};

export default StatCard;
