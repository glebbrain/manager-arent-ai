const express = require('express');
const router = express.Router();
const securityManager = require('../modules/security-manager');

// Initialize security manager
securityManager.initialize();

// Create security policy
router.post('/policies', async (req, res) => {
  try {
    const policy = await securityManager.createSecurityPolicy(req.body);
    res.status(201).json({
      success: true,
      data: policy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get security policies
router.get('/policies', async (req, res) => {
  try {
    const policies = await securityManager.getSecurityPolicies();
    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create security group
router.post('/groups', async (req, res) => {
  try {
    const securityGroup = await securityManager.createSecurityGroup(req.body);
    res.status(201).json({
      success: true,
      data: securityGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get security groups
router.get('/groups', async (req, res) => {
  try {
    const securityGroups = await securityManager.getSecurityGroups();
    res.json({
      success: true,
      data: securityGroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create access control
router.post('/access-controls', async (req, res) => {
  try {
    const accessControl = await securityManager.createAccessControl(req.body);
    res.status(201).json({
      success: true,
      data: accessControl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get access controls
router.get('/access-controls', async (req, res) => {
  try {
    const accessControls = await securityManager.getAccessControls();
    res.json({
      success: true,
      data: accessControls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check compliance
router.post('/compliance/check', async (req, res) => {
  try {
    const { framework } = req.body;
    
    if (!framework) {
      return res.status(400).json({
        success: false,
        error: 'framework is required'
      });
    }

    const compliance = await securityManager.checkCompliance(framework);
    res.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Log security event
router.post('/events', async (req, res) => {
  try {
    const event = await securityManager.logSecurityEvent(req.body);
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get security events
router.get('/events', async (req, res) => {
  try {
    const events = await securityManager.getSecurityEvents(req.query);
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get security data
router.get('/data', async (req, res) => {
  try {
    const data = await securityManager.getSecurityData();
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
