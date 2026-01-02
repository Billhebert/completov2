import { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { AppLayout } from "../../shared/components/Layout/AppLayout";
import { Card } from "../../shared/components/UI/Card";
import { Badge } from "../../shared/components/UI/Badge";
import { Button } from "../../shared/components/UI/Button";
import { LoadingSpinner } from "../../shared/components/UI/LoadingSpinner";
import { handleApiError } from "../../../core/utils/api";
import * as dealService from "../services/deal.service";
import * as pipelineService from "../services/pipeline.service";
import { Deal } from "../types/deal.types";
import { CrmPipeline, CrmStage } from "../types/pipeline.types";
import {
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  FunnelIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { DealModal } from "../components/DealModal";

interface DealsByStage {
  [stageId: string]: Deal[];
}

const KanbanPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsByStage, setDealsByStage] = useState<DealsByStage>({});
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<CrmPipeline | null>(null);
  const [stages, setStages] = useState<CrmStage[]>([]);

  // Filters
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [minValueFilter, setMinValueFilter] = useState<string>("");
  const [maxValueFilter, setMaxValueFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Modal
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | undefined>();

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      const defaultPipeline = pipelines.find((p) => p.isDefault) || pipelines[0];
      setSelectedPipeline(defaultPipeline);
    }
  }, [pipelines]);

  useEffect(() => {
    if (selectedPipeline) {
      loadStages();
      loadDeals();
    }
  }, [selectedPipeline]);

  useEffect(() => {
    organizeDeals();
  }, [deals, stages]);

  const loadPipelines = async () => {
    try {
      const result = await pipelineService.listPipelines();
      setPipelines(result);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const loadStages = async () => {
    if (!selectedPipeline) return;

    try {
      const result = await pipelineService.getStages(selectedPipeline.id);
      setStages(result.sort((a, b) => a.order - b.order));
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const loadDeals = async () => {
    if (!selectedPipeline) return;

    setLoading(true);
    setError("");

    try {
      const result = await dealService.getDeals({
        pipelineId: selectedPipeline.id,
        limit: 1000,
        includeClosed: false, // Don't show won/lost in Kanban
      });

      setDeals(result.data || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const organizeDeals = () => {
    const organized: DealsByStage = {};

    // Initialize all stages with empty arrays
    stages.forEach((stage) => {
      organized[stage.id] = [];
    });

    // Filter and organize deals
    const filteredDeals = deals.filter((deal) => {
      // Search filter
      if (searchFilter && !deal.title.toLowerCase().includes(searchFilter.toLowerCase())) {
        return false;
      }

      // Owner filter
      if (ownerFilter && deal.ownerId !== ownerFilter) {
        return false;
      }

      // Value filters
      if (minValueFilter && (deal.value || 0) < parseFloat(minValueFilter)) {
        return false;
      }
      if (maxValueFilter && (deal.value || 0) > parseFloat(maxValueFilter)) {
        return false;
      }

      return true;
    });

    filteredDeals.forEach((deal) => {
      const stageId = deal.stageId || "";
      if (organized[stageId]) {
        organized[stageId].push(deal);
      }
    });

    setDealsByStage(organized);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;
    const dealId = draggableId;

    // Optimistically update UI
    const newDealsByStage = { ...dealsByStage };
    const sourceDeals = [...newDealsByStage[sourceStageId]];
    const destDeals =
      sourceStageId === destStageId
        ? sourceDeals
        : [...newDealsByStage[destStageId]];

    const [movedDeal] = sourceDeals.splice(source.index, 1);

    if (sourceStageId === destStageId) {
      sourceDeals.splice(destination.index, 0, movedDeal);
      newDealsByStage[sourceStageId] = sourceDeals;
    } else {
      destDeals.splice(destination.index, 0, movedDeal);
      newDealsByStage[sourceStageId] = sourceDeals;
      newDealsByStage[destStageId] = destDeals;
    }

    setDealsByStage(newDealsByStage);

    // Update on backend
    try {
      await dealService.updateDealStage(dealId, destStageId);

      // Reload to get updated data
      await loadDeals();
    } catch (err) {
      setError(handleApiError(err));
      // Revert on error
      await loadDeals();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getDealAge = (deal: Deal): number => {
    if (!deal.createdAt) return 0;
    return differenceInDays(new Date(), new Date(deal.createdAt));
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStageColor = (stageId: string): string => {
    const index = stages.findIndex((s) => s.id === stageId);
    const colors = [
      "bg-gray-100",
      "bg-blue-50",
      "bg-purple-50",
      "bg-yellow-50",
      "bg-green-50",
      "bg-red-50",
    ];
    return colors[index % colors.length] || "bg-gray-100";
  };

  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    deals.forEach((deal) => {
      if (deal.ownerId) owners.add(deal.ownerId);
    });
    return Array.from(owners);
  }, [deals]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline Kanban</h1>
            <p className="text-gray-600 mt-1">
              Visualize e gerencie seus deals com drag & drop
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPipeline?.id || ""}
              onChange={(e) => {
                const pipeline = pipelines.find((p) => p.id === e.target.value);
                setSelectedPipeline(pipeline || null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() => {
                setSelectedDealId(undefined);
                setIsDealModalOpen(true);
              }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Deal
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar deals..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os responsáveis</option>
                {uniqueOwners.map((ownerId) => (
                  <option key={ownerId} value={ownerId}>
                    User {ownerId}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Valor mín."
                value={minValueFilter}
                onChange={(e) => setMinValueFilter(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">até</span>
              <input
                type="number"
                placeholder="Valor máx."
                value={maxValueFilter}
                onChange={(e) => setMaxValueFilter(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(searchFilter || ownerFilter || minValueFilter || maxValueFilter) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchFilter("");
                  setOwnerFilter("");
                  setMinValueFilter("");
                  setMaxValueFilter("");
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80"
                style={{ minHeight: "400px" }}
              >
                {/* Stage Header */}
                <div className={`p-4 rounded-t-lg ${getStageColor(stage.id)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{stage.name}</h3>
                    <Badge variant="default">
                      {dealsByStage[stage.id]?.length || 0}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(
                      dealsByStage[stage.id]?.reduce(
                        (sum, deal) => sum + (deal.value || 0),
                        0
                      ) || 0
                    )}
                  </p>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 rounded-b-lg min-h-[300px] ${
                        snapshot.isDraggingOver
                          ? "bg-blue-50 border-2 border-blue-300"
                          : "bg-gray-50 border-2 border-gray-200"
                      }`}
                    >
                      {dealsByStage[stage.id]?.map((deal, index) => (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 ${
                                snapshot.isDragging ? "opacity-50" : ""
                              }`}
                            >
                              <Link
                                to={`/crm/deals/${deal.id}`}
                                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                              >
                                {/* Deal Title */}
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                                    {deal.title}
                                  </h4>
                                  {deal.priority && (
                                    <Badge
                                      variant={getPriorityColor(deal.priority)}
                                      className="ml-2"
                                    >
                                      {deal.priority}
                                    </Badge>
                                  )}
                                </div>

                                {/* Deal Value */}
                                <div className="flex items-center gap-2 mb-2">
                                  <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                                  <span className="font-bold text-green-600 text-sm">
                                    {formatCurrency(deal.value || 0)}
                                  </span>
                                </div>

                                {/* Deal Metadata */}
                                <div className="space-y-1">
                                  {deal.probability !== undefined && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <FunnelIcon className="h-3 w-3" />
                                      <span>{deal.probability}% probabilidade</span>
                                    </div>
                                  )}
                                  {deal.ownerId && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <UserIcon className="h-3 w-3" />
                                      <span>User {deal.ownerId}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <ClockIcon className="h-3 w-3" />
                                    <span>{getDealAge(deal)} dias no pipeline</span>
                                  </div>
                                  {deal.expectedCloseDate && (
                                    <div className="text-xs text-gray-600">
                                      Fechamento:{" "}
                                      {format(
                                        new Date(deal.expectedCloseDate),
                                        "dd/MM/yyyy",
                                        { locale: ptBR }
                                      )}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Empty State */}
                      {dealsByStage[stage.id]?.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          Nenhum deal neste estágio
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* Stats Summary */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total de Deals</p>
              <p className="text-2xl font-bold text-gray-900">
                {deals.filter((d) => {
                  if (searchFilter && !d.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
                  if (ownerFilter && d.ownerId !== ownerFilter) return false;
                  if (minValueFilter && (d.value || 0) < parseFloat(minValueFilter)) return false;
                  if (maxValueFilter && (d.value || 0) > parseFloat(maxValueFilter)) return false;
                  return true;
                }).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  deals
                    .filter((d) => {
                      if (searchFilter && !d.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
                      if (ownerFilter && d.ownerId !== ownerFilter) return false;
                      if (minValueFilter && (d.value || 0) < parseFloat(minValueFilter)) return false;
                      if (maxValueFilter && (d.value || 0) > parseFloat(maxValueFilter)) return false;
                      return true;
                    })
                    .reduce((sum, d) => sum + (d.value || 0), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  deals.length > 0
                    ? deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length
                    : 0
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Idade Média</p>
              <p className="text-2xl font-bold text-purple-600">
                {deals.length > 0
                  ? Math.round(
                      deals.reduce((sum, d) => sum + getDealAge(d), 0) / deals.length
                    )
                  : 0}{" "}
                dias
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Deal Modal */}
      {isDealModalOpen && (
        <DealModal
          isOpen={isDealModalOpen}
          onClose={() => {
            setIsDealModalOpen(false);
            setSelectedDealId(undefined);
          }}
          onCreated={() => {
            loadDeals();
            setIsDealModalOpen(false);
            setSelectedDealId(undefined);
          }}
          dealId={selectedDealId}
        />
      )}
    </AppLayout>
  );
};

export default KanbanPage;
