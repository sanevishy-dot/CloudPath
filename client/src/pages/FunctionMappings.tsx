import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Code, ArrowRight, BookOpen, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { fetcher } from '@/lib/queryClient';

export default function FunctionMappings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');

  const { data: mappings, isLoading } = useQuery({
    queryKey: ['/api/function-mappings'],
    queryFn: () => fetcher('/api/function-mappings'),
  });

  const filteredMappings = mappings?.filter((mapping: any) => {
    const matchesSearch = 
      mapping.powerCenterFunction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.iicsEquivalent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.syntax.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesComplexity = complexityFilter === 'all' || mapping.complexity === complexityFilter;
    
    return matchesSearch && matchesComplexity;
  }) || [];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'DIRECT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'MODIFIED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'COMPLEX':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Code className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading function mappings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-function-mappings">Function Mappings</h1>
        <p className="text-muted-foreground">
          PowerCenter to Informatica Cloud function conversion reference
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mappings</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-mappings">
              {mappings?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Function conversions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direct Mappings</CardTitle>
            <ArrowRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-direct-mappings">
              {mappings?.filter((m: any) => m.complexity === 'DIRECT').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">No changes needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modified</CardTitle>
            <ArrowRight className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-modified-mappings">
              {mappings?.filter((m: any) => m.complexity === 'MODIFIED').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires changes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complex</CardTitle>
            <ArrowRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-complex-mappings">
              {mappings?.filter((m: any) => m.complexity === 'COMPLEX').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Manual conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search functions, syntax, or examples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-functions"
          />
        </div>
        <Select value={complexityFilter} onValueChange={setComplexityFilter}>
          <SelectTrigger className="w-48" data-testid="select-complexity-filter">
            <SelectValue placeholder="Filter by complexity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Complexity</SelectItem>
            <SelectItem value="DIRECT">Direct</SelectItem>
            <SelectItem value="MODIFIED">Modified</SelectItem>
            <SelectItem value="COMPLEX">Complex</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Function Mappings */}
      {filteredMappings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No mappings found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {searchTerm || complexityFilter !== 'all' 
                ? "Try adjusting your search or filter criteria."
                : "Function mappings will be loaded here."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredMappings.map((mapping: any) => (
            <Card key={mapping.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center space-x-3">
                      <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-300">
                        {mapping.powerCenterFunction}
                      </code>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-700 dark:text-green-300">
                        {mapping.iicsEquivalent}
                      </code>
                    </CardTitle>
                  </div>
                  <Badge className={getComplexityColor(mapping.complexity)}>
                    {mapping.complexity}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Syntax */}
                <div>
                  <h4 className="text-sm font-medium mb-2">IICS Syntax:</h4>
                  <code className="block bg-muted p-3 rounded text-sm" data-testid={`syntax-${mapping.id}`}>
                    {mapping.syntax}
                  </code>
                </div>

                {/* Examples */}
                {mapping.examples && mapping.examples.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Examples:</h4>
                    <div className="space-y-3">
                      {mapping.examples.map((example: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">PowerCenter:</span>
                            <code className="block bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm mt-1">
                              {example.pc}
                            </code>
                          </div>
                          <div className="flex justify-center">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">IICS:</span>
                            <code className="block bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm mt-1">
                              {example.iics}
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {mapping.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notes:</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {mapping.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Complexity Legend</CardTitle>
          <CardDescription>Understanding function mapping complexity levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start space-x-3">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                DIRECT
              </Badge>
              <div>
                <h4 className="text-sm font-medium">Direct Mapping</h4>
                <p className="text-sm text-muted-foreground">
                  Function works identically in IICS. No changes required.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                MODIFIED
              </Badge>
              <div>
                <h4 className="text-sm font-medium">Modified Syntax</h4>
                <p className="text-sm text-muted-foreground">
                  Function exists but requires syntax or parameter changes.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                COMPLEX
              </Badge>
              <div>
                <h4 className="text-sm font-medium">Complex Conversion</h4>
                <p className="text-sm text-muted-foreground">
                  Requires significant logic changes or multiple functions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}