import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Filter, Database, BarChart3, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EntityGraph from '../components/graphs/EntityGraph';
import { api } from '../lib/api';
import { Relationship } from '../types';

export default function Relationships() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      const data = await api.get<Relationship[]>('/entities/relationships');
      setRelationships(data);
    } catch (error) {
      console.error('Failed to load relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  const entityTypes = Array.from(
    new Set([
      ...relationships.map((r) => r.sourceType),
      ...relationships.map((r) => r.targetType),
    ])
  );

  const filteredRelationships = selectedTypes.length > 0
    ? relationships.filter(
        (r) => selectedTypes.includes(r.sourceType) || selectedTypes.includes(r.targetType)
      )
    : relationships;

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dataset':
        return Database;
      case 'dashboard':
        return BarChart3;
      case 'monitor':
        return Bell;
      default:
        return Network;
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Entity Relationships</h1>
        <p className="text-gray-600 mt-2">
          Visualize connections between {relationships.length} entities
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter by Entity Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {entityTypes.map((type) => {
                const Icon = getTypeIcon(type);
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{type}</span>
                  </button>
                );
              })}
            </div>
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Relationship Graph</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] border border-gray-200 rounded-lg">
              <EntityGraph relationships={filteredRelationships} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Relationships</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {filteredRelationships.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Entity Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{entityTypes.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Unique Entities</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {
                    new Set([
                      ...filteredRelationships.map((r) => r.sourceId),
                      ...filteredRelationships.map((r) => r.targetId),
                    ]).size
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
