import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './MetricsChart.module.css';

const data = [
  { time: '0s', cpu: 10, memory: 80 },
  { time: '2s', cpu: 25, memory: 90 },
  { time: '4s', cpu: 85, memory: 120 },
  { time: '6s', cpu: 95, memory: 240 }, // Chaos/Stress peak
  { time: '8s', cpu: 30, memory: 100 },
  { time: '10s', cpu: 15, memory: 85 },
];

export function MetricsChart() {
  return (
    <div className={styles.chartWrapper}>
      <h4 className={styles.chartTitle}>Resource Utilization (Live)</h4>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
            <Area type="monotone" dataKey="memory" name="Mem (MB)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMem)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
