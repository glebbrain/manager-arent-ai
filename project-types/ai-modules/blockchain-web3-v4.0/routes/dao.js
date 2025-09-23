const express = require('express');
const router = express.Router();
const daoManager = require('../modules/dao-manager');
const blockchainManager = require('../modules/blockchain-manager');
const logger = require('../modules/logger');

// Create DAO
router.post('/', async (req, res) => {
  try {
    const { name, description, governanceToken, votingThreshold, quorum } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Name and description are required'
      });
    }

    // Set provider from blockchain manager
    daoManager.setProvider(blockchainManager.ethersProvider, blockchainManager.signer);

    const result = await daoManager.createDAO(name, description, governanceToken, votingThreshold, quorum);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to create DAO ${req.body.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to create DAO',
      message: error.message
    });
  }
});

// Add member to DAO
router.post('/:daoId/members', async (req, res) => {
  try {
    const { daoId } = req.params;
    const { memberAddress, role } = req.body;
    
    if (!daoId || !memberAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'DAO ID and member address are required'
      });
    }

    const result = await daoManager.addMember(daoId, memberAddress, role);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to add member to DAO ${req.params.daoId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member',
      message: error.message
    });
  }
});

// Create proposal
router.post('/:daoId/proposals', async (req, res) => {
  try {
    const { daoId } = req.params;
    const { proposerAddress, title, description, proposalType } = req.body;
    
    if (!daoId || !proposerAddress || !title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'DAO ID, proposer address, title, and description are required'
      });
    }

    const result = await daoManager.createProposal(daoId, proposerAddress, title, description, proposalType);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to create proposal in DAO ${req.params.daoId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to create proposal',
      message: error.message
    });
  }
});

// Vote on proposal
router.post('/proposals/:proposalId/vote', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { voterAddress, vote, votingPower } = req.body;
    
    if (!proposalId || !voterAddress || !vote) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Proposal ID, voter address, and vote are required'
      });
    }

    const result = await daoManager.voteOnProposal(proposalId, voterAddress, vote, votingPower);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to vote on proposal ${req.params.proposalId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to vote on proposal',
      message: error.message
    });
  }
});

// Execute proposal
router.post('/proposals/:proposalId/execute', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { executorAddress } = req.body;
    
    if (!proposalId || !executorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Proposal ID and executor address are required'
      });
    }

    const result = await daoManager.executeProposal(proposalId, executorAddress);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to execute proposal ${req.params.proposalId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute proposal',
      message: error.message
    });
  }
});

// Get proposal
router.get('/proposals/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Proposal ID is required'
      });
    }

    const result = await daoManager.getProposal(proposalId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get proposal ${req.params.proposalId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get proposal',
      message: error.message
    });
  }
});

// Get DAO proposals
router.get('/:daoId/proposals', async (req, res) => {
  try {
    const { daoId } = req.params;
    const { status } = req.query;
    
    if (!daoId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'DAO ID is required'
      });
    }

    const result = await daoManager.getDAOProposals(daoId, status);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get proposals for DAO ${req.params.daoId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get DAO proposals',
      message: error.message
    });
  }
});

// Get DAO members
router.get('/:daoId/members', async (req, res) => {
  try {
    const { daoId } = req.params;
    
    if (!daoId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'DAO ID is required'
      });
    }

    const result = await daoManager.getDAOMembers(daoId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get members for DAO ${req.params.daoId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get DAO members',
      message: error.message
    });
  }
});

// Get DAO info
router.get('/:daoId', async (req, res) => {
  try {
    const { daoId } = req.params;
    
    if (!daoId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'DAO ID is required'
      });
    }

    const result = await daoManager.getDAOInfo(daoId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get DAO info for ${req.params.daoId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get DAO info',
      message: error.message
    });
  }
});

// List DAOs
router.get('/', async (req, res) => {
  try {
    const result = await daoManager.listDAOs();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to list DAOs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list DAOs',
      message: error.message
    });
  }
});

module.exports = router;
