import React from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

export interface EmptyTeamsStateProps {
  hasSearchQuery: boolean;
  onCreateTeam: () => void;
  onClearSearch: () => void;
}

export const EmptyTeamsState: React.FC<EmptyTeamsStateProps> = ({
  hasSearchQuery,
  onCreateTeam,
  onClearSearch
}) => {
  if (hasSearchQuery) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No teams found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We couldn't find any teams matching your search criteria. 
            Try adjusting your search terms or filters.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={onClearSearch}>
              Clear Search
            </Button>
            <Button onClick={onCreateTeam}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Team
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No teams yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Teams help you organize projects and collaborate with others. 
          Create your first team to get started with project management.
        </p>
        <Button onClick={onCreateTeam} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Team
        </Button>
        
        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <span>Collaborate with team members</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <div className="w-4 h-4 bg-purple-600 rounded-sm"></div>
            </div>
            <span>Organize projects efficiently</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <div className="w-4 h-4 border-2 border-orange-600 rounded-full"></div>
            </div>
            <span>Track progress together</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};