import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null): string {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function getComplexityColor(complexity: string): string {
  switch (complexity) {
    case 'SIMPLE':
      return 'complexity-simple';
    case 'MEDIUM':
      return 'complexity-medium';
    case 'COMPLEX':
      return 'complexity-complex';
    default:
      return 'complexity-medium';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'DISCOVERY':
      return 'status-discovery';
    case 'ASSESSMENT':
      return 'status-assessment';
    case 'MIGRATION':
      return 'status-migration';
    case 'COMPLETED':
      return 'status-completed';
    default:
      return 'status-discovery';
  }
}

export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}