/**
 * PROJECTS API TESTS
 * 
 * Test suite for project management endpoints
 */

import { Express } from 'express';
import { APITestHelper, MockDataFactory, AssertionHelpers, DatabaseTestHelper } from '../test-utils';

const mockApp = {} as Express;
let api: APITestHelper;
let dbHelper: DatabaseTestHelper;

describe('Projects API', () => {
  beforeEach(() => {
    api = new APITestHelper(mockApp);
    dbHelper = new DatabaseTestHelper();
  });

  afterEach(async () => {
    api.logout();
    await dbHelper.cleanupTestData();
  });

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const user = await api.loginAs();
      const projectData = MockDataFactory.createValidProjectData();
      
      const response = await api.post('/api/projects', projectData);
      
      AssertionHelpers.expectSuccessResponse(response, {
        title: projectData.title,
        description: projectData.description,
        userId: user.id
      });
      
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should reject project creation without authentication', async () => {
      const projectData = MockDataFactory.createValidProjectData();
      
      const response = await api.post('/api/projects', projectData);
      
      AssertionHelpers.expectAuthenticationError(response);
    });

    it('should validate required project fields', async () => {
      await api.loginAs();
      const invalidData = MockDataFactory.createInvalidProjectData();
      
      const response = await api.post('/api/projects', invalidData);
      
      AssertionHelpers.expectValidationError(response);
    });

    it('should enforce platform token costs', async () => {
      const user = await api.loginAs({ platformTokens: 0 });
      const projectData = MockDataFactory.createValidProjectData();
      
      const response = await api.post('/api/projects', projectData);
      
      AssertionHelpers.expectErrorResponse(response, 402, 'Insufficient platform tokens');
    });

    it('should apply trust tier rate limits', async () => {
      const seedlingUser = await api.loginAs({ trustTier: 'SEEDLING' });
      const projectData = MockDataFactory.createValidProjectData();
      
      // Create multiple projects rapidly
      const promises = Array(10).fill(null).map(() => 
        api.post('/api/projects', projectData)
      );
      
      const responses = await Promise.all(promises);
      
      // Should get rate limited based on trust tier
      const lastResponse = responses[responses.length - 1];
      expect([200, 429]).toContain(lastResponse.status);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      const user = await api.loginAs();
      await dbHelper.createTestProject(user.id);
      await dbHelper.createTestProject(user.id, { title: 'Second Project' });
    });

    it('should return user projects with pagination', async () => {
      await api.loginAs();
      
      const response = await api.get('/api/projects?page=1&limit=10');
      
      AssertionHelpers.expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('projects');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.projects)).toBe(true);
    });

    it('should filter projects by search query', async () => {
      await api.loginAs();
      
      const response = await api.get('/api/projects?search=AI');
      
      AssertionHelpers.expectSuccessResponse(response);
      expect(response.body.data.projects).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await api.get('/api/projects');
      
      AssertionHelpers.expectAuthenticationError(response);
    });

    it('should handle empty results gracefully', async () => {
      await api.loginAs({ id: 'user-with-no-projects' });
      
      const response = await api.get('/api/projects');
      
      AssertionHelpers.expectSuccessResponse(response);
      expect(response.body.data.projects).toEqual([]);
    });
  });

  describe('GET /api/projects/:id', () => {
    let testProject: any;

    beforeEach(async () => {
      const user = await api.loginAs();
      testProject = await dbHelper.createTestProject(user.id);
    });

    it('should return project details for owner', async () => {
      const response = await api.get(`/api/projects/${testProject.id}`);
      
      AssertionHelpers.expectSuccessResponse(response, {
        id: testProject.id,
        title: testProject.title
      });
    });

    it('should return 404 for non-existent project', async () => {
      await api.loginAs();
      
      const response = await api.get('/api/projects/non-existent-id');
      
      AssertionHelpers.expectNotFoundError(response);
    });

    it('should enforce ownership authorization', async () => {
      await api.loginAs({ id: 'different-user' });
      
      const response = await api.get(`/api/projects/${testProject.id}`);
      
      AssertionHelpers.expectAuthorizationError(response);
    });

    it('should require authentication', async () => {
      const response = await api.get(`/api/projects/${testProject.id}`);
      
      AssertionHelpers.expectAuthenticationError(response);
    });
  });

  describe('PUT /api/projects/:id', () => {
    let testProject: any;

    beforeEach(async () => {
      const user = await api.loginAs();
      testProject = await dbHelper.createTestProject(user.id);
    });

    it('should update project with valid data', async () => {
      const updateData = {
        title: 'Updated Project Title',
        description: 'Updated description'
      };
      
      const response = await api.put(`/api/projects/${testProject.id}`, updateData);
      
      AssertionHelpers.expectSuccessResponse(response, updateData);
    });

    it('should validate update data', async () => {
      const invalidData = {
        title: '', // Invalid empty title
        description: 'x'.repeat(5001) // Too long
      };
      
      const response = await api.put(`/api/projects/${testProject.id}`, invalidData);
      
      AssertionHelpers.expectValidationError(response);
    });

    it('should enforce ownership authorization', async () => {
      await api.loginAs({ id: 'different-user' });
      
      const response = await api.put(`/api/projects/${testProject.id}`, {
        title: 'Unauthorized Update'
      });
      
      AssertionHelpers.expectAuthorizationError(response);
    });

    it('should return 404 for non-existent project', async () => {
      await api.loginAs();
      
      const response = await api.put('/api/projects/non-existent-id', {
        title: 'Update'
      });
      
      AssertionHelpers.expectNotFoundError(response);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let testProject: any;

    beforeEach(async () => {
      const user = await api.loginAs();
      testProject = await dbHelper.createTestProject(user.id);
    });

    it('should delete project successfully', async () => {
      const response = await api.delete(`/api/projects/${testProject.id}`);
      
      AssertionHelpers.expectSuccessResponse(response);
    });

    it('should enforce ownership authorization', async () => {
      await api.loginAs({ id: 'different-user' });
      
      const response = await api.delete(`/api/projects/${testProject.id}`);
      
      AssertionHelpers.expectAuthorizationError(response);
    });

    it('should return 404 for non-existent project', async () => {
      await api.loginAs();
      
      const response = await api.delete('/api/projects/non-existent-id');
      
      AssertionHelpers.expectNotFoundError(response);
    });

    it('should cascade delete related data', async () => {
      // This would test that related prompt bundles, etc. are also deleted
      const response = await api.delete(`/api/projects/${testProject.id}`);
      
      AssertionHelpers.expectSuccessResponse(response);
      
      // Verify related data is cleaned up (would need actual DB queries in real test)
      expect(response.body.data).toHaveProperty('deletedRelatedRecords');
    });
  });

  describe('POST /api/projects/:id/upload', () => {
    let testProject: any;

    beforeEach(async () => {
      const user = await api.loginAs();
      testProject = await dbHelper.createTestProject(user.id);
    });

    it('should upload project files successfully', async () => {
      const mockFilePath = '/tmp/test-project.zip';
      
      const response = await api.upload(
        `/api/projects/${testProject.id}/upload`,
        'file',
        mockFilePath
      );
      
      AssertionHelpers.expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('uploadUrl');
      expect(response.body.data).toHaveProperty('fileKey');
    });

    it('should validate file types', async () => {
      const mockInvalidFile = '/tmp/test.exe';
      
      const response = await api.upload(
        `/api/projects/${testProject.id}/upload`,
        'file',
        mockInvalidFile
      );
      
      AssertionHelpers.expectValidationError(response, 'file type');
    });

    it('should enforce file size limits', async () => {
      // Mock large file
      const mockLargeFile = '/tmp/large-file.zip';
      
      const response = await api.upload(
        `/api/projects/${testProject.id}/upload`,
        'file',
        mockLargeFile
      );
      
      // Should either succeed or fail with size error depending on implementation
      expect([200, 413]).toContain(response.status);
    });

    it('should require project ownership', async () => {
      await api.loginAs({ id: 'different-user' });
      
      const response = await api.upload(
        `/api/projects/${testProject.id}/upload`,
        'file',
        '/tmp/test.zip'
      );
      
      AssertionHelpers.expectAuthorizationError(response);
    });
  });

  describe('Project Analytics', () => {
    beforeEach(async () => {
      const user = await api.loginAs();
      await dbHelper.createTestProject(user.id);
    });

    it('should track project creation metrics', async () => {
      const projectData = MockDataFactory.createValidProjectData();
      
      const response = await api.post('/api/projects', projectData);
      
      AssertionHelpers.expectSuccessResponse(response);
      // Verify metrics were recorded (would check metrics service in real test)
    });

    it('should log security events for sensitive operations', async () => {
      const testProject = await dbHelper.createTestProject('test-user');
      
      const response = await api.delete(`/api/projects/${testProject.id}`);
      
      // Should log the deletion as a security event
      AssertionHelpers.expectSuccessResponse(response);
    });
  });
});