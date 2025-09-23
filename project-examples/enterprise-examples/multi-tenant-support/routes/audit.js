const express = require('express');
const auditLogger = require('../modules/audit-logger');

const router = express.Router();

// Get audit logs
router.get('/logs', async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const filters = {
      action: req.query.action,
      userId: req.query.userId,
      category: req.query.category,
      severity: req.query.severity,
      riskLevel: req.query.riskLevel,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await auditLogger.getAuditLogs(tenantId, filters);

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search audit logs
router.get('/search', async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const filters = {
      action: req.query.action,
      userId: req.query.userId,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    };

    const logs = await auditLogger.searchAuditLogs(tenantId, query, filters);

    res.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Error searching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit statistics
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const options = {
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    };

    const stats = await auditLogger.getAuditStats(tenantId, options);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting audit stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate audit report
router.post('/reports', async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const options = {
      fromDate: req.body.fromDate,
      toDate: req.body.toDate
    };

    const report = await auditLogger.generateAuditReport(tenantId, options);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating audit report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export audit logs
router.post('/export', async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const options = {
      fromDate: req.body.fromDate,
      toDate: req.body.toDate
    };

    const exportData = await auditLogger.exportAuditLogs(tenantId, options);

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
