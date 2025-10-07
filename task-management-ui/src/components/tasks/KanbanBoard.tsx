import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../../types';
import { useTasksStore } from '../../stores/tasks-store';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '../icons';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (status: TaskStatus) => void;
  className?: string;
}

const COLUMN_CONFIG = {
  [TaskStatus.TODO]: {
    title: 'To Do',
    color: 'bg-gray-50 border-gray-200',
    headerColor: 'text-gray-700',
    count: 0,
  },
  [TaskStatus.IN_PROGRESS]: {
    title: 'In Progress',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'text-blue-700',
    count: 0,
  },
  [TaskStatus.IN_REVIEW]: {
    title: 'In Review',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'text-yellow-700',
    count: 0,
  },
  [TaskStatus.DONE]: {
    title: 'Done',
    color: 'bg-green-50 border-green-200',
    headerColor: 'text-green-700',
    count: 0,
  },
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onCreateTask,
  className = '',
}) => {
  const { moveTask } = useTasksStore();
  const [isDragging, setIsDragging] = useState(false);

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => {
    const grouped = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
    } as Record<TaskStatus, Task[]>;

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Update column counts
  Object.keys(COLUMN_CONFIG).forEach((status) => {
    COLUMN_CONFIG[status as TaskStatus].count = tasksByStatus[status as TaskStatus].length;
  });

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      setIsDragging(false);

      const { destination, source, draggableId } = result;

      // If no destination, do nothing
      if (!destination) {
        return;
      }

      // If dropped in the same position, do nothing
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      // Move task to new status
      const newStatus = destination.droppableId as TaskStatus;
      moveTask(draggableId, newStatus);
    },
    [moveTask]
  );

  const handleCreateTask = useCallback(
    (status: TaskStatus) => {
      onCreateTask?.(status);
    },
    [onCreateTask]
  );

  return (
    <div className={`h-full ${className}`}>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          {Object.entries(COLUMN_CONFIG).map(([status, config]) => (
            <div key={status} className="flex flex-col h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-semibold ${config.headerColor}`}>
                    {config.title}
                  </h3>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {config.count}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCreateTask(status as TaskStatus)}
                  className="p-1 h-6 w-6"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Column Content */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      flex-1 rounded-lg border-2 border-dashed p-3 transition-colors
                      ${config.color}
                      ${snapshot.isDraggingOver ? 'border-blue-400 bg-blue-100' : ''}
                      ${isDragging ? 'border-opacity-100' : 'border-opacity-50'}
                    `}
                  >
                    <div className="space-y-3">
                      {tasksByStatus[status as TaskStatus].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                transition-transform
                                ${snapshot.isDragging ? 'rotate-3 scale-105' : ''}
                              `}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => onTaskClick?.(task)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {/* Empty State */}
                    {tasksByStatus[status as TaskStatus].length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">📋</div>
                        <p className="text-sm">No tasks</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateTask(status as TaskStatus)}
                          className="mt-2 text-xs"
                        >
                          Add task
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;