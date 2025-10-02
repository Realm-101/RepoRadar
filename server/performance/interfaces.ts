/**
 * Performance monitoring interfaces for RepoRadar
 * Supports database, API, and frontend performance metrics collection
 */

export interface PerformanceMetrics {
  timestamp: Date;
  category: 'database' | 'api' | 'frontend';
  metric: string;
  value: number;
  threshold?: number;
  metadata?: Record<string, any>;
}

export interface DatabaseMetrics extends PerformanceMetrics {
  category: 'database';
  queryId?: string;
  executionTime: number;
  connectionPoolSize: number;
  activeConnections: number;
}

export interface APIMetrics extends PerformanceMetrics {
  category: 'api';
  endpoint: string;
  responseTime: number;
  cacheHit: boolean;
  compressionRatio?: number;
}

export interface FrontendMetrics extends PerformanceMetrics {
  category: 'frontend';
  bundleName: string;
  loadTime: number;
  bundleSize: number;
  cacheStatus: 'hit' | 'miss' | 'stale';
}

export interface IMetricsCollector {
  /**
   * Collect a performance metric
   */
  collect(metric: PerformanceMetrics): Promise<void>;
  
  /**
   * Collect multiple metrics at once
   */
  collectBatch(metrics: PerformanceMetrics[]): Promise<void>;
  
  /**
   * Get metrics by category and time range
   */
  getMetrics(
    category?: PerformanceMetrics['category'],
    startTime?: Date,
    endTime?: Date
  ): Promise<PerformanceMetrics[]>;
  
  /**
   * Get aggregated metrics (avg, min, max, count)
   */
  getAggregatedMetrics(
    category: PerformanceMetrics['category'],
    metric: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<{
    avg: number;
    min: number;
    max: number;
    count: number;
  }>;
  
  /**
   * Clear old metrics based on retention policy
   */
  cleanup(olderThan: Date): Promise<number>;
}

export interface IMetricsStorage {
  /**
   * Store a single metric
   */
  store(metric: PerformanceMetrics): Promise<void>;
  
  /**
   * Store multiple metrics
   */
  storeBatch(metrics: PerformanceMetrics[]): Promise<void>;
  
  /**
   * Retrieve metrics with filtering
   */
  retrieve(filter: MetricsFilter): Promise<PerformanceMetrics[]>;
  
  /**
   * Delete metrics older than specified date
   */
  deleteOlderThan(date: Date): Promise<number>;
  
  /**
   * Get storage statistics
   */
  getStats(): Promise<{
    totalMetrics: number;
    oldestMetric: Date | null;
    newestMetric: Date | null;
    categoryCounts: Record<string, number>;
  }>;
}

export interface MetricsFilter {
  category?: PerformanceMetrics['category'];
  metric?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export interface IPerformanceMonitor {
  /**
   * Start monitoring performance
   */
  start(): Promise<void>;
  
  /**
   * Stop monitoring performance
   */
  stop(): Promise<void>;
  
  /**
   * Check if monitoring is active
   */
  isActive(): boolean;
  
  /**
   * Get current performance snapshot
   */
  getSnapshot(): Promise<{
    database: Partial<DatabaseMetrics>;
    api: Partial<APIMetrics>;
    frontend: Partial<FrontendMetrics>;
  }>;
  
  /**
   * Register a custom metric collector
   */
  registerCollector(name: string, collector: IMetricsCollector): void;
  
  /**
   * Unregister a metric collector
   */
  unregisterCollector(name: string): void;
}

// Database Performance Interfaces

export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  healthCheckIntervalMs: number;
  maxRetries: number;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalCreated: number;
  totalDestroyed: number;
  totalAcquired: number;
  totalReleased: number;
}

export interface IConnectionPool {
  /**
   * Initialize the connection pool
   */
  initialize(): Promise<void>;
  
  /**
   * Acquire a connection from the pool
   */
  acquire(): Promise<any>;
  
  /**
   * Release a connection back to the pool
   */
  release(connection: any): Promise<void>;
  
  /**
   * Destroy a connection (remove from pool)
   */
  destroy(connection: any): Promise<void>;
  
  /**
   * Get current pool statistics
   */
  getStats(): ConnectionPoolStats;
  
  /**
   * Check pool health
   */
  healthCheck(): Promise<boolean>;
  
  /**
   * Drain the pool (close all connections)
   */
  drain(): Promise<void>;
  
  /**
   * Clear the pool (destroy all connections)
   */
  clear(): Promise<void>;
}

export interface IndexInfo {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
  condition?: string;
}

export interface QueryAnalysis {
  queryId: string;
  query: string;
  executionTime: number;
  planningTime: number;
  indexesUsed: string[];
  suggestedIndexes: IndexInfo[];
  cost: number;
}

export interface IIndexManager {
  /**
   * Ensure required indexes exist
   */
  ensureIndexes(): Promise<void>;
  
  /**
   * Create a specific index
   */
  createIndex(indexInfo: IndexInfo): Promise<void>;
  
  /**
   * Drop an index
   */
  dropIndex(indexName: string): Promise<void>;
  
  /**
   * Analyze query performance and suggest indexes
   */
  analyzeQuery(query: string): Promise<QueryAnalysis>;
  
  /**
   * Get all existing indexes
   */
  getExistingIndexes(): Promise<IndexInfo[]>;
  
  /**
   * Optimize existing indexes based on usage patterns
   */
  optimizeIndexes(): Promise<void>;
}

export interface QueryMetrics {
  queryId: string;
  query: string;
  executionTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  connectionId?: string;
}

export interface IQueryMonitor {
  /**
   * Start monitoring a query
   */
  startQuery(queryId: string, query: string): void;
  
  /**
   * End monitoring a query
   */
  endQuery(queryId: string, success: boolean, error?: string): void;
  
  /**
   * Get query metrics
   */
  getMetrics(startTime?: Date, endTime?: Date): Promise<QueryMetrics[]>;
  
  /**
   * Get slow queries (above threshold)
   */
  getSlowQueries(thresholdMs?: number): Promise<QueryMetrics[]>;
  
  /**
   * Clear old query metrics
   */
  cleanup(olderThan: Date): Promise<number>;
  
  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(thresholdMs: number): void;
}