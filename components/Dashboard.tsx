'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import type { ProductivityReport } from '../types';

interface DashboardProps {
  userId: string;
}

const COLORS = {
  productive: '#10b981',
  unproductive: '#ef4444',
  neutral: '#3b82f6'
};

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [report, setReport] = useState<ProductivityReport | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [isPopup, setIsPopup] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/Analytics?userId=${userId}&period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId, period]);

  useEffect(() => {
    setIsPopup(window.innerWidth < 400); 
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Data Available</h2>
          <p className="text-gray-600 dark:text-gray-400">Start using the Chrome extension to track your productivity!</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Productive', value: report.productiveTime, color: COLORS.productive },
    { name: 'Unproductive', value: report.unproductiveTime, color: COLORS.unproductive },
    { name: 'Neutral', value: report.neutralTime, color: COLORS.neutral }
  ].filter(item => item.value > 0);

  const productivityBreakdownData = [
    {
      category: 'Productive',
      time: report.productiveTime,
      timeFormatted: formatTime(report.productiveTime),
      fill: COLORS.productive
    },
    {
      category: 'Unproductive', 
      time: report.unproductiveTime,
      timeFormatted: formatTime(report.unproductiveTime),
      fill: COLORS.unproductive
    },
    {
      category: 'Neutral',
      time: report.neutralTime,
      timeFormatted: formatTime(report.neutralTime),
      fill: COLORS.neutral
    }
  ].filter(item => item.time > 0);

  const dailyData = report.dailyBreakdown?.map(day => ({
    date: formatDate(day.date),
    total: Math.floor(day.totalTime / 3600),
    productive: Math.floor(day.productiveTime / 3600)
  })) || [];

  const productivityPercentage = report.totalTime > 0
    ? Math.round((report.productiveTime / report.totalTime) * 100)
    : 0;

  return (
    <div className={`${isPopup ? 'p-6' : 'w-screen h-screen p-8'} min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-auto`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Productivity Dashboard</h1>
          <button
            className='bg-blue-600 px-2 py-1 text-white hover:scale-105 duration-200 hover:bg-blue-900'
            onClick={() => {
              chrome.tabs.create({
                url: chrome.runtime.getURL("index.html"),
              });

            }}
          >
            View In Fullscreen
          </button>

          <div className="flex space-x-2 mt-4">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Time</h3>
            <p className="text-2xl font-bold">{formatTime(report.totalTime)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Productive Time</h3>
            <p className="text-2xl font-bold text-green-500">{formatTime(report.productiveTime)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Unproductive Time</h3>
            <p className="text-2xl font-bold text-red-500">{formatTime(report.unproductiveTime)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Productivity Score</h3>
            <p className="text-2xl font-bold text-blue-500">{productivityPercentage}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Time Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatTime(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Productivity Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productivityBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                  axisLine={{ stroke: '#6b7280' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatTime(value)}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                  axisLine={{ stroke: '#6b7280' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatTime(value), 'Time Spent']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="time" 
                  radius={[4, 4, 0, 0]}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {dailyData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Daily Trend (Hours)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6b7280"
                  strokeWidth={2}
                  name="Total Hours"
                />
                <Line
                  type="monotone"
                  dataKey="productive"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Productive Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Detailed Website Usage</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {report.topSites.map((site, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      site.category === 'productive' ? 'bg-green-500' :
                      site.category === 'unproductive' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="font-medium">{site.domain}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    site.category === 'productive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    site.category === 'unproductive' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {site.category}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {formatTime(site.timeSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;