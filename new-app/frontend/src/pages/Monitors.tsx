import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { Monitor } from '../types';
import { formatDate } from '../lib/utils';

export default function Monitors() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [filteredMonitors, setFilteredMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMonitors();
  }, []);

  useEffect(() => {
    filterMonitors();
  }, [searchQuery, monitors]);

  const loadMonitors = async () => {
    try {
      const data = await api.get<Monitor[]>('/entities/monitors');
      setMonitors(data);
      setFilteredMonitors(data);
    } catch (error) {
      console.error('Failed to load monitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMonitors = () => {
    let filtered = monitors;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMonitors(filtered);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (monitor: Monitor) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{monitor.name}</div>
            {monitor.description && (
              <div className="text-xs text-gray-500 mt-0.5 max-w-md truncate">
                {monitor.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'lookbackTime',
      header: 'Lookback',
      render: (monitor: Monitor) =>
        monitor.lookbackTime ? (
          <Badge variant="info" className="flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            {monitor.lookbackTime}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'managedBy',
      header: 'Managed By',
      render: (monitor: Monitor) => (
        <span className="text-gray-600">{monitor.managedBy || '-'}</span>
      ),
    },
    {
      key: 'updatedDate',
      header: 'Last Updated',
      sortable: true,
      render: (monitor: Monitor) => (
        <span className="text-gray-600">
          {monitor.updatedDate ? formatDate(monitor.updatedDate) : '-'}
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
          <h1 className="text-3xl font-bold text-gray-900">Monitors</h1>
          <p className="text-gray-600 mt-2">
            {filteredMonitors.length} monitor{filteredMonitors.length !== 1 ? 's' : ''} found
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
              placeholder="Search monitors..."
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
          <Table data={filteredMonitors} columns={columns} />
        </Card>
      </motion.div>
    </div>
  );
}
