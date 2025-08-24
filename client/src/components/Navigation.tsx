import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Database, 
  Zap, 
  Moon, 
  Sun,
  Activity
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface NavigationProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export default function Navigation({ isDark, toggleTheme }: NavigationProps) {
  const [location] = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', testId: 'nav-dashboard' },
    { path: '/projects', icon: FolderOpen, label: 'Projects', testId: 'nav-projects' },
    { path: '/connections', icon: Database, label: 'Connections', testId: 'nav-connections' },
    { path: '/function-mappings', icon: Zap, label: 'Function Mappings', testId: 'nav-functions' },
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg migration-gradient">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Informatica Migration Tool</h1>
              <p className="text-xs text-muted-foreground">PowerCenter to Cloud Migration</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'flex items-center space-x-2',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                    data-testid={item.testId}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="ml-4"
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}