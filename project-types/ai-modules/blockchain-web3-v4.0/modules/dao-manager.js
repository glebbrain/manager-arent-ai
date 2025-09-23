const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class DAOManager {
  constructor() {
    this.daos = new Map();
    this.proposals = new Map();
    this.votes = new Map();
    this.members = new Map();
    this.provider = null;
    this.signer = null;
  }

  async initialize() {
    try {
      logger.info('Initializing DAO Manager...');
      
      // Load existing data
      await this.loadDAOData();
      
      logger.info('DAO Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize DAO Manager:', error);
      throw error;
    }
  }

  setProvider(provider, signer = null) {
    this.provider = provider;
    this.signer = signer;
  }

  async createDAO(name, description, governanceToken, votingThreshold = 50, quorum = 10) {
    try {
      if (!this.provider) {
        throw new Error('Provider not set. Please initialize blockchain connection first.');
      }

      const daoId = `dao-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const daoData = {
        daoId,
        name,
        description,
        governanceToken,
        votingThreshold,
        quorum,
        totalMembers: 0,
        totalProposals: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
        contractAddress: null
      };

      this.daos.set(daoId, daoData);
      await this.saveDAOData();

      logger.info(`DAO created: ${name} (${daoId})`);
      
      return {
        success: true,
        daoId,
        name,
        description,
        governanceToken,
        votingThreshold,
        quorum,
        message: 'DAO created successfully'
      };
    } catch (error) {
      logger.error(`Failed to create DAO ${name}:`, error);
      throw error;
    }
  }

  async addMember(daoId, memberAddress, role = 'member') {
    try {
      const dao = this.daos.get(daoId);
      if (!dao) {
        throw new Error(`DAO not found: ${daoId}`);
      }

      const memberId = `${daoId}-${memberAddress}`;
      const memberData = {
        memberId,
        daoId,
        memberAddress,
        role,
        joinedAt: new Date().toISOString(),
        status: 'active',
        votingPower: 1 // Default voting power
      };

      this.members.set(memberId, memberData);
      
      // Update DAO member count
      dao.totalMembers += 1;
      this.daos.set(daoId, dao);
      
      await this.saveDAOData();

      logger.info(`Member added to DAO ${daoId}: ${memberAddress}`);
      
      return {
        success: true,
        daoId,
        memberAddress,
        role,
        votingPower: memberData.votingPower
      };
    } catch (error) {
      logger.error(`Failed to add member to DAO ${daoId}:`, error);
      throw error;
    }
  }

  async createProposal(daoId, proposerAddress, title, description, proposalType = 'governance') {
    try {
      const dao = this.daos.get(daoId);
      if (!dao) {
        throw new Error(`DAO not found: ${daoId}`);
      }

      // Check if proposer is a member
      const memberId = `${daoId}-${proposerAddress}`;
      const member = this.members.get(memberId);
      if (!member || member.status !== 'active') {
        throw new Error(`Proposer is not an active member of the DAO`);
      }

      const proposalId = `proposal-${daoId}-${Date.now()}`;
      const proposalData = {
        proposalId,
        daoId,
        proposerAddress,
        title,
        description,
        proposalType,
        status: 'active',
        votesFor: 0,
        votesAgainst: 0,
        totalVotes: 0,
        createdAt: new Date().toISOString(),
        votingEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      this.proposals.set(proposalId, proposalData);
      
      // Update DAO proposal count
      dao.totalProposals += 1;
      this.daos.set(daoId, dao);
      
      await this.saveDAOData();

      logger.info(`Proposal created in DAO ${daoId}: ${title}`);
      
      return {
        success: true,
        proposalId,
        daoId,
        title,
        description,
        proposerAddress,
        votingEndsAt: proposalData.votingEndsAt
      };
    } catch (error) {
      logger.error(`Failed to create proposal in DAO ${daoId}:`, error);
      throw error;
    }
  }

  async voteOnProposal(proposalId, voterAddress, vote, votingPower = 1) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error(`Proposal not found: ${proposalId}`);
      }

      if (proposal.status !== 'active') {
        throw new Error(`Proposal is not active: ${proposalId}`);
      }

      if (new Date() > new Date(proposal.votingEndsAt)) {
        throw new Error(`Voting period has ended for proposal: ${proposalId}`);
      }

      // Check if voter is a member
      const memberId = `${proposal.daoId}-${voterAddress}`;
      const member = this.members.get(memberId);
      if (!member || member.status !== 'active') {
        throw new Error(`Voter is not an active member of the DAO`);
      }

      // Check if already voted
      const voteId = `${proposalId}-${voterAddress}`;
      if (this.votes.has(voteId)) {
        throw new Error(`Voter has already voted on this proposal`);
      }

      const voteData = {
        voteId,
        proposalId,
        voterAddress,
        vote, // 'for' or 'against'
        votingPower: votingPower || member.votingPower,
        votedAt: new Date().toISOString()
      };

      this.votes.set(voteId, voteData);
      
      // Update proposal vote counts
      if (vote === 'for') {
        proposal.votesFor += voteData.votingPower;
      } else if (vote === 'against') {
        proposal.votesAgainst += voteData.votingPower;
      }
      
      proposal.totalVotes += voteData.votingPower;
      this.proposals.set(proposalId, proposal);
      
      await this.saveDAOData();

      logger.info(`Vote cast on proposal ${proposalId}: ${vote} by ${voterAddress}`);
      
      return {
        success: true,
        proposalId,
        voterAddress,
        vote,
        votingPower: voteData.votingPower
      };
    } catch (error) {
      logger.error(`Failed to vote on proposal ${proposalId}:`, error);
      throw error;
    }
  }

  async executeProposal(proposalId, executorAddress) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error(`Proposal not found: ${proposalId}`);
      }

      if (proposal.status !== 'active') {
        throw new Error(`Proposal is not active: ${proposalId}`);
      }

      if (new Date() <= new Date(proposal.votingEndsAt)) {
        throw new Error(`Voting period has not ended yet for proposal: ${proposalId}`);
      }

      // Check if proposal passed
      const dao = this.daos.get(proposal.daoId);
      if (!dao) {
        throw new Error(`DAO not found: ${proposal.daoId}`);
      }

      const totalPossibleVotes = dao.totalMembers * 1; // Assuming 1 voting power per member
      const quorumMet = proposal.totalVotes >= (dao.quorum / 100) * totalPossibleVotes;
      const thresholdMet = proposal.votesFor > (dao.votingThreshold / 100) * proposal.totalVotes;

      if (!quorumMet) {
        proposal.status = 'rejected';
        proposal.reason = 'Quorum not met';
      } else if (!thresholdMet) {
        proposal.status = 'rejected';
        proposal.reason = 'Voting threshold not met';
      } else {
        proposal.status = 'executed';
        proposal.executedAt = new Date().toISOString();
        proposal.executorAddress = executorAddress;
      }

      this.proposals.set(proposalId, proposal);
      await this.saveDAOData();

      logger.info(`Proposal ${proposalId} ${proposal.status}: ${proposal.reason || 'Executed successfully'}`);
      
      return {
        success: true,
        proposalId,
        status: proposal.status,
        reason: proposal.reason,
        votesFor: proposal.votesFor,
        votesAgainst: proposal.votesAgainst,
        totalVotes: proposal.totalVotes,
        quorumMet,
        thresholdMet
      };
    } catch (error) {
      logger.error(`Failed to execute proposal ${proposalId}:`, error);
      throw error;
    }
  }

  async getProposal(proposalId) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error(`Proposal not found: ${proposalId}`);
      }

      return {
        success: true,
        proposalId: proposal.proposalId,
        daoId: proposal.daoId,
        title: proposal.title,
        description: proposal.description,
        proposerAddress: proposal.proposerAddress,
        status: proposal.status,
        votesFor: proposal.votesFor,
        votesAgainst: proposal.votesAgainst,
        totalVotes: proposal.totalVotes,
        createdAt: proposal.createdAt,
        votingEndsAt: proposal.votingEndsAt,
        executedAt: proposal.executedAt,
        reason: proposal.reason
      };
    } catch (error) {
      logger.error(`Failed to get proposal ${proposalId}:`, error);
      throw error;
    }
  }

  async getDAOProposals(daoId, status = null) {
    try {
      const proposals = [];
      
      for (const [proposalId, proposal] of this.proposals.entries()) {
        if (proposal.daoId === daoId && (!status || proposal.status === status)) {
          proposals.push({
            proposalId: proposal.proposalId,
            title: proposal.title,
            description: proposal.description,
            proposerAddress: proposal.proposerAddress,
            status: proposal.status,
            votesFor: proposal.votesFor,
            votesAgainst: proposal.votesAgainst,
            totalVotes: proposal.totalVotes,
            createdAt: proposal.createdAt,
            votingEndsAt: proposal.votingEndsAt
          });
        }
      }

      return {
        success: true,
        daoId,
        proposals: proposals,
        count: proposals.length
      };
    } catch (error) {
      logger.error(`Failed to get proposals for DAO ${daoId}:`, error);
      throw error;
    }
  }

  async getDAOMembers(daoId) {
    try {
      const members = [];
      
      for (const [memberId, member] of this.members.entries()) {
        if (member.daoId === daoId) {
          members.push({
            memberAddress: member.memberAddress,
            role: member.role,
            votingPower: member.votingPower,
            status: member.status,
            joinedAt: member.joinedAt
          });
        }
      }

      return {
        success: true,
        daoId,
        members: members,
        count: members.length
      };
    } catch (error) {
      logger.error(`Failed to get members for DAO ${daoId}:`, error);
      throw error;
    }
  }

  async getDAOInfo(daoId) {
    try {
      const dao = this.daos.get(daoId);
      if (!dao) {
        throw new Error(`DAO not found: ${daoId}`);
      }

      return {
        success: true,
        daoId: dao.daoId,
        name: dao.name,
        description: dao.description,
        governanceToken: dao.governanceToken,
        votingThreshold: dao.votingThreshold,
        quorum: dao.quorum,
        totalMembers: dao.totalMembers,
        totalProposals: dao.totalProposals,
        status: dao.status,
        createdAt: dao.createdAt
      };
    } catch (error) {
      logger.error(`Failed to get DAO info for ${daoId}:`, error);
      throw error;
    }
  }

  async listDAOs() {
    try {
      const daosList = [];
      
      for (const [daoId, dao] of this.daos.entries()) {
        daosList.push({
          daoId: dao.daoId,
          name: dao.name,
          description: dao.description,
          totalMembers: dao.totalMembers,
          totalProposals: dao.totalProposals,
          status: dao.status,
          createdAt: dao.createdAt
        });
      }

      return {
        success: true,
        daos: daosList,
        count: daosList.length
      };
    } catch (error) {
      logger.error('Failed to list DAOs:', error);
      throw error;
    }
  }

  async loadDAOData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      const daosPath = path.join(dataDir, 'daos.json');
      const proposalsPath = path.join(dataDir, 'dao-proposals.json');
      const votesPath = path.join(dataDir, 'dao-votes.json');
      const membersPath = path.join(dataDir, 'dao-members.json');
      
      // Load DAOs
      if (fs.existsSync(daosPath)) {
        const data = fs.readFileSync(daosPath, 'utf8');
        const daos = JSON.parse(data);
        for (const [key, daoData] of Object.entries(daos)) {
          this.daos.set(key, daoData);
        }
      }
      
      // Load proposals
      if (fs.existsSync(proposalsPath)) {
        const data = fs.readFileSync(proposalsPath, 'utf8');
        const proposals = JSON.parse(data);
        for (const [key, proposalData] of Object.entries(proposals)) {
          this.proposals.set(key, proposalData);
        }
      }
      
      // Load votes
      if (fs.existsSync(votesPath)) {
        const data = fs.readFileSync(votesPath, 'utf8');
        const votes = JSON.parse(data);
        for (const [key, voteData] of Object.entries(votes)) {
          this.votes.set(key, voteData);
        }
      }
      
      // Load members
      if (fs.existsSync(membersPath)) {
        const data = fs.readFileSync(membersPath, 'utf8');
        const members = JSON.parse(data);
        for (const [key, memberData] of Object.entries(members)) {
          this.members.set(key, memberData);
        }
      }
      
      logger.info(`Loaded DAO data: ${this.daos.size} DAOs, ${this.proposals.size} proposals, ${this.votes.size} votes, ${this.members.size} members`);
    } catch (error) {
      logger.error('Failed to load DAO data:', error);
    }
  }

  async saveDAOData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Save DAOs
      const daosPath = path.join(dataDir, 'daos.json');
      const daosObj = Object.fromEntries(this.daos);
      fs.writeFileSync(daosPath, JSON.stringify(daosObj, null, 2));
      
      // Save proposals
      const proposalsPath = path.join(dataDir, 'dao-proposals.json');
      const proposalsObj = Object.fromEntries(this.proposals);
      fs.writeFileSync(proposalsPath, JSON.stringify(proposalsObj, null, 2));
      
      // Save votes
      const votesPath = path.join(dataDir, 'dao-votes.json');
      const votesObj = Object.fromEntries(this.votes);
      fs.writeFileSync(votesPath, JSON.stringify(votesObj, null, 2));
      
      // Save members
      const membersPath = path.join(dataDir, 'dao-members.json');
      const membersObj = Object.fromEntries(this.members);
      fs.writeFileSync(membersPath, JSON.stringify(membersObj, null, 2));
      
      logger.info(`Saved DAO data: ${this.daos.size} DAOs, ${this.proposals.size} proposals, ${this.votes.size} votes, ${this.members.size} members`);
    } catch (error) {
      logger.error('Failed to save DAO data:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveDAOData();
      this.daos.clear();
      this.proposals.clear();
      this.votes.clear();
      this.members.clear();
      logger.info('DAO Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new DAOManager();
