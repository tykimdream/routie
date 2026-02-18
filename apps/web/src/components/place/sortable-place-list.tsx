'use client';

import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';
import { useMemo, useState } from 'react';
import { PlaceCard } from './place-card';
import { GripVerticalIcon } from '@/components/icons';
import type { TripPlace, Priority } from '@/lib/types';

interface SortableItemProps {
  tripPlace: TripPlace;
  index: number;
  groupId: string;
  onChangePriority: (id: string, priority: Priority) => void;
  onRemove: (id: string) => void;
  onClick: (tripPlace: TripPlace) => void;
}

function SortableItem({
  tripPlace,
  index,
  groupId,
  onChangePriority,
  onRemove,
  onClick,
}: SortableItemProps) {
  const { ref, isDragSource } = useSortable({
    id: tripPlace.id,
    index,
    group: groupId,
    type: 'item',
  });

  return (
    <div
      ref={ref}
      className={`transition-opacity ${isDragSource ? 'opacity-50 shadow-lg scale-[1.02]' : ''}`}
    >
      <PlaceCard
        tripPlace={tripPlace}
        onChangePriority={onChangePriority}
        onRemove={onRemove}
        onClick={() => onClick(tripPlace)}
        dragHandle={
          <div className="flex items-center mr-2 text-sand-300 hover:text-sand-500 cursor-grab active:cursor-grabbing touch-none">
            <GripVerticalIcon size={16} />
          </div>
        }
      />
    </div>
  );
}

interface SortablePlaceListProps {
  tripPlaces: TripPlace[];
  onChangePriority: (id: string, priority: Priority) => void;
  onRemove: (id: string) => void;
  onReorder: (priority: Priority, orderedIds: string[]) => void;
  onClickCard: (tripPlace: TripPlace) => void;
}

const priorityLabels: Record<Priority, { emoji: string; label: string }> = {
  MUST: { emoji: '🔴', label: '필수 방문' },
  WANT: { emoji: '🟡', label: '가고 싶어' },
  OPTIONAL: { emoji: '🟢', label: '시간 되면' },
};

// Use a key to remount when tripPlaces changes externally
export function SortablePlaceList({
  tripPlaces,
  onChangePriority,
  onRemove,
  onReorder,
  onClickCard,
}: SortablePlaceListProps) {
  const stableKey = useMemo(
    () =>
      tripPlaces
        .map((tp) => `${tp.id}:${tp.priority}:${tp.sortOrder}`)
        .join(','),
    [tripPlaces],
  );

  return (
    <SortablePlaceListInner
      key={stableKey}
      tripPlaces={tripPlaces}
      onChangePriority={onChangePriority}
      onRemove={onRemove}
      onReorder={onReorder}
      onClickCard={onClickCard}
    />
  );
}

function SortablePlaceListInner({
  tripPlaces,
  onChangePriority,
  onRemove,
  onReorder,
  onClickCard,
}: SortablePlaceListProps) {
  const initialGrouped = useMemo(
    () => ({
      MUST: tripPlaces.filter((tp) => tp.priority === 'MUST'),
      WANT: tripPlaces.filter((tp) => tp.priority === 'WANT'),
      OPTIONAL: tripPlaces.filter((tp) => tp.priority === 'OPTIONAL'),
    }),
    [tripPlaces],
  );

  const [items, setItems] = useState(initialGrouped);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        const { source, target } = event.operation;
        if (!source || !target) return;

        const updated = move(items, event);
        setItems(updated);

        for (const priority of ['MUST', 'WANT', 'OPTIONAL'] as Priority[]) {
          const group = updated[priority];
          const ids = group.map((tp) => tp.id);
          const sourceId = source.id as string;
          if (ids.includes(sourceId)) {
            onReorder(priority, ids);
            break;
          }
        }
      }}
    >
      {(['MUST', 'WANT', 'OPTIONAL'] as const).map((priority) => {
        const places = items[priority];
        if (places.length === 0) return null;
        const { emoji, label } = priorityLabels[priority];
        return (
          <div key={priority}>
            <h4 className="text-sm font-semibold text-sand-500 mb-3">
              {emoji} {label} ({places.length})
            </h4>
            <div className="space-y-2">
              {places.map((tp, index) => (
                <SortableItem
                  key={tp.id}
                  tripPlace={tp}
                  index={index}
                  groupId={priority}
                  onChangePriority={onChangePriority}
                  onRemove={onRemove}
                  onClick={onClickCard}
                />
              ))}
            </div>
          </div>
        );
      })}
    </DragDropProvider>
  );
}
