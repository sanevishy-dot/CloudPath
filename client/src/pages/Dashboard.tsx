import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Database, 
  FolderOpen, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { fetcher } from '@/lib/queryClient';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => fetcher('/api/dashboard/stats'),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/migration-projects'],
    queryFn: () => fetcher('/api/migration-projects'),
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['/api/repository-connections'],
    queryFn: () => fetcher('/api/repository-connections'),
  });

  if (statsLoading || projectsLoading || connectionsLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const recentProjects = projects?.slice(0, 5) || [];
  const activeConnections = connections?.filter((c: any) => c.isActive) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-dashboard">Migration Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your PowerCenter to Cloud migration progress and real-time repository integration
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-projects">
              {stats?.totalProjects || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active migration projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-connections">
              {stats?.activeConnections || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time repository sync enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Automation</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-automation-coverage">
              {stats?.avgAutomationCoverage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Automatic migration coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Migration Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-completed-projects">
              {stats?.projectsByStatus?.COMPLETED || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all migration projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.projectsByStatus && Object.entries(stats.projectsByStatus).map(([status, count]: [string, any]) => {
              const percentage = stats.totalProjects > 0 ? (count / stats.totalProjects) * 100 : 0;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{status}</span>
                    <span className="text-sm text-muted-foreground">{count} projects</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your migration journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/connections">
              <Button className="w-full justify-start" data-testid="button-setup-connection">
                <Database className="mr-2 h-4 w-4" />
                Set up Repository Connection
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="w-full justify-start" data-testid="button-create-project">
                <FolderOpen className="mr-2 h-4 w-4" />
                Create Migration Project
              </Button>
            </Link>
            <Link href="/function-mappings">
              <Button variant="outline" className="w-full justify-start" data-testid="button-view-mappings">
                <Zap className="mr-2 h-4 w-4" />
                View Function Mappings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Active Connections */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest migration projects</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-6">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No projects yet</p>
                <Link href="/projects">
                  <Button className="mt-4" size="sm" data-testid="button-create-first-project">
                    Create your first project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Link href={`/projects/${project.id}`}>
                        <p className="text-sm font-medium hover:underline" data-testid={`project-${project.id}`}>
                          {project.name}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(project.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      {project.autoMigrationPercentage > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {project.autoMigrationPercentage}% auto
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Connections</CardTitle>
            <CardDescription>Repository connections with real-time sync</CardDescription>
          </CardHeader>
          <CardContent>
            {activeConnections.length === 0 ? (
              <div className="text-center py-6">
                <Database className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No active connections</p>
                <Link href="/connections">
                  <Button className="mt-4" size="sm" data-testid="button-setup-first-connection">
                    Set up your first connection
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeConnections.map((connection: any) => (
                  <div key={connection.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium" data-testid={`connection-${connection.id}`}>
                        {connection.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connection.hostname}:{connection.port}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {connection.connectionType}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Real-time integration and migration system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">PowerCenter API</p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Real-time Sync</p>
                <p className="text-xs text-muted-foreground">Active connections syncing</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Migration Engine</p>
                <p className="text-xs text-muted-foreground">Ready for new projects</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}