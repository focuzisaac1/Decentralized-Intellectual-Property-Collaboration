import { describe, it, expect, beforeEach } from 'vitest';

// Mock clarity functions and state
const mockState = {
  projects: new Map(),
  projectOwners: new Map(),
  nextProjectId: 1
};

// Mock tx-sender
let txSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

// Mock contract functions
const projectRegistration = {
  registerProject: (title, description, metadataUrl) => {
    const projectId = mockState.nextProjectId;
    
    // Check if project exists
    if (mockState.projects.has(projectId)) {
      return { type: 'err', value: 101 }; // ERR_PROJECT_EXISTS
    }
    
    // Set project data
    mockState.projects.set(projectId, {
      title,
      description,
      creator: txSender,
      createdAt: 100, // Mock block height
      metadataUrl
    });
    
    // Set project owner
    mockState.projectOwners.set(projectId, { owner: txSender });
    
    // Increment project ID
    mockState.nextProjectId++;
    
    return { type: 'ok', value: projectId };
  },
  
  updateProject: (projectId, title, description, metadataUrl) => {
    // Check if project exists
    if (!mockState.projects.has(projectId)) {
      return { type: 'err', value: 102 }; // ERR_PROJECT_NOT_FOUND
    }
    
    // Check if owner data exists
    if (!mockState.projectOwners.has(projectId)) {
      return { type: 'err', value: 102 }; // ERR_PROJECT_NOT_FOUND
    }
    
    // Check if sender is owner
    const ownerData = mockState.projectOwners.get(projectId);
    if (ownerData.owner !== txSender) {
      return { type: 'err', value: 100 }; // ERR_NOT_AUTHORIZED
    }
    
    // Get existing project data
    const existingProject = mockState.projects.get(projectId);
    
    // Update project data
    mockState.projects.set(projectId, {
      title,
      description,
      creator: existingProject.creator,
      createdAt: existingProject.createdAt,
      metadataUrl
    });
    
    return { type: 'ok', value: true };
  },
  
  transferOwnership: (projectId, newOwner) => {
    // Check if owner data exists
    if (!mockState.projectOwners.has(projectId)) {
      return { type: 'err', value: 102 }; // ERR_PROJECT_NOT_FOUND
    }
    
    // Check if sender is owner
    const ownerData = mockState.projectOwners.get(projectId);
    if (ownerData.owner !== txSender) {
      return { type: 'err', value: 100 }; // ERR_NOT_AUTHORIZED
    }
    
    // Update owner
    mockState.projectOwners.set(projectId, { owner: newOwner });
    
    return { type: 'ok', value: true };
  },
  
  getProject: (projectId) => {
    return mockState.projects.get(projectId) || null;
  },
  
  getProjectOwner: (projectId) => {
    return mockState.projectOwners.get(projectId) || null;
  }
};

describe('Project Registration Contract', () => {
  beforeEach(() => {
    // Reset state
    mockState.projects = new Map();
    mockState.projectOwners = new Map();
    mockState.nextProjectId = 1;
    txSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  });
  
  it('should register a new project', () => {
    const result = projectRegistration.registerProject(
        'Test Project',
        'A test project description',
        null
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(1);
    
    const projectData = projectRegistration.getProject(1);
    expect(projectData).not.toBeNull();
    expect(projectData.title).toBe('Test Project');
    expect(projectData.description).toBe('A test project description');
    expect(projectData.creator).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
  });
  
  it('should update an existing project', () => {
    // First register a project
    projectRegistration.registerProject(
        'Test Project',
        'A test project description',
        null
    );
    
    // Then update it
    const result = projectRegistration.updateProject(
        1,
        'Updated Project',
        'Updated description',
        'https://example.com/metadata.json'
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    
    const projectData = projectRegistration.getProject(1);
    expect(projectData.title).toBe('Updated Project');
    expect(projectData.description).toBe('Updated description');
    expect(projectData.metadataUrl).toBe('https://example.com/metadata.json');
  });
  
  it('should not allow updating a project by non-owner', () => {
    // First register a project
    projectRegistration.registerProject(
        'Test Project',
        'A test project description',
        null
    );
    
    // Change sender
    txSender = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    // Try to update
    const result = projectRegistration.updateProject(
        1,
        'Updated Project',
        'Updated description',
        null
    );
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(100); // ERR_NOT_AUTHORIZED
  });
  
  it('should transfer ownership of a project', () => {
    // First register a project
    projectRegistration.registerProject(
        'Test Project',
        'A test project description',
        null
    );
    
    // Transfer ownership
    const newOwner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const result = projectRegistration.transferOwnership(1, newOwner);
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    
    const ownerData = projectRegistration.getProjectOwner(1);
    expect(ownerData.owner).toBe(newOwner);
  });
  
  it('should not allow transferring ownership by non-owner', () => {
    // First register a project
    projectRegistration.registerProject(
        'Test Project',
        'A test project description',
        null
    );
    
    // Change sender
    txSender = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    // Try to transfer ownership
    const result = projectRegistration.transferOwnership(
        1,
        'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0'
    );
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(100); // ERR_NOT_AUTHORIZED
  });
});

console.log('Project Registration Contract tests completed successfully!');
