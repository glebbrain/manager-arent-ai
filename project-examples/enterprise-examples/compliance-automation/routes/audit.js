const express = require('express');
const router = express.Router();
const auditManager = require('../modules/audit-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/audit-routes.log' })
  ]
});

// Initialize audit manager
router.post('/initialize', async (req, res) => {
  try {
    await auditManager.initialize();
    res.json({ success: true, message: 'Audit manager initialized' });
  } catch (error) {
    logger.error('Error initializing audit manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create audit
router.post('/audits', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.type) {
      return res.status(400).json({ error: 'Audit type is required' });
    }

    const audit = await auditManager.createAudit(config);
    res.json(audit);
  } catch (error) {
    logger.error('Error creating audit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start audit
router.post('/audits/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    const audit = await auditManager.startAudit(id);
    res.json(audit);
  } catch (error) {
    logger.error('Error starting audit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete audit
router.post('/audits/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const results = req.body;
    
    const audit = await auditManager.completeAudit(id, results);
    res.json(audit);
  } catch (error) {
    logger.error('Error completing audit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add finding
router.post('/audits/:id/findings', async (req, res) => {
  try {
    const { id } = req.params;
    const finding = req.body;
    
    const auditFinding = await auditManager.addFinding(id, finding);
    res.json(auditFinding);
  } catch (error) {
    logger.error('Error adding finding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update finding
router.put('/audits/:id/findings/:findingId', async (req, res) => {
  try {
    const { id, findingId } = req.params;
    const updates = req.body;
    
    const finding = await auditManager.updateFinding(id, findingId, updates);
    res.json(finding);
  } catch (error) {
    logger.error('Error updating finding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add evidence
router.post('/audits/:id/evidence', async (req, res) => {
  try {
    const { id } = req.params;
    const evidence = req.body;
    
    const auditEvidence = await auditManager.addEvidence(id, evidence);
    res.json(auditEvidence);
  } catch (error) {
    logger.error('Error adding evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit
router.get('/audits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const audit = await auditManager.getAudit(id);
    res.json(audit);
  } catch (error) {
    logger.error('Error getting audit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List audits
router.get('/audits', async (req, res) => {
  try {
    const filters = req.query;
    
    const audits = await auditManager.listAudits(filters);
    res.json(audits);
  } catch (error) {
    logger.error('Error listing audits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit trail
router.get('/audits/:id/trail', async (req, res) => {
  try {
    const { id } = req.params;
    
    const trail = await auditManager.getAuditTrail(id);
    res.json(trail);
  } catch (error) {
    logger.error('Error getting audit trail:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs
router.get('/logs', async (req, res) => {
  try {
    const filters = req.query;
    
    const logs = await auditManager.getAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    logger.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit schedules
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await auditManager.getAuditSchedules();
    res.json(schedules);
  } catch (error) {
    logger.error('Error getting audit schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule audit
router.post('/schedules', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.type || !config.frequency) {
      return res.status(400).json({ error: 'Type and frequency are required' });
    }

    const schedule = await auditManager.scheduleAudit(config);
    res.json(schedule);
  } catch (error) {
    logger.error('Error scheduling audit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Run scheduled audits
router.post('/schedules/run', async (req, res) => {
  try {
    await auditManager.runScheduledAudits();
    res.json({ success: true, message: 'Scheduled audits executed' });
  } catch (error) {
    logger.error('Error running scheduled audits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await auditManager.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'audit',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
