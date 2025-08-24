import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, FolderOpen, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { fetcher, apiRequest } from '@/lib/queryClient';
import { formatDate, getStatusColor, calculateProgress } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import CreateProjectDialog from '@/components/CreateProjectDialog';

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/migration-projects'],
    queryFn: () => fetcher('/api/migration-projects'),
  });

  const { data: connections } = useQuery({
    queryKey: ['/api/repository-connections'],
    queryFn: () => fetcher('/api/repository-connections'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/migration-projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration-projects'] });
      toast({
        title: 'Project deleted',
        description: 'The migration project has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting project',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredProjects = projects?.filter((project: any) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <FolderOpen className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-projects">Migration Projects</h1>
          <p className="text-muted-foreground">
            Manage your PowerCenter to Cloud migration projects
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-project"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-projects"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DISCOVERY">Discovery</SelectItem>
            <SelectItem value="ASSESSMENT">Assessment</SelectItem>
            <SelectItem value="MIGRATION">Migration</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first migration project."
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                className="mt-4" 
                onClick={() => setIsCreateDialogOpen(true)}
                data-testid="button-create-first-project"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project: any) => {
            const connection = connections?.find((c: any) => c.id === project.repositoryConnectionId);
            const progress = calculateProgress(project.migratedObjects, project.totalObjects);
            
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Link href={`/projects/${project.id}`}>
                        <CardTitle 
                          className="text-lg hover:underline cursor-pointer" 
                          data-testid={`project-title-${project.id}`}
                        >
                          {project.name}
                        </CardTitle>
                      </Link>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  {project.totalObjects > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Migration Progress</span>
                        <span className="text-muted-foreground">
                          {project.migratedObjects}/{project.totalObjects}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Automation Coverage */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Automation Coverage</span>
                    <span className="text-sm font-medium" data-testid={`automation-${project.id}`}>
                      {project.autoMigrationPercentage}%
                    </span>
                  </div>

                  {/* Connection */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Repository</span>
                    <span className="text-sm font-medium">
                      {connection?.name || 'Unknown'}
                    </span>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between pt-2">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-project-${project.id}`}>
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProjectMutation.mutate(project.id)}
                      disabled={deleteProjectMutation.isPending}
                      data-testid={`button-delete-project-${project.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Statistics Summary */}
      {filteredProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projects Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold" data-testid="summary-total">
                  {filteredProjects.length}
                </div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="summary-completed">
                  {filteredProjects.filter((p: any) => p.status === 'COMPLETED').length}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600" data-testid="summary-in-progress">
                  {filteredProjects.filter((p: any) => ['DISCOVERY', 'ASSESSMENT', 'MIGRATION'].includes(p.status)).length}
                </div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600" data-testid="summary-avg-automation">
                  {filteredProjects.length > 0 
                    ? Math.round(filteredProjects.reduce((sum: number, p: any) => sum + p.autoMigrationPercentage, 0) / filteredProjects.length)
                    : 0
                  }%
                </div>
                <p className="text-sm text-muted-foreground">Avg Automation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        connections={connections || []}
      />
    </div>
  );
}