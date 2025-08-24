import express from 'express';
import { IStorage } from './storage.js';
import { PowerCenterService } from './powercenter-service.js';
import { 
  insertRepositoryConnectionSchema,
  insertMigrationProjectSchema,
  insertPowerCenterObjectSchema,
  insertAssessmentResultSchema,
  insertMigrationIssueSchema
} from '../shared/schema.js';

export function createRoutes(storage: IStorage) {
  const router = express.Router();
  const powerCenterService = new PowerCenterService();

  // Repository Connections
  router.get('/api/repository-connections', async (req, res) => {
    try {
      const connections = await storage.getRepositoryConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/api/repository-connections', async (req, res) => {
    try {
      const validatedData = insertRepositoryConnectionSchema.parse(req.body);
      const connection = await storage.createRepositoryConnection(validatedData);
      res.status(201).json(connection);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/api/repository-connections/:id', async (req, res) => {
    try {
      const connection = await storage.getRepositoryConnection(req.params.id);
      if (!connection) {
        return res.status(404).json({ error: 'Repository connection not found' });
      }
      res.json(connection);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/api/repository-connections/:id', async (req, res) => {
    try {
      const connection = await storage.updateRepositoryConnection(req.params.id, req.body);
      res.json(connection);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/api/repository-connections/:id', async (req, res) => {
    try {
      await storage.deleteRepositoryConnection(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test Repository Connection
  router.post('/api/repository-connections/:id/test', async (req, res) => {
    try {
      const connection = await storage.getRepositoryConnection(req.params.id);
      if (!connection) {
        return res.status(404).json({ error: 'Repository connection not found' });
      }

      let isConnected = false;
      if (connection.connectionType === 'REST_API') {
        isConnected = await powerCenterService.testRestConnection(connection);
      } else if (connection.connectionType === 'PMREP') {
        isConnected = await powerCenterService.testPmrepConnection(connection);
      }

      if (isConnected) {
        await storage.updateRepositoryConnection(connection.id, {
          isActive: true,
          lastConnected: new Date(),
        });
      }

      res.json({ connected: isConnected });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Migration Projects
  router.get('/api/migration-projects', async (req, res) => {
    try {
      const projects = await storage.getMigrationProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/api/migration-projects', async (req, res) => {
    try {
      const validatedData = insertMigrationProjectSchema.parse(req.body);
      const project = await storage.createMigrationProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/api/migration-projects/:id', async (req, res) => {
    try {
      const project = await storage.getMigrationProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Migration project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/api/migration-projects/:id', async (req, res) => {
    try {
      const project = await storage.updateMigrationProject(req.params.id, req.body);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/api/migration-projects/:id', async (req, res) => {
    try {
      await storage.deleteMigrationProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start Discovery Process
  router.post('/api/migration-projects/:id/discover', async (req, res) => {
    try {
      const project = await storage.getMigrationProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Migration project not found' });
      }

      const connection = await storage.getRepositoryConnection(project.repositoryConnectionId);
      if (!connection) {
        return res.status(404).json({ error: 'Repository connection not found' });
      }

      // Update project status to discovery
      await storage.updateMigrationProject(project.id, { status: 'DISCOVERY' });

      // Start discovery process
      let discoveryResult;
      if (connection.connectionType === 'REST_API') {
        discoveryResult = await powerCenterService.discoverRepositoryViaRest(connection);
      } else {
        discoveryResult = await powerCenterService.discoverRepositoryViaPmrep(connection);
      }

      // Convert discovery results to PowerCenter objects
      const allObjects = [
        ...discoveryResult.workflows.map(wf => ({
          projectId: project.id,
          objectName: wf.name,
          objectType: 'WORKFLOW' as const,
          folderName: wf.folder,
          complexity: wf.complexity,
          migrationStatus: 'FULLY_AUTO' as const,
          automationCoverage: 85,
          dependencies: wf.dependencies,
          metadata: wf.metadata,
        })),
        ...discoveryResult.mappings.map(mapping => ({
          projectId: project.id,
          objectName: mapping.name,
          objectType: 'MAPPING' as const,
          folderName: mapping.folder,
          complexity: mapping.complexity,
          migrationStatus: 'FULLY_AUTO' as const,
          automationCoverage: 90,
          dependencies: [],
          metadata: mapping.metadata,
        })),
        ...discoveryResult.sessions.map(session => ({
          projectId: project.id,
          objectName: session.name,
          objectType: 'SESSION' as const,
          folderName: session.folder,
          complexity: 'SIMPLE' as const,
          migrationStatus: 'FULLY_AUTO' as const,
          automationCoverage: 95,
          dependencies: [],
          metadata: session.metadata,
        })),
        ...discoveryResult.transformations.map(trans => ({
          projectId: project.id,
          objectName: trans.name,
          objectType: 'TRANSFORMATION' as const,
          folderName: trans.folder,
          complexity: 'MEDIUM' as const,
          migrationStatus: trans.type === 'XML_PARSER' ? 'MANUAL_REDESIGN' as const : 'PARTIAL' as const,
          automationCoverage: trans.type === 'XML_PARSER' ? 20 : 75,
          dependencies: [],
          metadata: trans.metadata,
        })),
        ...discoveryResult.sources.map(source => ({
          projectId: project.id,
          objectName: source.name,
          objectType: 'SOURCE' as const,
          folderName: source.folder,
          complexity: 'SIMPLE' as const,
          migrationStatus: 'FULLY_AUTO' as const,
          automationCoverage: 95,
          dependencies: [],
          metadata: source.metadata,
        })),
        ...discoveryResult.targets.map(target => ({
          projectId: project.id,
          objectName: target.name,
          objectType: 'TARGET' as const,
          folderName: target.folder,
          complexity: 'SIMPLE' as const,
          migrationStatus: 'FULLY_AUTO' as const,
          automationCoverage: 95,
          dependencies: [],
          metadata: target.metadata,
        })),
      ];

      // Bulk create objects
      await storage.bulkCreatePowerCenterObjects(allObjects);

      // Update project statistics
      const totalObjects = allObjects.length;
      const autoMigrationPercentage = Math.round(
        (allObjects.filter(obj => obj.migrationStatus === 'FULLY_AUTO').length / totalObjects) * 100
      );

      await storage.updateMigrationProject(project.id, {
        status: 'ASSESSMENT',
        totalObjects,
        autoMigrationPercentage,
      });

      // Update sync status
      await storage.updateSyncStatus(project.id, {
        syncType: 'FULL',
        status: 'COMPLETED',
        itemsProcessed: totalObjects,
      });

      res.json({
        message: 'Discovery completed successfully',
        totalObjects,
        autoMigrationPercentage,
        objectTypes: {
          workflows: discoveryResult.workflows.length,
          mappings: discoveryResult.mappings.length,
          sessions: discoveryResult.sessions.length,
          transformations: discoveryResult.transformations.length,
          sources: discoveryResult.sources.length,
          targets: discoveryResult.targets.length,
        },
      });
    } catch (error) {
      console.error('Discovery failed:', error);
      await storage.updateMigrationProject(req.params.id, { status: 'DISCOVERY' });
      res.status(500).json({ error: error.message });
    }
  });

  // PowerCenter Objects
  router.get('/api/migration-projects/:id/objects', async (req, res) => {
    try {
      const objects = await storage.getPowerCenterObjects(req.params.id);
      res.json(objects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/api/powercenter-objects', async (req, res) => {
    try {
      const validatedData = insertPowerCenterObjectSchema.parse(req.body);
      const object = await storage.createPowerCenterObject(validatedData);
      res.status(201).json(object);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Assessment Results
  router.get('/api/migration-projects/:id/assessment', async (req, res) => {
    try {
      const results = await storage.getAssessmentResults(req.params.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/api/assessment-results', async (req, res) => {
    try {
      const validatedData = insertAssessmentResultSchema.parse(req.body);
      const result = await storage.createAssessmentResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Run Assessment
  router.post('/api/migration-projects/:id/assess', async (req, res) => {
    try {
      const objects = await storage.getPowerCenterObjects(req.params.id);
      const assessment = await powerCenterService.assessMigrationComplexity(objects);
      
      const assessmentResult = await storage.createAssessmentResult({
        projectId: req.params.id,
        objectId: 'project-level',
        assessmentType: 'COMPLEXITY',
        result: assessment.complexity,
        confidence: 85,
        recommendations: assessment.issues,
        issues: { automationCoverage: assessment.automationCoverage },
        estimatedEffort: Math.ceil(objects.length * 2), // 2 hours per object estimate
      });

      res.json(assessmentResult);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Migration Issues
  router.get('/api/migration-projects/:id/issues', async (req, res) => {
    try {
      const issues = await storage.getMigrationIssues(req.params.id);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/api/migration-issues', async (req, res) => {
    try {
      const validatedData = insertMigrationIssueSchema.parse(req.body);
      const issue = await storage.createMigrationIssue(validatedData);
      res.status(201).json(issue);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/api/migration-issues/:id', async (req, res) => {
    try {
      const issue = await storage.updateMigrationIssue(req.params.id, req.body);
      res.json(issue);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Function Mappings
  router.get('/api/function-mappings', async (req, res) => {
    try {
      const mappings = await storage.getFunctionMappings();
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/function-mappings/:function', async (req, res) => {
    try {
      const mapping = await storage.getFunctionMapping(req.params.function);
      if (!mapping) {
        return res.status(404).json({ error: 'Function mapping not found' });
      }
      res.json(mapping);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync Status
  router.get('/api/migration-projects/:id/sync-status', async (req, res) => {
    try {
      const status = await storage.getSyncStatus(req.params.id);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start Real-time Sync
  router.post('/api/migration-projects/:id/start-sync', async (req, res) => {
    try {
      const project = await storage.getMigrationProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Migration project not found' });
      }

      const connection = await storage.getRepositoryConnection(project.repositoryConnectionId);
      if (!connection) {
        return res.status(404).json({ error: 'Repository connection not found' });
      }

      // Start real-time sync
      await powerCenterService.startRealTimeSync(connection, project.id, async (update) => {
        // Update sync status
        await storage.updateSyncStatus(project.id, {
          lastSyncTime: new Date(),
          status: update.error ? 'FAILED' : 'COMPLETED',
          errors: update.error ? [update.error] : null,
        });
      });

      await storage.updateSyncStatus(project.id, {
        syncType: 'INCREMENTAL',
        status: 'SYNCING',
        itemsProcessed: 0,
      });

      res.json({ message: 'Real-time sync started successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard Statistics
  router.get('/api/dashboard/stats', async (req, res) => {
    try {
      const projects = await storage.getMigrationProjects();
      const connections = await storage.getRepositoryConnections();
      
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
          ? Math.round(projects.reduce((sum, p) => sum + p.autoMigrationPercentage, 0) / projects.length)
          : 0,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}