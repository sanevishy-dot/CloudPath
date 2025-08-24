import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import xml2js from 'xml2js';
import { RepositoryConnection } from '../shared/schema.js';

const execAsync = promisify(exec);

export interface PowerCenterDiscoveryResult {
  workflows: PowerCenterWorkflow[];
  mappings: PowerCenterMapping[];
  sessions: PowerCenterSession[];
  transformations: PowerCenterTransformation[];
  sources: PowerCenterSource[];
  targets: PowerCenterTarget[];
}

export interface PowerCenterWorkflow {
  name: string;
  folder: string;
  isValid: boolean;
  sessions: string[];
  dependencies: string[];
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  metadata: any;
}

export interface PowerCenterMapping {
  name: string;
  folder: string;
  transformations: string[];
  sources: string[];
  targets: string[];
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  metadata: any;
}

export interface PowerCenterSession {
  name: string;
  folder: string;
  mappingName: string;
  sessionType: string;
  metadata: any;
}

export interface PowerCenterTransformation {
  name: string;
  folder: string;
  type: string;
  mappingName: string;
  expressions: string[];
  metadata: any;
}

export interface PowerCenterSource {
  name: string;
  folder: string;
  type: string;
  connectionName: string;
  metadata: any;
}

export interface PowerCenterTarget {
  name: string;
  folder: string;
  type: string;
  connectionName: string;
  metadata: any;
}

export class PowerCenterService {
  private parser = new xml2js.Parser({ explicitArray: false });

  constructor() {}

  // REST API Integration
  async testRestConnection(connection: RepositoryConnection): Promise<boolean> {
    try {
      const baseUrl = `http://${connection.hostname}:${connection.port}`;
      const response = await fetch(`${baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.ok;
    } catch (error) {
      console.error('REST API connection test failed:', error);
      return false;
    }
  }

  async discoverRepositoryViaRest(connection: RepositoryConnection): Promise<PowerCenterDiscoveryResult> {
    try {
      const baseUrl = `http://${connection.hostname}:${connection.port}`;
      const authToken = await this.authenticateRest(connection);
      
      // Discover objects via REST API
      const [workflows, mappings, sessions, transformations, sources, targets] = await Promise.all([
        this.getWorkflowsViaRest(baseUrl, authToken),
        this.getMappingsViaRest(baseUrl, authToken),
        this.getSessionsViaRest(baseUrl, authToken),
        this.getTransformationsViaRest(baseUrl, authToken),
        this.getSourcesViaRest(baseUrl, authToken),
        this.getTargetsViaRest(baseUrl, authToken),
      ]);

      return {
        workflows,
        mappings,
        sessions,
        transformations,
        sources,
        targets,
      };
    } catch (error) {
      console.error('REST API discovery failed:', error);
      throw new Error(`REST API discovery failed: ${error.message}`);
    }
  }

  private async authenticateRest(connection: RepositoryConnection): Promise<string> {
    const baseUrl = `http://${connection.hostname}:${connection.port}`;
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: connection.username,
        repositoryName: connection.repositoryName,
      }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const result = await response.json();
    return result.token;
  }

