import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Default fetcher function
export async function fetcher(url: string): Promise<any> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || 'An error occurred';
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

// API request helper for mutations
export async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || 'An error occurred';
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    
    throw new Error(errorMessage);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}