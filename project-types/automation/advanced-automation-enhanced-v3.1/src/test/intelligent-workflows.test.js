const IntelligentWorkflows = require('../modules/intelligent-workflows');
const logger = require('../modules/logger');

// Mock logger
jest.mock('../modules/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('IntelligentWorkflows', () => {
  let workflows;

  beforeEach(() => {
    workflows = new IntelligentWorkflows();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (workflows) {
      workflows.stop();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(workflows.isRunning).toBe(false);
      expect(workflows.workflows).toEqual({});
      expect(workflows.optimization).toBe(true);
      expect(workflows.dynamicAdjustment).toBe(true);
    });

    test('should start successfully', async () => {
      await workflows.start();
      expect(workflows.isRunning).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Intelligent workflows system started');
    });

    test('should stop successfully', async () => {
      await workflows.start();
      await workflows.stop();
      expect(workflows.isRunning).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Intelligent workflows system stopped');
    });
  });

  describe('Workflow Management', () => {
    test('should create workflow', async () => {
      const workflowDef = {
        id: 'workflow-1',
        name: 'Data Processing Workflow',
        steps: [
          { id: 'step-1', type: 'data-ingestion', config: {} },
          { id: 'step-2', type: 'data-transformation', config: {} },
          { id: 'step-3', type: 'data-output', config: {} }
        ],
        triggers: ['data-available'],
        conditions: { priority: 'high' }
      };

      await workflows.createWorkflow(workflowDef);
      expect(workflows.workflows['workflow-1']).toEqual(workflowDef);
      expect(logger.info).toHaveBeenCalledWith('Workflow created: workflow-1');
    });

    test('should handle invalid workflow definition', async () => {
      const invalidWorkflow = {
        id: 'workflow-1',
        // Missing required fields
      };

      await expect(workflows.createWorkflow(invalidWorkflow))
        .rejects.toThrow('Invalid workflow definition');
    });

    test('should get workflow by id', () => {
      const workflowDef = {
        id: 'workflow-1',
        name: 'Test Workflow',
        steps: []
      };

      workflows.workflows['workflow-1'] = workflowDef;
      const workflow = workflows.getWorkflow('workflow-1');
      expect(workflow).toEqual(workflowDef);
    });

    test('should return null for non-existent workflow', () => {
      const workflow = workflows.getWorkflow('non-existent');
      expect(workflow).toBeNull();
    });

    test('should list all workflows', () => {
      const workflow1 = { id: 'workflow-1', name: 'Workflow 1' };
      const workflow2 = { id: 'workflow-2', name: 'Workflow 2' };

      workflows.workflows['workflow-1'] = workflow1;
      workflows.workflows['workflow-2'] = workflow2;

      const workflowList = workflows.listWorkflows();
      expect(workflowList).toHaveLength(2);
      expect(workflowList).toContain(workflow1);
      expect(workflowList).toContain(workflow2);
    });
  });

  describe('Workflow Execution', () => {
    test('should execute workflow', async () => {
      const workflowDef = {
        id: 'workflow-1',
        name: 'Test Workflow',
        steps: [
          { id: 'step-1', type: 'data-ingestion', config: {} },
          { id: 'step-2', type: 'data-transformation', config: {} }
        ],
        triggers: ['manual'],
        conditions: {}
      };

      workflows.workflows['workflow-1'] = workflowDef;
      const execution = await workflows.executeWorkflow('workflow-1', {
        input: 'test-data',
        priority: 'high'
      });

      expect(execution).toHaveProperty('executionId');
      expect(execution).toHaveProperty('workflowId');
      expect(execution).toHaveProperty('status');
      expect(execution).toHaveProperty('startTime');
    });

    test('should handle workflow execution errors', async () => {
      const workflowDef = {
        id: 'workflow-1',
        name: 'Test Workflow',
        steps: [
          { id: 'step-1', type: 'data-ingestion', config: {} }
        ],
        triggers: ['manual'],
        conditions: {}
      };

      workflows.workflows['workflow-1'] = workflowDef;
      workflows.stepExecutors['data-ingestion'] = jest.fn().mockRejectedValue(new Error('Step failed'));

      const execution = await workflows.executeWorkflow('workflow-1', {
        input: 'test-data'
      });

      expect(execution.status).toBe('failed');
      expect(logger.error).toHaveBeenCalledWith('Workflow execution failed', expect.any(Error));
    });

    test('should get execution status', () => {
      const execution = {
        executionId: 'exec-1',
        workflowId: 'workflow-1',
        status: 'running',
        progress: 50
      };

      workflows.executions['exec-1'] = execution;
      const status = workflows.getExecutionStatus('exec-1');
      expect(status).toEqual(execution);
    });
  });

  describe('Optimization', () => {
    test('should optimize workflow', async () => {
      const workflowDef = {
        id: 'workflow-1',
        name: 'Test Workflow',
        steps: [
          { id: 'step-1', type: 'data-ingestion', config: {} },
          { id: 'step-2', type: 'data-transformation', config: {} }
        ],
        triggers: ['manual'],
        conditions: {}
      };

      workflows.workflows['workflow-1'] = workflowDef;
      const optimized = await workflows.optimizeWorkflow('workflow-1');
      
      expect(optimized).toHaveProperty('optimizations');
      expect(optimized).toHaveProperty('performanceGain');
      expect(optimized).toHaveProperty('recommendations');
    });

    test('should get optimization metrics', () => {
      const metrics = workflows.getOptimizationMetrics();
      expect(metrics).toHaveProperty('totalOptimizations');
      expect(metrics).toHaveProperty('averageGain');
      expect(metrics).toHaveProperty('successRate');
    });
  });

  describe('Dynamic Adjustment', () => {
    test('should adjust workflow dynamically', async () => {
      const workflowDef = {
        id: 'workflow-1',
        name: 'Test Workflow',
        steps: [
          { id: 'step-1', type: 'data-ingestion', config: {} }
        ],
        triggers: ['manual'],
        conditions: {}
      };

      workflows.workflows['workflow-1'] = workflowDef;
      const adjustment = await workflows.adjustWorkflow('workflow-1', {
        reason: 'performance-issue',
        changes: { priority: 'high' }
      });

      expect(adjustment).toHaveProperty('adjusted');
      expect(adjustment).toHaveProperty('changes');
      expect(adjustment).toHaveProperty('reason');
    });

    test('should get adjustment history', () => {
      const history = workflows.getAdjustmentHistory('workflow-1');
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Orchestration', () => {
    test('should orchestrate multiple workflows', async () => {
      const workflow1 = {
        id: 'workflow-1',
        name: 'Data Ingestion',
        steps: [{ id: 'step-1', type: 'data-ingestion', config: {} }],
        triggers: ['manual'],
        conditions: {}
      };

      const workflow2 = {
        id: 'workflow-2',
        name: 'Data Processing',
        steps: [{ id: 'step-1', type: 'data-transformation', config: {} }],
        triggers: ['workflow-completed'],
        conditions: { dependsOn: 'workflow-1' }
      };

      workflows.workflows['workflow-1'] = workflow1;
      workflows.workflows['workflow-2'] = workflow2;

      const orchestration = await workflows.orchestrateWorkflows(['workflow-1', 'workflow-2']);
      expect(orchestration).toHaveProperty('orchestrationId');
      expect(orchestration).toHaveProperty('workflows');
      expect(orchestration).toHaveProperty('status');
    });

    test('should get orchestration status', () => {
      const orchestration = {
        orchestrationId: 'orch-1',
        workflows: ['workflow-1', 'workflow-2'],
        status: 'running'
      };

      workflows.orchestrations['orch-1'] = orchestration;
      const status = workflows.getOrchestrationStatus('orch-1');
      expect(status).toEqual(orchestration);
    });
  });

  describe('Monitoring', () => {
    test('should monitor workflow performance', async () => {
      const performance = await workflows.monitorPerformance();
      expect(performance).toHaveProperty('throughput');
      expect(performance).toHaveProperty('latency');
      expect(performance).toHaveProperty('errorRate');
    });

    test('should get workflow metrics', () => {
      const metrics = workflows.getWorkflowMetrics('workflow-1');
      expect(metrics).toHaveProperty('executions');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('averageDuration');
    });
  });
});