  private async getWorkflowsViaRest(baseUrl: string, token: string): Promise<PowerCenterWorkflow[]> {
    const response = await fetch(`${baseUrl}/api/v1/workflows`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.workflows?.map((wf: any) => ({
      name: wf.name,
      folder: wf.folder,
      isValid: wf.isValid,
      sessions: wf.sessions || [],
      dependencies: wf.dependencies || [],
      complexity: this.calculateComplexity(wf),
      metadata: wf,
    })) || [];
  }

  private async getMappingsViaRest(baseUrl: string, token: string): Promise<PowerCenterMapping[]> {
    const response = await fetch(`${baseUrl}/api/v1/mappings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.mappings?.map((mapping: any) => ({
      name: mapping.name,
      folder: mapping.folder,
      transformations: mapping.transformations || [],
      sources: mapping.sources || [],
      targets: mapping.targets || [],
      complexity: this.calculateComplexity(mapping),
      metadata: mapping,
    })) || [];
  }

  private async getSessionsViaRest(baseUrl: string, token: string): Promise<PowerCenterSession[]> {
    const response = await fetch(`${baseUrl}/api/v1/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.sessions?.map((session: any) => ({
      name: session.name,
      folder: session.folder,
      mappingName: session.mappingName,
      sessionType: session.sessionType,
      metadata: session,
    })) || [];
  }

  private async getTransformationsViaRest(baseUrl: string, token: string): Promise<PowerCenterTransformation[]> {
    const response = await fetch(`${baseUrl}/api/v1/transformations`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.transformations?.map((trans: any) => ({
      name: trans.name,
      folder: trans.folder,
      type: trans.type,
      mappingName: trans.mappingName,
      expressions: trans.expressions || [],
      metadata: trans,
    })) || [];
  }

  private async getSourcesViaRest(baseUrl: string, token: string): Promise<PowerCenterSource[]> {
    const response = await fetch(`${baseUrl}/api/v1/sources`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.sources?.map((source: any) => ({
      name: source.name,
      folder: source.folder,
      type: source.type,
      connectionName: source.connectionName,
      metadata: source,
    })) || [];
  }

  private async getTargetsViaRest(baseUrl: string, token: string): Promise<PowerCenterTarget[]> {
    const response = await fetch(`${baseUrl}/api/v1/targets`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.targets?.map((target: any) => ({
      name: target.name,
      folder: target.folder,
      type: target.type,
      connectionName: target.connectionName,
      metadata: target,
    })) || [];
  }

  // pmrep Command Line Integration
  async testPmrepConnection(connection: RepositoryConnection): Promise<boolean> {
    try {
      const command = `pmrep connect -r ${connection.repositoryName} -h ${connection.hostname} -o ${connection.port} -n ${connection.username}`;
      await execAsync(command, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error('pmrep connection test failed:', error);
      return false;
    }
  }

  async discoverRepositoryViaPmrep(connection: RepositoryConnection): Promise<PowerCenterDiscoveryResult> {
    try {
      // Connect to repository
      await this.connectPmrep(connection);

      // Discover objects via pmrep commands
      const [workflows, mappings, sessions, transformations, sources, targets] = await Promise.all([
        this.getWorkflowsViaPmrep(connection),
        this.getMappingsViaPmrep(connection),
        this.getSessionsViaPmrep(connection),
        this.getTransformationsViaPmrep(connection),
        this.getSourcesViaPmrep(connection),
        this.getTargetsViaPmrep(connection),
      ]);

      return {
        workflows,
        mappings,
        sessions,
        transformations,
        sources,
        targets,
      };
    } catch (error) {
      console.error('pmrep discovery failed:', error);
      throw new Error(`pmrep discovery failed: ${error.message}`);
    }
  }

  private async connectPmrep(connection: RepositoryConnection): Promise<void> {
    const command = `pmrep connect -r ${connection.repositoryName} -h ${connection.hostname} -o ${connection.port} -n ${connection.username}`;
    await execAsync(command);
  }

  private async getWorkflowsViaPmrep(connection: RepositoryConnection): Promise<PowerCenterWorkflow[]> {
    try {
      const command = `pmrep listobjects -o workflow -t all`;
      const { stdout } = await execAsync(command);
      
      // Parse pmrep output and convert to structured data
      const workflows = this.parsePmrepWorkflowOutput(stdout);
      return workflows;
    } catch (error) {
      console.error('Failed to get workflows via pmrep:', error);
      return [];
    }
  }

  private async getMappingsViaPmrep(connection: RepositoryConnection): Promise<PowerCenterMapping[]> {
    try {
      const command = `pmrep listobjects -o mapping -t all`;
      const { stdout } = await execAsync(command);
      
      const mappings = this.parsePmrepMappingOutput(stdout);
      return mappings;
    } catch (error) {
      console.error('Failed to get mappings via pmrep:', error);
      return [];
    }
  }

  private async getSessionsViaPmrep(connection: RepositoryConnection): Promise<PowerCenterSession[]> {
    try {
      const command = `pmrep listobjects -o session -t all`;
      const { stdout } = await execAsync(command);
      
      const sessions = this.parsePmrepSessionOutput(stdout);
      return sessions;
    } catch (error) {
      console.error('Failed to get sessions via pmrep:', error);
      return [];
    }
  }

  private async getTransformationsViaPmrep(connection: RepositoryConnection): Promise<PowerCenterTransformation[]> {
    try {
      const command = `pmrep listobjects -o transformation -t all`;
      const { stdout } = await execAsync(command);
      
      const transformations = this.parsePmrepTransformationOutput(stdout);
      return transformations;
    } catch (error) {
      console.error('Failed to get transformations via pmrep:', error);
      return [];
    }
  }

  private async getSourcesViaPmrep(connection: RepositoryConnection): Promise<PowerCenterSource[]> {
    try {
      const command = `pmrep listobjects -o source -t all`;
      const { stdout } = await execAsync(command);
      
      const sources = this.parsePmrepSourceOutput(stdout);
      return sources;
    } catch (error) {
      console.error('Failed to get sources via pmrep:', error);
      return [];
    }
  }

  private async getTargetsViaPmrep(connection: RepositoryConnection): Promise<PowerCenterTarget[]> {
    try {
      const command = `pmrep listobjects -o target -t all`;
      const { stdout } = await execAsync(command);
      
      const targets = this.parsePmrepTargetOutput(stdout);
      return targets;
    } catch (error) {
      console.error('Failed to get targets via pmrep:', error);
      return [];
    }
  }

  // Utility methods for parsing pmrep output
  private parsePmrepWorkflowOutput(output: string): PowerCenterWorkflow[] {
    const lines = output.split('\n').filter(line => line.trim());
    const workflows: PowerCenterWorkflow[] = [];

    for (const line of lines) {
      if (line.includes('workflow')) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          workflows.push({
            name: parts[0].trim(),
            folder: parts[1].trim(),
            isValid: parts[2]?.trim() === 'valid',
            sessions: [],
            dependencies: [],
            complexity: 'MEDIUM',
            metadata: { rawOutput: line },
          });
        }
      }
    }

    return workflows;
  }

  private parsePmrepMappingOutput(output: string): PowerCenterMapping[] {
    const lines = output.split('\n').filter(line => line.trim());
    const mappings: PowerCenterMapping[] = [];

    for (const line of lines) {
      if (line.includes('mapping')) {
        const parts = line.split('\t');
        if (parts.length >= 2) {
          mappings.push({
            name: parts[0].trim(),
            folder: parts[1].trim(),
            transformations: [],
            sources: [],
            targets: [],
            complexity: 'MEDIUM',
            metadata: { rawOutput: line },
          });
        }
      }
    }

    return mappings;
  }

  private parsePmrepSessionOutput(output: string): PowerCenterSession[] {
    const lines = output.split('\n').filter(line => line.trim());
    const sessions: PowerCenterSession[] = [];

    for (const line of lines) {
      if (line.includes('session')) {
        const parts = line.split('\t');
        if (parts.length >= 2) {
          sessions.push({
            name: parts[0].trim(),
            folder: parts[1].trim(),
            mappingName: parts[2]?.trim() || '',
            sessionType: 'session',
            metadata: { rawOutput: line },
          });
        }
      }
    }

    return sessions;
  }

  private parsePmrepTransformationOutput(output: string): PowerCenterTransformation[] {
    const lines = output.split('\n').filter(line => line.trim());
    const transformations: PowerCenterTransformation[] = [];

    for (const line of lines) {
      if (line.includes('transformation')) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          transformations.push({
            name: parts[0].trim(),
            folder: parts[1].trim(),
            type: parts[2]?.trim() || 'unknown',
            mappingName: parts[3]?.trim() || '',
            expressions: [],
            metadata: { rawOutput: line },
          });
        }
      }
    }

    return transformations;
  }

  private parsePmrepSourceOutput(output: string): PowerCenterSource[] {
    const lines = output.split('\n').filter(line => line.trim());
    const sources: PowerCenterSource[] = [];

    for (const line of lines) {
      if (line.includes('source')) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          sources.push({
            name: parts[0].trim(),
            folder: parts[1].trim(),
            type: parts[2]?.trim() || 'unknown',
            connectionName: parts[3]?.trim() || '',
            metadata: { rawOutput: line },
          });
        }
      }
    }

    return sources;
  }

