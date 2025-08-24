import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { 
  ArrowLeft, 
  Play, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Settings,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetcher, apiRequest } from '@/lib/queryClient';
import { formatDate, getStatusColor, getComplexityColor, calculateProgress } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function ProjectDetail() {
  const [, params] = useRoute('/projects/:id');
  const projectId = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading } = useQuery({
    queryKey: ['/api/migration-projects', projectId],
    queryFn: () => fetcher(`/api/migration-projects/${projectId}`),
    enabled: !!projectId,
  });

  const { data: objects } = useQuery({
    queryKey: ['/api/migration-projects', projectId, 'objects'],
    queryFn: () => fetcher(`/api/migration-projects/${projectId}/objects`),
    enabled: !!projectId,
  });

  const { data: assessment } = useQuery({
    queryKey: ['/api/migration-projects', projectId, 'assessment'],
    queryFn: () => fetcher(`/api/migration-projects/${projectId}/assessment`),
    enabled: !!projectId,
  });

  const { data: issues } = useQuery({
    queryKey: ['/api/migration-projects', projectId, 'issues'],
    queryFn: () => fetcher(`/api/migration-projects/${projectId}/issues`),
    enabled: !!projectId,
  });

  const { data: syncStatus } = useQuery({
    queryKey: ['/api/migration-projects', projectId, 'sync-status'],
    queryFn: () => fetcher(`/api/migration-projects/${projectId}/sync-status`),
    enabled: !!projectId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  const discoverMutation = useMutation({
    mutationFn: () => apiRequest(`/api/migration-projects/${projectId}/discover`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration-projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/migration-projects', projectId, 'objects'] });
      toast({
        title: 'Discovery completed',
        description: 'Repository objects have been discovered and analyzed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Discovery failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const assessMutation = useMutation({
    mutationFn: () => apiRequest(`/api/migration-projects/${projectId}/assess`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration-projects', projectId, 'assessment'] });
      toast({
        title: 'Assessment completed',
        description: 'Migration complexity analysis has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Assessment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const startSyncMutation = useMutation({
    mutationFn: () => apiRequest(`/api/migration-projects/${projectId}/start-sync`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration-projects', projectId, 'sync-status'] });
      toast({
        title: 'Real-time sync started',
        description: 'Repository changes will be monitored in real-time.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start sync',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-muted-foreground">Project not found</h1>
        <Link href="/projects">
          <Button className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const objectsByType = objects?.reduce((acc: any, obj: any) => {
    acc[obj.objectType] = (acc[obj.objectType] || 0) + 1;
    return acc;
  }, {}) || {};

  const migrationProgress = calculateProgress(project.migratedObjects, project.totalObjects);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/projects">
          <Button variant="ghost" size="sm" data-testid="button-back-to-projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="heading-project-detail">
            {project.name}
          </h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Badge className={getStatusColor(project.status)}>
          {project.status}
        </Badge>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Objects</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-objects">
              {project.totalObjects}
            </div>
            <p className="text-xs text-muted-foreground">
              Discovered objects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Migration Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-migration-progress">
              {migrationProgress}%
            </div>
            <Progress value={migrationProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Coverage</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-automation-coverage">
              {project.autoMigrationPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Automatic migration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time Sync</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus ? (
                <Badge 
                  variant={syncStatus.status === 'SYNCING' ? 'default' : 'secondary'}
                  data-testid="sync-status"
                >
                  {syncStatus.status}
                </Badge>
              ) : (
                <span className="text-muted-foreground">Not Started</span>
              )}
            </div>
            {syncStatus && (
              <p className="text-xs text-muted-foreground">
                Last sync: {formatDate(syncStatus.lastSyncTime)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => discoverMutation.mutate()}
          disabled={discoverMutation.isPending}
          data-testid="button-start-discovery"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {discoverMutation.isPending ? 'Discovering...' : 'Start Discovery'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => assessMutation.mutate()}
          disabled={assessMutation.isPending || project.totalObjects === 0}
          data-testid="button-run-assessment"
        >
          <Play className="mr-2 h-4 w-4" />
          {assessMutation.isPending ? 'Assessing...' : 'Run Assessment'}
        </Button>

        <Button
          variant="outline"
          onClick={() => startSyncMutation.mutate()}
          disabled={startSyncMutation.isPending || syncStatus?.status === 'SYNCING'}
          data-testid="button-start-sync"
        >
          <Activity className="mr-2 h-4 w-4" />
          {startSyncMutation.isPending ? 'Starting...' : 'Start Real-time Sync'}
        </Button>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="objects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="objects" data-testid="tab-objects">Objects</TabsTrigger>
          <TabsTrigger value="assessment" data-testid="tab-assessment">Assessment</TabsTrigger>
          <TabsTrigger value="issues" data-testid="tab-issues">Issues</TabsTrigger>
          <TabsTrigger value="sync" data-testid="tab-sync">Real-time Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="objects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Object Distribution</CardTitle>
              <CardDescription>PowerCenter objects discovered in the repository</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(objectsByType).length === 0 ? (
                <div className="text-center py-8">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No objects discovered yet. Run discovery to scan the repository.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(objectsByType).map(([type, count]: [string, any]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{type}</span>
                      <Badge variant="secondary" data-testid={`object-count-${type}`}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Objects Table */}
          {objects && objects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Objects Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Folder</th>
                        <th className="text-left p-2">Complexity</th>
                        <th className="text-left p-2">Migration Status</th>
                        <th className="text-left p-2">Automation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {objects.slice(0, 20).map((obj: any) => (
                        <tr key={obj.id} className="border-b">
                          <td className="p-2 font-medium" data-testid={`object-name-${obj.id}`}>
                            {obj.objectName}
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">{obj.objectType}</Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">{obj.folderName}</td>
                          <td className="p-2">
                            <Badge className={getComplexityColor(obj.complexity)}>
                              {obj.complexity}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge 
                              variant={obj.migrationStatus === 'FULLY_AUTO' ? 'default' : 'secondary'}
                            >
                              {obj.migrationStatus}
                            </Badge>
                          </td>
                          <td className="p-2" data-testid={`automation-${obj.id}`}>
                            {obj.automationCoverage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {objects.length > 20 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Showing first 20 of {objects.length} objects
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migration Assessment</CardTitle>
              <CardDescription>Automated analysis of migration complexity and effort</CardDescription>
            </CardHeader>
            <CardContent>
              {assessment && assessment.length > 0 ? (
                <div className="space-y-4">
                  {assessment.map((result: any) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.assessmentType} Assessment</h4>
                        <Badge className={getComplexityColor(result.result)}>
                          {result.result}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Confidence: {result.confidence}%
                      </p>
                      {result.estimatedEffort && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Estimated Effort: {result.estimatedEffort} hours
                        </p>
                      )}
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Recommendations:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {result.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No assessment results yet. Run assessment to analyze migration complexity.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migration Issues</CardTitle>
              <CardDescription>Issues identified during analysis and migration</CardDescription>
            </CardHeader>
            <CardContent>
              {issues && issues.length > 0 ? (
                <div className="space-y-4">
                  {issues.map((issue: any) => (
                    <div key={issue.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{issue.issueType}</h4>
                        <Badge 
                          variant={issue.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {issue.description}
                      </p>
                      {issue.suggestedFix && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Suggested Fix:</h5>
                          <p className="text-sm text-muted-foreground">{issue.suggestedFix}</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-3">
                        <Badge variant="outline">
                          {issue.status}
                        </Badge>
                        {issue.isAutoFixable && (
                          <Badge variant="outline" className="text-green-600">
                            Auto-fixable
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No issues found. Great job!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Repository Sync</CardTitle>
              <CardDescription>Live monitoring of PowerCenter repository changes</CardDescription>
            </CardHeader>
            <CardContent>
              {syncStatus ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Sync Status</h4>
                      <Badge 
                        variant={syncStatus.status === 'SYNCING' ? 'default' : 'secondary'}
                        className="text-sm"
                      >
                        {syncStatus.status}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Last Sync</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(syncStatus.lastSyncTime)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Sync Type</h4>
                      <p className="text-sm text-muted-foreground">{syncStatus.syncType}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Items Processed</h4>
                      <p className="text-sm text-muted-foreground">{syncStatus.itemsProcessed}</p>
                    </div>
                  </div>
                  
                  {syncStatus.errors && syncStatus.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Sync Errors</h4>
                      <div className="space-y-2">
                        {syncStatus.errors.map((error: string, index: number) => (
                          <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded border">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Real-time sync not started. Click "Start Real-time Sync" to begin monitoring.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}