import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Calendar, Activity } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { TeamCard } from '../../components/teams/TeamCard';
import { CreateTeamModal } from '../../components/teams/CreateTeamModal';
import { TeamFilters } from '../../components/teams/TeamFilters';
import { EmptyTeamsState } from '../../components/teams/EmptyTeamsState';
import { useTeamsStore } from '../../stores/teams-store';
import { useAuthStore } from '../../stores/auth-store';
import { TeamService } from '../../services/team/team-service';
import { Team } from '../../types';
import { cn } from '../../utils';

export const TeamsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    teams, 
    isLoading, 
    error, 
    setTeams, 
    setLoading, 
    setError,
    addTeam 
  } = useTeamsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ownedByMe: false,
    memberOf: false,
    sortBy: 'name' as 'name' | 'created' | 'members',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  // Load teams on component mount
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const teamsData = await TeamService.getMyTeams();
      setTeams(teamsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (teamData: { name: string; description?: string }) => {
    try {
      const newTeam = await TeamService.createTeam(teamData);
      addTeam(newTeam);
      setShowCreateModal(false);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter and sort teams
  const filteredTeams = React.useMemo(() => {
    let filtered = teams.filter(team => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          team.name.toLowerCase().includes(query) ||
          team.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Ownership filters
    if (filters.ownedByMe && user) {
      filtered = filtered.filter(team => team.ownerId === user.id);
    }

    if (filters.memberOf && user) {
      filtered = filtered.filter(team => 
        team.members?.some(member => member.userId === user.id) || 
        team.ownerId === user.id
      );
    }

    // Sort teams
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'members':
          comparison = (a.memberCount || 0) - (b.memberCount || 0);
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [teams, searchQuery, filters, user]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-xs">!</span>
              </div>
              <p className="font-medium">Error loading teams</p>
            </div>
            <p className="text-red-600 text-sm mt-2">{error}</p>
            <Button 
              onClick={loadTeams} 
              variant="outline" 
              size="sm" 
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">
            Manage your teams and collaborate with members
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2",
            showFilters && "bg-gray-100"
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <TeamFilters
          filters={filters}
          onFiltersChange={setFilters}
          className="mb-6"
        />
      )}

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <EmptyTeamsState 
          hasSearchQuery={!!searchQuery}
          onCreateTeam={() => setShowCreateModal(true)}
          onClearSearch={() => setSearchQuery('')}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Teams</p>
                    <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teams Owned</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {user ? teams.filter(t => t.ownerId === user.id).length : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teams.reduce((sum, team) => sum + (team.memberCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTeam}
      />
    </div>
  );
};