import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Database, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Trash2,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetcher, apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const connectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required'),
  hostname: z.string().min(1, 'Hostname is required'),
  port: z.number().min(1, 'Port must be greater than 0').max(65535, 'Port must be less than 65536'),
  repositoryName: z.string().min(1, 'Repository name is required'),
  username: z.string().min(1, 'Username is required'),
  connectionType: z.enum(['REST_API', 'PMREP']),
  apiVersion: z.string().optional(),
});

type ConnectionForm = z.infer<typeof connectionSchema>;

export default function Connections() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: connections, isLoading } = useQuery({
    queryKey: ['/api/repository-connections'],
    queryFn: () => fetcher('/api/repository-connections'),
  });

  const form = useForm<ConnectionForm>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      name: '',
      hostname: '',
      port: 6005,
      repositoryName: '',
      username: '',
      connectionType: 'REST_API',
      apiVersion: '',
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: (data: ConnectionForm) =>
      apiRequest('/api/repository-connections', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repository-connections'] });
      toast({
        title: 'Connection created',
        description: 'Repository connection has been created successfully.',
      });
      form.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateConnectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ConnectionForm> }) =>
      apiRequest(`/api/repository-connections/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repository-connections'] });
      toast({
        title: 'Connection updated',
        description: 'Repository connection has been updated successfully.',
      });
      setIsEditDialogOpen(false);
      setEditingConnection(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/repository-connections/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repository-connections'] });
      toast({
        title: 'Connection deleted',
        description: 'Repository connection has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/repository-connections/${id}/test`, { method: 'POST' }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/repository-connections'] });
      toast({
        title: data.connected ? 'Connection successful' : 'Connection failed',
        description: data.connected 
          ? 'Repository connection is working correctly.'
          : 'Unable to connect to the repository.',
        variant: data.connected ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Test connection failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ConnectionForm) => {
    createConnectionMutation.mutate(data);
  };

  const onEditSubmit = (data: ConnectionForm) => {
    if (editingConnection) {
      updateConnectionMutation.mutate({ 
        id: editingConnection.id, 
        data: { ...data, port: Number(data.port) } 
      });
    }
  };

  const handleEdit = (connection: any) => {
    setEditingConnection(connection);
    form.reset({
      name: connection.name,
      hostname: connection.hostname,
      port: connection.port,
      repositoryName: connection.repositoryName,
      username: connection.username,
      connectionType: connection.connectionType,
      apiVersion: connection.apiVersion || '',
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Database className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-connections">Repository Connections</h1>
          <p className="text-muted-foreground">
            Manage PowerCenter repository connections with real-time sync capabilities
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-connection"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>

      {/* Connections Grid */}
      {!connections || connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No connections configured</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Set up your first PowerCenter repository connection to start migrating workflows.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-first-connection"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection: any) => (
            <Card key={connection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg" data-testid={`connection-name-${connection.id}`}>
                      {connection.name}
                    </CardTitle>
                    <CardDescription>
                      {connection.hostname}:{connection.port}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    {connection.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={connection.isActive ? 'default' : 'secondary'}>
                      {connection.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Connection Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Repository:</span>
                    <span className="font-medium">{connection.repositoryName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{connection.connectionType}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-medium">{connection.username}</span>
                  </div>
                  {connection.lastConnected && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Connected:</span>
                      <span className="text-xs">{formatDate(connection.lastConnected)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnectionMutation.mutate(connection.id)}
                    disabled={testConnectionMutation.isPending}
                    data-testid={`button-test-connection-${connection.id}`}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {testConnectionMutation.isPending ? 'Testing...' : 'Test'}
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(connection)}
                      data-testid={`button-edit-connection-${connection.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteConnectionMutation.mutate(connection.id)}
                      disabled={deleteConnectionMutation.isPending}
                      data-testid={`button-delete-connection-${connection.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Connection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Repository Connection</DialogTitle>
            <DialogDescription>
              Connect to your PowerCenter repository for real-time migration.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Enter connection name"
                data-testid="input-connection-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hostname">Hostname</Label>
                <Input
                  id="hostname"
                  {...form.register('hostname')}
                  placeholder="localhost"
                  data-testid="input-hostname"
                />
                {form.formState.errors.hostname && (
                  <p className="text-sm text-red-500">{form.formState.errors.hostname.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  {...form.register('port', { valueAsNumber: true })}
                  placeholder="6005"
                  data-testid="input-port"
                />
                {form.formState.errors.port && (
                  <p className="text-sm text-red-500">{form.formState.errors.port.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repositoryName">Repository Name</Label>
              <Input
                id="repositoryName"
                {...form.register('repositoryName')}
                placeholder="PowerCenter Repository"
                data-testid="input-repository-name"
              />
              {form.formState.errors.repositoryName && (
                <p className="text-sm text-red-500">{form.formState.errors.repositoryName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...form.register('username')}
                placeholder="Repository username"
                data-testid="input-username"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="connectionType">Connection Type</Label>
              <Select 
                value={form.watch('connectionType')} 
                onValueChange={(value) => form.setValue('connectionType', value as 'REST_API' | 'PMREP')}
              >
                <SelectTrigger data-testid="select-connection-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REST_API">REST API (Recommended)</SelectItem>
                  <SelectItem value="PMREP">pmrep Command Line</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.watch('connectionType') === 'REST_API' && (
              <div className="space-y-2">
                <Label htmlFor="apiVersion">API Version (Optional)</Label>
                <Input
                  id="apiVersion"
                  {...form.register('apiVersion')}
                  placeholder="v1"
                  data-testid="input-api-version"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createConnectionMutation.isPending}
                data-testid="button-create-connection-submit"
              >
                {createConnectionMutation.isPending ? 'Creating...' : 'Create Connection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Connection Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Repository Connection</DialogTitle>
            <DialogDescription>
              Update your PowerCenter repository connection settings.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Connection Name</Label>
              <Input
                id="edit-name"
                {...form.register('name')}
                placeholder="Enter connection name"
                data-testid="input-edit-connection-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hostname">Hostname</Label>
                <Input
                  id="edit-hostname"
                  {...form.register('hostname')}
                  placeholder="localhost"
                  data-testid="input-edit-hostname"
                />
                {form.formState.errors.hostname && (
                  <p className="text-sm text-red-500">{form.formState.errors.hostname.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-port">Port</Label>
                <Input
                  id="edit-port"
                  type="number"
                  {...form.register('port', { valueAsNumber: true })}
                  placeholder="6005"
                  data-testid="input-edit-port"
                />
                {form.formState.errors.port && (
                  <p className="text-sm text-red-500">{form.formState.errors.port.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-repositoryName">Repository Name</Label>
              <Input
                id="edit-repositoryName"
                {...form.register('repositoryName')}
                placeholder="PowerCenter Repository"
                data-testid="input-edit-repository-name"
              />
              {form.formState.errors.repositoryName && (
                <p className="text-sm text-red-500">{form.formState.errors.repositoryName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                {...form.register('username')}
                placeholder="Repository username"
                data-testid="input-edit-username"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-connectionType">Connection Type</Label>
              <Select 
                value={form.watch('connectionType')} 
                onValueChange={(value) => form.setValue('connectionType', value as 'REST_API' | 'PMREP')}
              >
                <SelectTrigger data-testid="select-edit-connection-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REST_API">REST API (Recommended)</SelectItem>
                  <SelectItem value="PMREP">pmrep Command Line</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.watch('connectionType') === 'REST_API' && (
              <div className="space-y-2">
                <Label htmlFor="edit-apiVersion">API Version (Optional)</Label>
                <Input
                  id="edit-apiVersion"
                  {...form.register('apiVersion')}
                  placeholder="v1"
                  data-testid="input-edit-api-version"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateConnectionMutation.isPending}
                data-testid="button-update-connection-submit"
              >
                {updateConnectionMutation.isPending ? 'Updating...' : 'Update Connection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}