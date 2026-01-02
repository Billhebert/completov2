/**
 * Base de Conhecimento List Page
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../shared';
import * as knowledgeService from '../services/knowledge.service';
import type { KnowledgeNode } from '../services/knowledge.service';
import {
  BookOpenIcon,
  PlusIcon,
  TagIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function KnowledgeListPage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedTag]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nodesData, tagsData] = await Promise.all([
        knowledgeService.getNodes(selectedTag ? { tag: selectedTag } : {}),
        knowledgeService.getTags(),
      ]);
      setNodes(nodesData);
      setTags(tagsData.slice(0, 10)); // Top 10 tags
    } catch (err: any) {
      console.error('Failed to load knowledge:', err);
      setError(err.message || 'Erro ao carregar base de conhecimento');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNodes = searchQuery
    ? nodes.filter(
        (node) =>
          node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nodes;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Base de Conhecimento</h1>
            <p className="text-lg text-gray-600">Sistema Zettelkasten com busca semântica e IA</p>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            <PlusIcon className="h-5 w-5" />
            Novo Zettel
          </button>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar zettels..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Zettels</span>
                  <BookOpenIcon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{nodes.length}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Tags Únicas</span>
                  <TagIcon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{tags.length}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Com IA</span>
                  <SparklesIcon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {nodes.filter((n) => (n.importanceScore || 0) > 0.7).length}
                </p>
              </div>
            </div>
          </div>

          {/* Tags Sidebar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags Populares</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedTag
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Todos ({nodes.length})
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.tag}
                  onClick={() => setSelectedTag(tag.tag)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedTag === tag.tag
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  #{tag.tag} ({tag.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nodes List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando zettels...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || selectedTag ? 'Nenhum zettel encontrado' : 'Nenhum zettel ainda'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedTag
                ? 'Tente ajustar sua busca ou filtros'
                : 'Comece criando seu primeiro zettel'}
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              <PlusIcon className="h-5 w-5" />
              Criar Zettel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{node.title}</h3>
                    {(node.importanceScore || 0) > 0.7 && (
                      <SparklesIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{node.content}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {node.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        #{tag}
                      </span>
                    ))}
                    {node.tags.length > 2 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        +{node.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{node.nodeType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
