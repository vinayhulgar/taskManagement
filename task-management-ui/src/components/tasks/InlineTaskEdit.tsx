import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, Priority } from '../../types';
import { useTasksStore } from '../../stores/tasks-store';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CheckIcon, XMarkIcon } from '../icons';

interface InlineTaskEditProps {
  task: Task;
  field: 'title' | 'description' | 'priority' | 'status' | 'estimatedHours';
  onSave?: (task: Task) => void;
  onCancel?: () => void;
  className?: string;
}

const PRIORITY_OPTIONS = [
  { value: Priority.LOW, label: 'Low' },
  { value: Priority.MEDIUM, label: 'Medium' },
  { value: Priority.HIGH, label: 'High' },
  { value: Priority.URGENT, label: 'Urgent' },
];

const STATUS_OPTIONS = [
  { value: TaskStatus.TODO, label: 'To Do' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { value: TaskStatus.IN_REVIEW, label: 'In Review' },
  { value: TaskStatus.DONE, label: 'Done' },
];

const InlineTaskEdit: React.FC<InlineTaskEditProps> = ({
  task,
  field,
  onSave,
  onCancel,
  className = '',
}) => {
  const { updateTask } = useTasksStore();
  const [value, setValue] = useState(task[field] || '');
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (field === 'title' || field === 'description') {
        inputRef.current.select();
      }
    }
  }, [field]);

  const validateValue = (val: any) => {
    switch (field) {
      case 'title':
        return typeof val === 'string' && val.trim().length > 0 && val.length <= 200;
      case 'description':
        return true; // Description can be empty
      case 'estimatedHours':
        return val === '' || (typeof val === 'number' && val >= 0 && val <= 1000);
      default:
        return true;
    }
  };

  const handleSave = () => {
    let processedValue = value;
    
    // Process value based on field type
    if (field === 'estimatedHours') {
      processedValue = value === '' ? undefined : parseFloat(value as string);
    }

    if (!validateValue(processedValue)) {
      setIsValid(false);
      return;
    }

    const updates = { [field]: processedValue };
    updateTask(task.id, updates);
    onSave?.({ ...task, ...updates });
  };

  const handleCancel = () => {
    setValue(task[field] || '');
    setIsValid(true);
    onCancel?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleChange = (newValue: any) => {
    setValue(newValue);
    setIsValid(validateValue(newValue));
  };

  const renderInput = () => {
    switch (field) {
      case 'title':
      case 'description':
        return (
          <Input
            ref={inputRef}
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyPress}
            error={!isValid ? 'Invalid value' : undefined}
            className="text-sm"
            placeholder={field === 'title' ? 'Enter task title...' : 'Enter description...'}
          />
        );

      case 'priority':
        return (
          <Select
            options={PRIORITY_OPTIONS}
            value={value as Priority}
            onChange={handleChange}
            className="text-sm"
          />
        );

      case 'status':
        return (
          <Select
            options={STATUS_OPTIONS}
            value={value as TaskStatus}
            onChange={handleChange}
            className="text-sm"
          />
        );

      case 'estimatedHours':
        return (
          <Input
            ref={inputRef}
            type="number"
            min="0"
            max="1000"
            step="0.5"
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyPress}
            error={!isValid ? 'Must be between 0 and 1000' : undefined}
            className="text-sm"
            placeholder="0"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-1">
        {renderInput()}
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={!isValid}
          className="p-1 h-6 w-6"
        >
          <CheckIcon className="h-3 w-3" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="p-1 h-6 w-6"
        >
          <XMarkIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default InlineTaskEdit;