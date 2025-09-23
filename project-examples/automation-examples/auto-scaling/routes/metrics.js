const express = require('express');
const router = express.Router();
const metricsCollector = require('../modules/metrics-collector');

// Initialize metrics collector
metricsCollector.initialize();

// Collect metrics
router.post('/collect', async (req, res) => {
  try {
    const { collectorId } = req.body;
    const results = await metricsCollector.collectMetrics(collectorId);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get metrics
router.get('/', async (req, res) => {
  try {
    const metrics = await metricsCollector.getMetrics(req.query);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get metrics by name
router.get('/:name', async (req, res) => {
  try {
    const metrics = await metricsCollector.getMetrics({ name: req.params.name });
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Aggregate metrics
router.post('/aggregate', async (req, res) => {
  try {
    const { metricName, aggregation, timeRange = '1h' } = req.body;
    
    if (!metricName || !aggregation) {
      return res.status(400).json({
        success: false,
        error: 'metricName and aggregation are required'
      });
    }

    const result = await metricsCollector.aggregateMetrics(metricName, aggregation, timeRange);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get metric types
router.get('/types', async (req, res) => {
  try {
    const types = await metricsCollector.getMetricTypes();
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get collectors
router.get('/collectors', async (req, res) => {
  try {
    const collectors = await metricsCollector.getCollectors();
    res.json({
      success: true,
      data: collectors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get aggregations
router.get('/aggregations', async (req, res) => {
  try {
    const aggregations = await metricsCollector.getAggregations();
    res.json({
      success: true,
      data: aggregations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get metrics data
router.get('/data', async (req, res) => {
  try {
    const data = await metricsCollector.getMetricsData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
