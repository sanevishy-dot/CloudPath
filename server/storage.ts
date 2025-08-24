import { 
  RepositoryConnection, 
  InsertRepositoryConnection,
  MigrationProject,
  InsertMigrationProject,
  PowerCenterObject,
  InsertPowerCenterObject,
  AssessmentResult,
  InsertAssessmentResult,
  MigrationIssue,
  InsertMigrationIssue,
  FunctionMapping,
  SyncStatus
} from '../shared/schema.js';

export interface IStorage {
  // Repository Connections
  createRepositoryConnection(connection: InsertRepositoryConnection): Promise<RepositoryConnection>;
  getRepositoryConnections(): Promise<RepositoryConnection[]>;
  getRepositoryConnection(id: string): Promise<RepositoryConnection | null>;
  updateRepositoryConnection(id: string, updates: Partial<RepositoryConnection>): Promise<RepositoryConnection>;
  deleteRepositoryConnection(id: string): Promise<void>;
  testRepositoryConnection(id: string): Promise<boolean>;

  // Migration Projects
  createMigrationProject(project: InsertMigrationProject): Promise<MigrationProject>;
  getMigrationProjects(): Promise<MigrationProject[]>;
  getMigrationProject(id: string): Promise<MigrationProject | null>;
  updateMigrationProject(id: string, updates: Partial<MigrationProject>): Promise<MigrationProject>;
  deleteMigrationProject(id: string): Promise<void>;

  // PowerCenter Objects
  createPowerCenterObject(object: InsertPowerCenterObject): Promise<PowerCenterObject>;
  getPowerCenterObjects(projectId: string): Promise<PowerCenterObject[]>;
  getPowerCenterObject(id: string): Promise<PowerCenterObject | null>;
  updatePowerCenterObject(id: string, updates: Partial<PowerCenterObject>): Promise<PowerCenterObject>;
  deletePowerCenterObject(id: string): Promise<void>;
  bulkCreatePowerCenterObjects(objects: InsertPowerCenterObject[]): Promise<PowerCenterObject[]>;

  // Assessment Results
  createAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult>;
  getAssessmentResults(projectId: string): Promise<AssessmentResult[]>;
  getAssessmentResult(id: string): Promise<AssessmentResult | null>;

  // Migration Issues
  createMigrationIssue(issue: InsertMigrationIssue): Promise<MigrationIssue>;
  getMigrationIssues(projectId: string): Promise<MigrationIssue[]>;
  updateMigrationIssue(id: string, updates: Partial<MigrationIssue>): Promise<MigrationIssue>;

  // Function Mappings
  getFunctionMappings(): Promise<FunctionMapping[]>;
  getFunctionMapping(powerCenterFunction: string): Promise<FunctionMapping | null>;

  // Sync Status
  updateSyncStatus(projectId: string, status: Partial<SyncStatus>): Promise<SyncStatus>;
  getSyncStatus(projectId: string): Promise<SyncStatus | null>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private repositoryConnections: Map<string, RepositoryConnection> = new Map();
  private migrationProjects: Map<string, MigrationProject> = new Map();
  private powerCenterObjects: Map<string, PowerCenterObject> = new Map();
  private assessmentResults: Map<string, AssessmentResult> = new Map();
  private migrationIssues: Map<string, MigrationIssue> = new Map();
  private functionMappings: Map<string, FunctionMapping> = new Map();
  private syncStatuses: Map<string, SyncStatus> = new Map();

