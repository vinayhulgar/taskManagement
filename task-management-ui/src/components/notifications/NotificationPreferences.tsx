import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Settings, Save } from 'lucide-react';

export interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationPreferencesProps {
  preferences: NotificationPreference[];
  onSave: (preferences: NotificationPreference[]) => void;
  loading?: boolean;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  preferences: initialPreferences,
  onSave,
  loading = false,
}) => {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePreference = (
    type: string,
    channel: 'email' | 'push' | 'inApp',
    enabled: boolean
  ) => {
    const updated = preferences.map(pref =>
      pref.type === type ? { ...pref, [channel]: enabled } : pref
    );
    setPreferences(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(preferences);
    setHasChanges(false);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return Mail;
      case 'push':
        return Smartphone;
      case 'inApp':
        return Bell;
      default:
        return Bell;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Notification Preferences
          </h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Choose how you want to be notified about different activities
        </p>
      </div>

      {/* Preferences Table */}
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notification Type
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center space-x-1">
                  <Smartphone className="h-4 w-4" />
                  <span>Push</span>
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center space-x-1">
                  <Bell className="h-4 w-4" />
                  <span>In-App</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preferences.map((preference) => (
              <tr key={preference.type} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {preference.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {preference.description}
                    </div>
                  </div>
                </td>
                
                {(['email', 'push', 'inApp'] as const).map((channel) => (
                  <td key={channel} className="px-6 py-4 text-center">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={preference[channel]}
                        onChange={(e) =>
                          updatePreference(preference.type, channel, e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                      />
                      <span className="sr-only">
                        Enable {channel} notifications for {preference.label}
                      </span>
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Changes are saved automatically
          </div>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className={`
              inline-flex items-center px-4 py-2 border border-transparent
              text-sm font-medium rounded-md shadow-sm
              ${hasChanges && !loading
                ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2
            `}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Default notification preferences
export const defaultNotificationPreferences: NotificationPreference[] = [
  {
    type: 'task_assigned',
    label: 'Task Assigned',
    description: 'When a task is assigned to you',
    email: true,
    push: true,
    inApp: true,
  },
  {
    type: 'task_completed',
    label: 'Task Completed',
    description: 'When a task you created is completed',
    email: true,
    push: false,
    inApp: true,
  },
  {
    type: 'comment_added',
    label: 'Comments',
    description: 'When someone comments on your tasks',
    email: false,
    push: true,
    inApp: true,
  },
  {
    type: 'project_updated',
    label: 'Project Updates',
    description: 'When projects you\'re part of are updated',
    email: true,
    push: false,
    inApp: true,
  },
  {
    type: 'team_invitation',
    label: 'Team Invitations',
    description: 'When you\'re invited to join a team',
    email: true,
    push: true,
    inApp: true,
  },
  {
    type: 'due_date_reminder',
    label: 'Due Date Reminders',
    description: 'Reminders for upcoming task due dates',
    email: true,
    push: true,
    inApp: true,
  },
];