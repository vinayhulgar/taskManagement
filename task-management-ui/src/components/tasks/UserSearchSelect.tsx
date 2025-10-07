import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { UserIcon, MagnifyingGlassIcon, XMarkIcon } from '../icons';

interface UserSearchSelectProps {
  users: User[];
  selectedUserId?: string;
  onSelect: (userId: string | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
  users,
  selectedUserId,
  onSelect,
  placeholder = "Search and select user...",
  label,
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedUser = users.find(user => user.id === selectedUserId);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredUsers.length) {
          handleSelectUser(filteredUsers[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectUser = (user: User) => {
    onSelect(user.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClearSelection = () => {
    onSelect(undefined);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const getDisplayValue = () => {
    if (selectedUser && !isOpen) {
      return `${selectedUser.firstName} ${selectedUser.lastName}`;
    }
    return searchTerm;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          className="pl-10 pr-10"
        />
        
        {selectedUser && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={disabled}
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Unassigned Option */}
          <button
            type="button"
            onClick={() => handleSelectUser({ id: '', firstName: 'Unassigned', lastName: '', email: '', role: 'USER' as any, isActive: true, createdAt: '', updatedAt: '' })}
            className={`
              w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3
              ${highlightedIndex === -1 ? 'bg-blue-50' : ''}
            `}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Unassigned</div>
              <div className="text-xs text-gray-500">No assignee</div>
            </div>
          </button>

          {/* User Options */}
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user)}
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3
                  ${index === highlightedIndex ? 'bg-blue-50' : ''}
                  ${selectedUserId === user.id ? 'bg-blue-100' : ''}
                `}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
                {selectedUserId === user.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))
          ) : searchTerm ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No users found matching "{searchTerm}"
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No users available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchSelect;