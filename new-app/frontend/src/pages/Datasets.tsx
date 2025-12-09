import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { Dataset } from '../types';
import { formatDate } from '../lib/utils';

export default function Datasets() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAcceleratedOnly, setShowAcceleratedOnly] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    filterDatasets();
  }, [searchQuery, showAcceleratedOnly, datasets]);

  const loadDatasets = async () => {
    try {
      const data = await api.get<Dataset[]>('/datasets');
      setDatasets(data);
      setFilteredDatasets(data);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDatasets = () => {
    let filtered = datasets;

    if (searchQuery) {
      filtered = filtered.filter(
        (ds) =>
          ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ds.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showAcceleratedOnly) {
      filtered = filtered.filter((ds) => ds.accelerated);
    }

    setFilteredDatasets(filtered);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (dataset: Dataset) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{dataset.name}</div>
            {dataset.description && (
              <div className="text-xs text-gray-500 mt-0.5 max-w-md truncate">
                {dataset.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'accelerated',
      header: 'Type',
      render: (dataset: Dataset) =>
        dataset.accelerated ? (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <Zap className="w-3 h-3" />
            Accelerated
          </Badge>
        ) : (
          <Badge variant="default">Standard</Badge>
        ),
    },
    {
      key: 'stages',
      header: 'Stages',
      render: (dataset: Dataset) => (
        <span className="text-gray-600">{dataset.stages?.length || 0}</span>
      ),
    },
    {
      key: 'updatedDate',
      header: 'Last Updated',
      sortable: true,
      render: (dataset: Dataset) => (
        <span className="text-gray-600">
          {dataset.updatedDate ? formatDate(dataset.updatedDate) : '-'}
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
          <h1 className="text-3xl font-bold text-gray-900">Datasets</h1>
          <p className="text-gray-600 mt-2">
            {filteredDatasets.length} dataset{filteredDatasets.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search datasets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowAcceleratedOnly(!showAcceleratedOnly)}
                className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  showAcceleratedOnly
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <Zap className="w-4 h-4" />
                Accelerated Only
              </button>
            </div>
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
            data={filteredDatasets}
            columns={columns}
            onRowClick={(dataset) => navigate(`/datasets/${dataset.id}`)}
          />
        </Card>
      </motion.div>
    </div>
  );
}