  private parsePmrepTargetOutput(output: string): PowerCenterTarget[] {
    const lines = output.split('\n').filter(line => line.trim());
    const targets: PowerCenterTarget[] = [];

    for (const line of lines) {
      if (line.includes('target')) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          targets.push({
            name: parts[0].trim(),
            folder: parts[1].trim(),
            type: parts[2]?.trim() || 'unknown',
            connectionName: parts[3]?.trim() || '',
            metadata: { rawOutput: line },
          });
        }
      }
    }

    return targets;
  }

  private calculateComplexity(object: any): 'SIMPLE' | 'MEDIUM' | 'COMPLEX' {
    // Simple complexity calculation based on number of components
    const componentCount = (object.transformations?.length || 0) + 
                          (object.sessions?.length || 0) + 
                          (object.dependencies?.length || 0);
    
    if (componentCount === 0) return 'SIMPLE';
    if (componentCount <= 5) return 'MEDIUM';
    return 'COMPLEX';
  }

  // Assessment methods
  async assessMigrationComplexity(objects: any[]): Promise<{ complexity: string; automationCoverage: number; issues: string[] }> {
    const issues: string[] = [];
    let automationScore = 0;
    const totalObjects = objects.length;

    for (const object of objects) {
      // Check for unsupported transformations
      if (object.type === 'XML_PARSER') {
        issues.push(`Unsupported transformation: ${object.name} (XML Parser)`);
      } else if (object.type === 'MQSERIES') {
        issues.push(`Unsupported transformation: ${object.name} (MQSeries)`);
      } else {
        automationScore += 1;
      }

      // Check for complex expressions
      if (object.expressions?.some((expr: string) => expr.includes('DECODE'))) {
        issues.push(`Complex expression requiring manual conversion: ${object.name}`);
        automationScore -= 0.5;
      }
    }

    const automationCoverage = totalObjects > 0 ? Math.max(0, (automationScore / totalObjects) * 100) : 0;
    const complexity = automationCoverage > 80 ? 'SIMPLE' : automationCoverage > 50 ? 'MEDIUM' : 'COMPLEX';

    return { complexity, automationCoverage: Math.round(automationCoverage), issues };
  }

  // Real-time sync functionality
  async startRealTimeSync(connection: RepositoryConnection, projectId: string, onUpdate: (update: any) => void): Promise<void> {
    // Implement WebSocket or polling-based real-time sync
    const syncInterval = setInterval(async () => {
      try {
        const updates = await this.checkForUpdates(connection);
        if (updates.length > 0) {
          onUpdate({
            projectId,
            updates,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Real-time sync error:', error);
        onUpdate({
          projectId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000); // Check every 30 seconds

    // Store interval ID for cleanup
    setTimeout(() => clearInterval(syncInterval), 24 * 60 * 60 * 1000); // Stop after 24 hours
  }

  private async checkForUpdates(connection: RepositoryConnection): Promise<any[]> {
    // Implement change detection logic
    // This would compare current state with last known state
    return [];
  }
}