  constructor() {
    this.initializeFunctionMappings();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeFunctionMappings(): void {
    const mappings: FunctionMapping[] = [
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

    mappings.forEach(mapping => {
      this.functionMappings.set(mapping.powerCenterFunction, mapping);
    });
  }

  // Repository Connections
  async createRepositoryConnection(connection: InsertRepositoryConnection): Promise<RepositoryConnection> {
    const id = this.generateId();
    const newConnection: RepositoryConnection = {
      ...connection,
      id,
      isActive: false,
      lastConnected: null,
      createdAt: new Date(),
    };
    this.repositoryConnections.set(id, newConnection);
    return newConnection;
  }

  async getRepositoryConnections(): Promise<RepositoryConnection[]> {
    return Array.from(this.repositoryConnections.values());
  }

  async getRepositoryConnection(id: string): Promise<RepositoryConnection | null> {
    return this.repositoryConnections.get(id) || null;
  }

  async updateRepositoryConnection(id: string, updates: Partial<RepositoryConnection>): Promise<RepositoryConnection> {
    const existing = this.repositoryConnections.get(id);
    if (!existing) throw new Error('Repository connection not found');
    
    const updated = { ...existing, ...updates };
    this.repositoryConnections.set(id, updated);
    return updated;
  }

  async deleteRepositoryConnection(id: string): Promise<void> {
    this.repositoryConnections.delete(id);
  }

  async testRepositoryConnection(id: string): Promise<boolean> {
    const connection = this.repositoryConnections.get(id);
    if (!connection) return false;
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Math.random() > 0.2; // 80% success rate for demo
  }

  // Migration Projects
  async createMigrationProject(project: InsertMigrationProject): Promise<MigrationProject> {
    const id = this.generateId();
    const newProject: MigrationProject = {
      ...project,
      id,
      status: 'DISCOVERY',
      autoMigrationPercentage: 0,
      totalObjects: 0,
      migratedObjects: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.migrationProjects.set(id, newProject);
    return newProject;
  }

  async getMigrationProjects(): Promise<MigrationProject[]> {
    return Array.from(this.migrationProjects.values());
  }

  async getMigrationProject(id: string): Promise<MigrationProject | null> {
    return this.migrationProjects.get(id) || null;
  }

  async updateMigrationProject(id: string, updates: Partial<MigrationProject>): Promise<MigrationProject> {
    const existing = this.migrationProjects.get(id);
    if (!existing) throw new Error('Migration project not found');
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.migrationProjects.set(id, updated);
    return updated;
  }

  async deleteMigrationProject(id: string): Promise<void> {
    this.migrationProjects.delete(id);
  }

  // PowerCenter Objects
  async createPowerCenterObject(object: InsertPowerCenterObject): Promise<PowerCenterObject> {
    const id = this.generateId();
    const newObject: PowerCenterObject = {
      ...object,
      id,
      lastScanned: new Date(),
    };
    this.powerCenterObjects.set(id, newObject);
    return newObject;
  }

  async getPowerCenterObjects(projectId: string): Promise<PowerCenterObject[]> {
    return Array.from(this.powerCenterObjects.values()).filter(obj => obj.projectId === projectId);
  }

  async getPowerCenterObject(id: string): Promise<PowerCenterObject | null> {
    return this.powerCenterObjects.get(id) || null;
  }

  async updatePowerCenterObject(id: string, updates: Partial<PowerCenterObject>): Promise<PowerCenterObject> {
    const existing = this.powerCenterObjects.get(id);
    if (!existing) throw new Error('PowerCenter object not found');
    
    const updated = { ...existing, ...updates };
    this.powerCenterObjects.set(id, updated);
    return updated;
  }

  async deletePowerCenterObject(id: string): Promise<void> {
    this.powerCenterObjects.delete(id);
  }

  async bulkCreatePowerCenterObjects(objects: InsertPowerCenterObject[]): Promise<PowerCenterObject[]> {
    const results: PowerCenterObject[] = [];
    for (const object of objects) {
      const result = await this.createPowerCenterObject(object);
      results.push(result);
    }
    return results;
  }

  // Assessment Results
  async createAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult> {
    const id = this.generateId();
    const newResult: AssessmentResult = {
      ...result,
      id,
      createdAt: new Date(),
    };
    this.assessmentResults.set(id, newResult);
    return newResult;
  }

  async getAssessmentResults(projectId: string): Promise<AssessmentResult[]> {
    return Array.from(this.assessmentResults.values()).filter(result => result.projectId === projectId);
  }

  async getAssessmentResult(id: string): Promise<AssessmentResult | null> {
    return this.assessmentResults.get(id) || null;
  }

  // Migration Issues
  async createMigrationIssue(issue: InsertMigrationIssue): Promise<MigrationIssue> {
    const id = this.generateId();
    const newIssue: MigrationIssue = {
      ...issue,
      id,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.migrationIssues.set(id, newIssue);
    return newIssue;
  }

  async getMigrationIssues(projectId: string): Promise<MigrationIssue[]> {
    return Array.from(this.migrationIssues.values()).filter(issue => issue.projectId === projectId);
  }

  async updateMigrationIssue(id: string, updates: Partial<MigrationIssue>): Promise<MigrationIssue> {
    const existing = this.migrationIssues.get(id);
    if (!existing) throw new Error('Migration issue not found');
    
    const updated = { ...existing, ...updates };
    if (updates.status === 'FIXED' && !updated.resolvedAt) {
      updated.resolvedAt = new Date();
    }
    this.migrationIssues.set(id, updated);
    return updated;
  }

  // Function Mappings
  async getFunctionMappings(): Promise<FunctionMapping[]> {
    return Array.from(this.functionMappings.values());
  }

  async getFunctionMapping(powerCenterFunction: string): Promise<FunctionMapping | null> {
    return this.functionMappings.get(powerCenterFunction) || null;
  }

  // Sync Status
  async updateSyncStatus(projectId: string, status: Partial<SyncStatus>): Promise<SyncStatus> {
    const existing = this.syncStatuses.get(projectId);
    const updated: SyncStatus = {
      id: existing?.id || this.generateId(),
      projectId,
      lastSyncTime: new Date(),
      syncType: 'INCREMENTAL',
      status: 'COMPLETED',
      itemsProcessed: 0,
      errors: null,
      ...existing,
      ...status,
    };
    this.syncStatuses.set(projectId, updated);
    return updated;
  }

  async getSyncStatus(projectId: string): Promise<SyncStatus | null> {
    return this.syncStatuses.get(projectId) || null;
  }
}