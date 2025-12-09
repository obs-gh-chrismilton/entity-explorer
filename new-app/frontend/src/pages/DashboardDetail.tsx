import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Layout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { Dashboard } from '../types';
import { formatDate } from '../lib/utils';

export default function DashboardDetail() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDashboard();
    }
  }, [id]);

  const loadDashboard = async () => {
    try {
      const data = await api.get<Dashboard>(`/dashboards/${id}`);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Dashboard not found</p>
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
          to="/dashboards"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboards
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="text-gray-600 mt-2">{dashboard.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="info">
                  {dashboard.sections?.length || 0} Section{dashboard.sections?.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-base font-medium text-gray-900">
                  {dashboard.createdDate ? formatDate(dashboard.createdDate) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-base font-medium text-gray-900">
                  {dashboard.updatedDate ? formatDate(dashboard.updatedDate) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sections */}
      {dashboard.sections && dashboard.sections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {dashboard.sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title || `Section ${index + 1}`}</CardTitle>
              </CardHeader>
              <CardContent>
                {section.cards && section.cards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.cards.map((card) => (
                      <div
                        key={card.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{card.title || 'Untitled Card'}</h4>
                          <Badge variant="default" className="text-xs">
                            {card.cardType}
                          </Badge>
                        </div>
                        {card.datasetName && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <Layout className="w-4 h-4" />
                            <span>{card.datasetName}</span>
                          </div>
                        )}
                        {card.query && (
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                            <code>{card.query}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No cards in this section</p>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}
