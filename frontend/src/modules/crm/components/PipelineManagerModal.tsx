// src/modules/crm/components/PipelineManagerModal.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button, Input, Card } from '../../shared';
import * as pipelineService from '../services/pipeline.service';
import type { CrmPipeline, CrmStage } from '../types/pipeline.types';

function SortableStageRow({
  stage,
  onEdit,
  onDelete,
}: {
  stage: CrmStage;
  onEdit: (s: CrmStage) => void;
  onDelete: (s: CrmStage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
          title="Arraste para reordenar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="7" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="9" cy="17" r="1.6" />
            <circle cx="15" cy="7" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="15" cy="17" r="1.6" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{stage.name}</div>
          <div className="text-xs text-gray-500">
            Ordem: {stage.order}{' '}
            {stage.isWon ? '• Ganho' : stage.isLost ? '• Perdido' : ''}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => onEdit(stage)}>
          Editar
        </Button>
        <Button type="button" variant="danger" onClick={() => onDelete(stage)}>
          Excluir
        </Button>
      </div>
    </div>
  );
}

export function PipelineManagerModal({
  isOpen,
  onClose,
  onChanged,
}: {
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');

  const [newPipelineName, setNewPipelineName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newStageIsWon, setNewStageIsWon] = useState(false);
  const [newStageIsLost, setNewStageIsLost] = useState(false);

  const loadedRef = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectedPipeline = useMemo(
    () => pipelines.find((p) => p.id === selectedPipelineId) ?? null,
    [pipelines, selectedPipelineId]
  );

  const stages = useMemo(() => {
    const list = selectedPipeline?.stages ? [...selectedPipeline.stages] : [];
    list.sort((a, b) => a.order - b.order);
    return list;
  }, [selectedPipeline]);

  async function load() {
    setLoading(true);
    try {
      const list = await pipelineService.listPipelines();
      setPipelines(list);

      const def = list.find((p) => p.isDefault) ?? list[0];
      setSelectedPipelineId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev;
        return def?.id ?? '';
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      loadedRef.current = false;
      return;
    }

    if (!loadedRef.current) {
      loadedRef.current = true;
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function handleCreatePipeline() {
    const name = newPipelineName.trim();
    if (!name) return;

    try {
      await pipelineService.createPipeline({ name });
      setNewPipelineName('');
      await load();
      await onChanged();
    } catch (e: any) {
      alert(e?.message ?? 'Erro ao criar funil (talvez já exista um com esse nome).');
    }
  }

  async function handleSetDefault(pipelineId: string) {
    await pipelineService.updatePipeline(pipelineId, { isDefault: true });
    await load();
    await onChanged();
  }

  async function handleDeletePipeline(pipelineId: string) {
    if (!confirm('Excluir este funil? (Apenas se não houver negociações nele)')) return;
    await pipelineService.deletePipeline(pipelineId);
    await load();
    await onChanged();
  }

  async function handleAddStage() {
    if (!selectedPipelineId) return;

    const name = newStageName.trim();
    if (!name) return;

    if (newStageIsWon && newStageIsLost) {
      alert("O estágio não pode ser 'Ganho' e 'Perdido' ao mesmo tempo.");
      return;
    }

    const nextOrder = stages.length ? Math.max(...stages.map((s) => s.order)) + 1 : 0;

    await pipelineService.createStage(selectedPipelineId, {
      name,
      order: nextOrder,
      isWon: newStageIsWon,
      isLost: newStageIsLost,
    });

    setNewStageName('');
    setNewStageIsWon(false);
    setNewStageIsLost(false);

    await load();
    await onChanged();
  }

  async function handleEditStage(stage: CrmStage) {
    const name = prompt('Novo nome do estágio:', stage.name);
    if (!name) return;

    const mark = prompt(
      "Marcar como: (vazio) / won / lost",
      stage.isWon ? 'won' : stage.isLost ? 'lost' : ''
    );

    const isWon = mark === 'won';
    const isLost = mark === 'lost';
    if (isWon && isLost) return;

    await pipelineService.updateStage(selectedPipelineId, stage.id, { name, isWon, isLost });
    await load();
    await onChanged();
  }

  async function handleDeleteStage(stage: CrmStage) {
    if (!confirm(`Excluir estágio "${stage.name}"? (Somente se não houver negociações nele)`))
      return;

    await pipelineService.deleteStage(selectedPipelineId, stage.id);
    await load();
    await onChanged();
  }

async function onDragEnd(e: DragEndEvent) {
  if (!selectedPipeline) return;

  const { active, over } = e;
  if (!over) return;
  if (active.id === over.id) return;

  const oldIndex = stages.findIndex((s) => s.id === active.id);
  const newIndex = stages.findIndex((s) => s.id === over.id);
  if (oldIndex === -1 || newIndex === -1) return;

  const reordered = arrayMove(stages, oldIndex, newIndex);

  // update otimista local
  setPipelines((prev) =>
    prev.map((p) =>
      p.id !== selectedPipeline.id
        ? p
        : { ...p, stages: reordered.map((s, idx) => ({ ...s, order: idx })) }
    )
  );

  try {
    await pipelineService.reorderStages(selectedPipeline.id, reordered.map((s) => s.id));
  } catch (err) {
    alert("Falhou ao salvar a ordem dos estágios. Confira Network/Console.");
  }

  await load();
  await onChanged();
}


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 top-8 mx-auto w-[min(980px,92vw)] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Gerenciar funis</h3>
            <p className="text-sm text-gray-600">
              Crie funis, adicione estágios e reordene por arrastar e soltar.
            </p>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* FUNIS */}
          <Card className="p-4 md:col-span-1">
            <div className="font-semibold mb-3">Funis</div>

            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Novo funil..."
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
              />
              <Button onClick={handleCreatePipeline} disabled={!newPipelineName.trim()}>
                Criar
              </Button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="text-sm text-gray-500">Carregando...</div>
              ) : pipelines.length === 0 ? (
                <div className="text-sm text-gray-500">Nenhum funil.</div>
              ) : (
                pipelines.map((p) => (
                  // ✅ IMPORTANTE: não usar <button> aqui, senão dá nested button com <Button/>
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPipelineId(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedPipelineId(p.id);
                    }}
                    className={[
                      'w-full text-left p-3 rounded-lg border transition cursor-pointer select-none',
                      p.id === selectedPipelineId
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.stages?.length ?? 0} estágios</div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(p.id);
                          }}
                        >
                          Padrão
                        </Button>

                        {!p.isDefault && (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePipeline(p.id);
                            }}
                          >
                            Excluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* STAGES */}
          <Card className="p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="font-semibold">Estágios</div>
                <div className="text-xs text-gray-500">
                  {selectedPipeline ? (
                    <>
                      Funil: <span className="font-medium">{selectedPipeline.name}</span> •{' '}
                      <span className="font-medium">{stages.length}</span> estágios
                    </>
                  ) : (
                    'Selecione um funil.'
                  )}
                </div>
              </div>
            </div>

            {/* criar stage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Input
                placeholder="Nome do estágio..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                disabled={!selectedPipelineId}
              />

              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newStageIsWon}
                    onChange={(e) => setNewStageIsWon(e.target.checked)}
                    disabled={!selectedPipelineId}
                  />
                  Ganho
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newStageIsLost}
                    onChange={(e) => setNewStageIsLost(e.target.checked)}
                    disabled={!selectedPipelineId}
                  />
                  Perdido
                </label>
              </div>

              <Button onClick={handleAddStage} disabled={!selectedPipelineId || !newStageName.trim()}>
                Adicionar
              </Button>
            </div>

            {selectedPipeline && stages.length === 0 ? (
              <div className="text-sm text-gray-500">Este funil ainda não tem estágios.</div>
            ) : selectedPipeline ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {stages.map((stage) => (
                      <SortableStageRow
                        key={stage.id}
                        stage={stage}
                        onEdit={handleEditStage}
                        onDelete={handleDeleteStage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-sm text-gray-500">Selecione um funil para editar os estágios.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
