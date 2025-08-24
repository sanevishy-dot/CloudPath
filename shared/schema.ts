import { pgTable, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// PowerCenter Repository Connection
export const repositoryConnections = pgTable('repository_connections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hostname: text('hostname').notNull(),
  port: integer('port').notNull(),
  repositoryName: text('repository_name').notNull(),
  username: text('username').notNull(),
  isActive: boolean('is_active').default(false),
  lastConnected: timestamp('last_connected'),
  connectionType: text('connection_type').notNull(), // 'REST_API' | 'PMREP'
  apiVersion: text('api_version'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Migration Projects
export const migrationProjects = pgTable('migration_projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  repositoryConnectionId: text('repository_connection_id').notNull(),
  status: text('status').notNull(), // 'DISCOVERY' | 'ASSESSMENT' | 'MIGRATION' | 'COMPLETED'
  autoMigrationPercentage: integer('auto_migration_percentage').default(0),
  totalObjects: integer('total_objects').default(0),
  migratedObjects: integer('migrated_objects').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// PowerCenter Objects Discovery
export const powerCenterObjects = pgTable('powercenter_objects', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  objectName: text('object_name').notNull(),
  objectType: text('object_type').notNull(), // 'WORKFLOW' | 'MAPPING' | 'SESSION' | 'TRANSFORMATION' | 'SOURCE' | 'TARGET'
  folderName: text('folder_name').notNull(),
  complexity: text('complexity').notNull(), // 'SIMPLE' | 'MEDIUM' | 'COMPLEX'
  migrationStatus: text('migration_status').notNull(), // 'FULLY_AUTO' | 'PARTIAL' | 'MANUAL_REDESIGN'
  automationCoverage: integer('automation_coverage').default(0), // 0-100
  dependencies: text('dependencies').array(),
  metadata: jsonb('metadata'), // Store full object metadata
  lastScanned: timestamp('last_scanned').defaultNow(),
});

// Assessment Results
export const assessmentResults = pgTable('assessment_results', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  objectId: text('object_id').notNull(),
  assessmentType: text('assessment_type').notNull(), // 'COMPLEXITY' | 'COMPATIBILITY' | 'DEPENDENCY'
  result: text('result').notNull(),
  confidence: integer('confidence'), // 0-100
  recommendations: text('recommendations').array(),
  issues: jsonb('issues'),
  estimatedEffort: integer('estimated_effort'), // hours
  createdAt: timestamp('created_at').defaultNow(),
});

// Migration Issues & Fixes
export const migrationIssues = pgTable('migration_issues', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  objectId: text('object_id').notNull(),
  issueType: text('issue_type').notNull(), // 'UNSUPPORTED_FUNCTION' | 'MISSING_CONNECTION' | 'PARAMETER_MISMATCH'
  severity: text('severity').notNull(), // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: text('description').notNull(),
  suggestedFix: text('suggested_fix'),
  isAutoFixable: boolean('is_auto_fixable').default(false),
  status: text('status').notNull(), // 'OPEN' | 'FIXED' | 'IGNORED'
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// Function & Expression Mappings
export const functionMappings = pgTable('function_mappings', {
  id: text('id').primaryKey(),
  powerCenterFunction: text('powercenter_function').notNull(),
  iicsEquivalent: text('iics_equivalent').notNull(),
  syntax: text('syntax').notNull(),
  examples: jsonb('examples'),
  complexity: text('complexity').notNull(), // 'DIRECT' | 'MODIFIED' | 'COMPLEX'
  notes: text('notes'),
});

// Real-time Sync Status
export const syncStatus = pgTable('sync_status', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  lastSyncTime: timestamp('last_sync_time').defaultNow(),
  syncType: text('sync_type').notNull(), // 'FULL' | 'INCREMENTAL'
  status: text('status').notNull(), // 'SYNCING' | 'COMPLETED' | 'FAILED'
  itemsProcessed: integer('items_processed').default(0),
  errors: jsonb('errors'),
});

// Create insert schemas with validation
export const insertRepositoryConnectionSchema = createInsertSchema(repositoryConnections, {
  port: z.number().min(1).max(65535),
  connectionType: z.enum(['REST_API', 'PMREP']),
}).omit({ id: true, createdAt: true });

export const insertMigrationProjectSchema = createInsertSchema(migrationProjects, {
  status: z.enum(['DISCOVERY', 'ASSESSMENT', 'MIGRATION', 'COMPLETED']),
  autoMigrationPercentage: z.number().min(0).max(100),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPowerCenterObjectSchema = createInsertSchema(powerCenterObjects, {
  objectType: z.enum(['WORKFLOW', 'MAPPING', 'SESSION', 'TRANSFORMATION', 'SOURCE', 'TARGET']),
  complexity: z.enum(['SIMPLE', 'MEDIUM', 'COMPLEX']),
  migrationStatus: z.enum(['FULLY_AUTO', 'PARTIAL', 'MANUAL_REDESIGN']),
  automationCoverage: z.number().min(0).max(100),
}).omit({ id: true, lastScanned: true });

export const insertAssessmentResultSchema = createInsertSchema(assessmentResults, {
  assessmentType: z.enum(['COMPLEXITY', 'COMPATIBILITY', 'DEPENDENCY']),
  confidence: z.number().min(0).max(100),
}).omit({ id: true, createdAt: true });

export const insertMigrationIssueSchema = createInsertSchema(migrationIssues, {
  issueType: z.enum(['UNSUPPORTED_FUNCTION', 'MISSING_CONNECTION', 'PARAMETER_MISMATCH']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['OPEN', 'FIXED', 'IGNORED']),
}).omit({ id: true, createdAt: true });

// Types
export type RepositoryConnection = typeof repositoryConnections.$inferSelect;
export type InsertRepositoryConnection = z.infer<typeof insertRepositoryConnectionSchema>;

export type MigrationProject = typeof migrationProjects.$inferSelect;
export type InsertMigrationProject = z.infer<typeof insertMigrationProjectSchema>;

export type PowerCenterObject = typeof powerCenterObjects.$inferSelect;
export type InsertPowerCenterObject = z.infer<typeof insertPowerCenterObjectSchema>;

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = z.infer<typeof insertAssessmentResultSchema>;

export type MigrationIssue = typeof migrationIssues.$inferSelect;
export type InsertMigrationIssue = z.infer<typeof insertMigrationIssueSchema>;

export type FunctionMapping = typeof functionMappings.$inferSelect;
export type SyncStatus = typeof syncStatus.$inferSelect;