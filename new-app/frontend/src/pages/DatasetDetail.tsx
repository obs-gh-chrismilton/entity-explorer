import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, Zap, GitBranch, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EntityGraph from '../components/graphs/EntityGraph';
import { api } from '../lib/api';
import { Dataset, Relationship } from '../types';
import { formatDate } from '../lib/utils';

export default function DatasetDetail() {
  const { id } = useParams();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDataset();
      loadRelationships();
    }
  }, [id]);

  const loadDataset = async () => {
    try {
      const data = await api.get<Dataset>(`/entities/datasets/${id}`);
      setDataset(data);
    } catch (error) {
      console.error('Failed to load dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelationships = async () => {
    try {
      const data = await api.get<Relationship[]>(`/entities/datasets/${id}/relationships`);
      setRelationships(data);
    } catch (error) {
      console.error('Failed to load relationships:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  if (!dataset) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Dataset not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          to="/datasets"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Datasets
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
              {dataset.description && (
                <p className="text-gray-600 mt-2">{dataset.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                {dataset.accelerated && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Accelerated
                  </Badge>
                )}
                {dataset.label && <Badge variant="info">{dataset.label}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stages</p>
                  <p className="text-2xl font-bold text-gray-900">{dataset.stages?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {dataset.createdDate ? formatDate(dataset.createdDate) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Updated</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {dataset.updatedDate ? formatDate(dataset.updatedDate) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stages */}
      {dataset.stages && dataset.stages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Dataset Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dataset.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary-700">
                        {stage.stageNumber}
                      </span>
                    </div>
                    <div className="flex-1">
                      {stage.input?.inputName && (
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Input: {stage.input.inputName}
                        </p>
                      )}
                      {stage.pipeline && (
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          <code>{stage.pipeline}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Relationships Graph */}
      {relationships.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Relationship Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <EntityGraph relationships={relationships} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
