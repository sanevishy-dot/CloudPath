import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  repositoryConnectionId: z.string().min(1, 'Repository connection is required'),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: any[];
}

export default function CreateProjectDialog({ 
  open, 
  onOpenChange, 
  connections 
}: CreateProjectDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      repositoryConnectionId: '',
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectForm) =>
      apiRequest('/api/migration-projects', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration-projects'] });
      toast({
        title: 'Project created successfully',
        description: 'Your migration project has been created and is ready for discovery.',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating project',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    createProjectMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Migration Project</DialogTitle>
          <DialogDescription>
            Create a new PowerCenter to Cloud migration project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Enter project name"
              data-testid="input-project-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              {...form.register('description')}
              placeholder="Enter project description"
              data-testid="input-project-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repositoryConnectionId">Repository Connection</Label>
            <Select 
              value={form.watch('repositoryConnectionId')} 
              onValueChange={(value) => form.setValue('repositoryConnectionId', value)}
            >
              <SelectTrigger data-testid="select-repository-connection">
                <SelectValue placeholder="Select a repository connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    {connection.name} ({connection.hostname})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.repositoryConnectionId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.repositoryConnectionId.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-project"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending}
              data-testid="button-create-project-submit"
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}