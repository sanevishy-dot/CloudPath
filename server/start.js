const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../client')));

// Simple in-memory storage for demo
let projects = [];
let connections = [];
let objects = [];
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
  }
];

// Generate ID helper
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// API Routes
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
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
  });
});

app.get('/api/migration-projects', (req, res) => {
  res.json(projects);
});

app.post('/api/migration-projects', (req, res) => {
  const project = {
    ...req.body,
    id: generateId(),
    status: 'DISCOVERY',
    autoMigrationPercentage: 0,
    totalObjects: 0,
    migratedObjects: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  projects.push(project);
  res.status(201).json(project);
});

app.get('/api/migration-projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

app.get('/api/repository-connections', (req, res) => {
  res.json(connections);
});

app.post('/api/repository-connections', (req, res) => {
  const connection = {
    ...req.body,
    id: generateId(),
    isActive: false,
    lastConnected: null,
    createdAt: new Date(),
  };
  connections.push(connection);
  res.status(201).json(connection);
});

app.post('/api/repository-connections/:id/test', (req, res) => {
  const connection = connections.find(c => c.id === req.params.id);
  if (!connection) {
    return res.status(404).json({ error: 'Connection not found' });
  }
  
  // Simulate connection test
  const connected = Math.random() > 0.3; // 70% success rate
  if (connected) {
    connection.isActive = true;
    connection.lastConnected = new Date();
  }
  
  res.json({ connected });
});

app.get('/api/function-mappings', (req, res) => {
  res.json(functionMappings);
});

app.post('/api/migration-projects/:id/discover', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Simulate discovery
  const sampleObjects = [
    { objectName: 'WF_Customer_Load', objectType: 'WORKFLOW', folderName: 'ETL_Workflows', complexity: 'MEDIUM', migrationStatus: 'FULLY_AUTO', automationCoverage: 85 },
    { objectName: 'M_Customer_Transform', objectType: 'MAPPING', folderName: 'Mappings', complexity: 'SIMPLE', migrationStatus: 'FULLY_AUTO', automationCoverage: 95 },
    { objectName: 'S_Customer_Session', objectType: 'SESSION', folderName: 'Sessions', complexity: 'SIMPLE', migrationStatus: 'FULLY_AUTO', automationCoverage: 90 },
  ];

  project.status = 'ASSESSMENT';
  project.totalObjects = sampleObjects.length;
  project.autoMigrationPercentage = 90;
  project.updatedAt = new Date();

  res.json({
    message: 'Discovery completed successfully',
    totalObjects: sampleObjects.length,
    autoMigrationPercentage: 90,
    objectTypes: {
      workflows: 1,
      mappings: 1,
      sessions: 1,
      transformations: 0,
      sources: 0,
      targets: 0,
    },
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Informatica Migration Tool running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${PORT}`);
  console.log(`🔌 API: http://0.0.0.0:${PORT}/api`);
});