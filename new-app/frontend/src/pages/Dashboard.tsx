import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, BarChart3, Bell, Activity, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';
import { Stats } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

const mockActivityData = [
  { date: 'Mon', datasets: 12, dashboards: 8 },
  { date: 'Tue', datasets: 15, dashboards: 10 },
  { date: 'Wed', datasets: 18, dashboards: 12 },
  { date: 'Thu', datasets: 14, dashboards: 9 },
  { date: 'Fri', datasets: 20, dashboards: 15 },
  { date: 'Sat', datasets: 16, dashboards: 11 },
  { date: 'Sun', datasets: 13, dashboards: 7 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.get<Stats>('/entities/summary');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  const statCards = [
    {
      title: 'Datasets',
      value: stats?.totalDatasets || 0,
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/datasets',
    },
    {
      title: 'Dashboards',
      value: stats?.totalDashboards || 0,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/dashboards',
    },
    {
      title: 'Monitors',
      value: stats?.totalMonitors || 0,
      icon: Bell,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/monitors',
    },
    {
      title: 'Activity',
      value: 145,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: '+12%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Entity Explorer</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link || '#'}>
              <Card hover className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      {stat.trend && (
                        <div className="flex items-center gap-1 mt-2 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">{stat.trend}</span>
                        </div>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="datasets" stroke="#7e22ce" strokeWidth={2} />
                  <Line type="monotone" dataKey="dashboards" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Created dataset', name: 'User Activity Logs', time: '2 hours ago' },
                  { action: 'Updated dashboard', name: 'KPI Overview', time: '5 hours ago' },
                  { action: 'Modified monitor', name: 'Error Rate Alert', time: '1 day ago' },
                  { action: 'Created dashboard', name: 'Sales Analytics', time: '2 days ago' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{item.action}</span> {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/datasets"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
              >
                <Database className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Browse Datasets</span>
              </Link>
              <Link
                to="/relationships"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
              >
                <Activity className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">View Relationships</span>
              </Link>
              <Link
                to="/search"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
              >
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Search Code</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
