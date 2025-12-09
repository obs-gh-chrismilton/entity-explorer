import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { Dashboard } from '../types';
import { formatDate } from '../lib/utils';

export default function Dashboards() {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [filteredDashboards, setFilteredDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    filterDashboards();
  }, [searchQuery, dashboards]);

  const loadDashboards = async () => {
    try {
      const data = await api.get<Dashboard[]>('/entities/dashboards');
      setDashboards(data);
      setFilteredDashboards(data);
    } catch (error) {
      console.error('Failed to load dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDashboards = () => {
    let filtered = dashboards;

    if (searchQuery) {
      filtered = filtered.filter(
        (db) =>
          db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          db.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDashboards(filtered);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (dashboard: Dashboard) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{dashboard.name}</div>
            {dashboard.description && (
              <div className="text-xs text-gray-500 mt-0.5 max-w-md truncate">
                {dashboard.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sections',
      header: 'Sections',
      render: (dashboard: Dashboard) => (
        <span className="text-gray-600">{dashboard.sections?.length || 0}</span>
      ),
    },
    {
      key: 'updatedDate',
      header: 'Last Updated',
      sortable: true,
      render: (dashboard: Dashboard) => (
        <span className="text-gray-600">
          {dashboard.updatedDate ? formatDate(dashboard.updatedDate) : '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
          <p className="text-gray-600 mt-2">
            {filteredDashboards.length} dashboard{filteredDashboards.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <div className="p-4">
            <Input
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <Table
            data={filteredDashboards}
            columns={columns}
            onRowClick={(dashboard) => navigate(`/dashboards/${dashboard.id}`)}
          />
        </Card>
      </motion.div>
    </div>
  );
}
