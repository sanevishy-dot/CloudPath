const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple in-memory storage
let projects = [
  {
    id: '1',
    name: 'Customer Data Migration',
    description: 'Migrate customer workflows to cloud',
    status: 'ASSESSMENT',
    autoMigrationPercentage: 85,
    totalObjects: 15,
    migratedObjects: 3,
    repositoryConnectionId: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  }
];

let connections = [
  {
    id: '1',
    name: 'Production PowerCenter',
    hostname: 'pc-server-01',
    port: 6005,
    repositoryName: 'PC_REPO',
    username: 'admin',
    connectionType: 'REST_API',
    isActive: true,
    lastConnected: new Date(),
    createdAt: new Date('2024-01-10')
  }
];

let functionMappings = [
  {
    id: '1',
    powerCenterFunction: 'DECODE',
    iicsEquivalent: 'IIF',
    syntax: 'IIF(condition, true_value, false_value)',
    examples: [
      { pc: 'DECODE(STATUS, 1, "Active", 2, "Inactive", "Unknown")', iics: 'IIF(STATUS = 1, "Active", IIF(STATUS = 2, "Inactive", "Unknown"))' }
    ],
    complexity: 'MODIFIED',
    notes: 'PowerCenter DECODE requires conversion to nested IIF statements'
  },
  {
    id: '2',
    powerCenterFunction: 'SUBSTR',
    iicsEquivalent: 'SUBSTRING',
    syntax: 'SUBSTRING(string, start_position, length)',
    examples: [
      { pc: 'SUBSTR(NAME, 1, 5)', iics: 'SUBSTRING(NAME, 1, 5)' }
    ],
    complexity: 'DIRECT',
    notes: 'Direct mapping with same functionality'
  },
  {
    id: '3',
    powerCenterFunction: 'INSTR',
    iicsEquivalent: 'CHARINDEX',
    syntax: 'CHARINDEX(search_string, source_string)',
    examples: [
      { pc: 'INSTR(EMAIL, "@")', iics: 'CHARINDEX("@", EMAIL)' }
    ],
    complexity: 'MODIFIED',
    notes: 'Parameter order is reversed in IICS'
  }
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(data);
  });
}

function handleAPI(req, res, pathname, method) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Dashboard stats
  if (pathname === '/api/dashboard/stats' && method === 'GET') {
    const stats = {
      totalProjects: projects.length,
      activeConnections: connections.filter(c => c.isActive).length,
      totalConnections: connections.length,
      projectsByStatus: {
        DISCOVERY: projects.filter(p => p.status === 'DISCOVERY').length,
        ASSESSMENT: projects.filter(p => p.status === 'ASSESSMENT').length,
        MIGRATION: projects.filter(p => p.status === 'MIGRATION').length,
        COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
      },
      avgAutomationCoverage: projects.length > 0 
        ? Math.round(projects.reduce((sum, p) => sum + (p.autoMigrationPercentage || 0), 0) / projects.length)
        : 0,
    };
    res.writeHead(200);
    res.end(JSON.stringify(stats));
    return;
  }

  // Projects
  if (pathname === '/api/migration-projects' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(projects));
    return;
  }

  if (pathname === '/api/migration-projects' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const project = {
        ...data,
        id: generateId(),
        status: 'DISCOVERY',
        autoMigrationPercentage: 0,
        totalObjects: 0,
        migratedObjects: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      projects.push(project);
      res.writeHead(201);
      res.end(JSON.stringify(project));
    });
    return;
  }

  // Repository connections
  if (pathname === '/api/repository-connections' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(connections));
    return;
  }

  if (pathname === '/api/repository-connections' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const connection = {
        ...data,
        id: generateId(),
        isActive: false,
        lastConnected: null,
        createdAt: new Date(),
      };
      connections.push(connection);
      res.writeHead(201);
      res.end(JSON.stringify(connection));
    });
    return;
  }

  // Function mappings
  if (pathname === '/api/function-mappings' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(functionMappings));
    return;
  }

  // Connection test
  if (pathname.match(/\/api\/repository-connections\/[^\/]+\/test/) && method === 'POST') {
    const connectionId = pathname.split('/')[3];
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Connection not found' }));
      return;
    }
    
    const connected = Math.random() > 0.2; // 80% success rate
    if (connected) {
      connection.isActive = true;
      connection.lastConnected = new Date();
    }
    
    res.writeHead(200);
    res.end(JSON.stringify({ connected }));
    return;
  }

  // Discovery endpoint
  if (pathname.match(/\/api\/migration-projects\/[^\/]+\/discover/) && method === 'POST') {
    const projectId = pathname.split('/')[3];
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Project not found' }));
      return;
    }

    project.status = 'ASSESSMENT';
    project.totalObjects = 25;
    project.autoMigrationPercentage = 85;
    project.updatedAt = new Date();

    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Discovery completed successfully',
      totalObjects: 25,
      autoMigrationPercentage: 85,
      objectTypes: {
        workflows: 5,
        mappings: 8,
        sessions: 5,
        transformations: 4,
        sources: 2,
        targets: 1,
      },
    }));
    return;
  }

  // 404 for unknown API endpoints
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'API endpoint not found' }));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle API requests
  if (pathname.startsWith('/api/')) {
    handleAPI(req, res, pathname, method);
    return;
  }

  // Serve static files
  let filePath = './client' + pathname;
  
  // Default to index.html for SPA routing
  if (pathname === '/' || !path.extname(pathname)) {
    filePath = './client/index.html';
  }

  serveFile(res, filePath);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Informatica Migration Tool running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${PORT}`);
  console.log(`🔌 API: http://0.0.0.0:${PORT}/api`);
  console.log(`📡 Real-time sync enabled`);
});