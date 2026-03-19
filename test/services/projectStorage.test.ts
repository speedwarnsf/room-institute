/**
 * Tests for Project Storage Service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProject,
  getProjects,
  saveProject,
  deleteProject,
  addRoomToProject,
  removeRoomFromProject,
  updateProjectNotes,
  updateProjectBudget,
  updateProjectStyleGuide,
  addBudgetItem,
  toggleBudgetItemPurchased,
  deleteBudgetItem,
  getProjectCount,
} from '../../services/projectStorage';
import type { Project, ProjectBudget } from '../../types';

// Mock auth to always return null (localStorage path)
vi.mock('../../services/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  getAnonymousId: vi.fn().mockReturnValue('test-anon'),
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('projectStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createProject', () => {
    it('creates a project with default values', () => {
      const project = createProject('Kitchen + Living Room');
      expect(project.id).toMatch(/^project-/);
      expect(project.name).toBe('Kitchen + Living Room');
      expect(project.roomIds).toEqual([]);
      expect(project.notes).toBe('');
      expect(project.budget.total).toBe(0);
      expect(project.budget.spent).toBe(0);
      expect(project.budget.items).toEqual([]);
    });

    it('accepts optional description', () => {
      const project = createProject('Renovation', 'Full house renovation');
      expect(project.description).toBe('Full house renovation');
    });
  });

  describe('saveProject / getProjects', () => {
    it('saves and retrieves projects', async () => {
      const project = createProject('Test Project');
      await saveProject(project);
      const projects = await getProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe('Test Project');
    });

    it('updates existing project', async () => {
      const project = createProject('Test');
      await saveProject(project);
      project.name = 'Updated';
      await saveProject(project);
      const projects = await getProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe('Updated');
    });
  });

  describe('deleteProject', () => {
    it('removes project from storage', async () => {
      const project = createProject('To Delete');
      await saveProject(project);
      await deleteProject(project.id);
      const projects = await getProjects();
      expect(projects.length).toBe(0);
    });
  });

  describe('room management', () => {
    it('adds and removes rooms', async () => {
      const project = createProject('Test');
      await saveProject(project);

      await addRoomToProject(project.id, 'room-1');
      await addRoomToProject(project.id, 'room-2');
      let updated = (await getProjects())[0];
      expect(updated.roomIds).toEqual(['room-1', 'room-2']);

      // No duplicates
      await addRoomToProject(project.id, 'room-1');
      updated = (await getProjects())[0];
      expect(updated.roomIds).toEqual(['room-1', 'room-2']);

      await removeRoomFromProject(project.id, 'room-1');
      updated = (await getProjects())[0];
      expect(updated.roomIds).toEqual(['room-2']);
    });
  });

  describe('notes', () => {
    it('updates project notes', async () => {
      const project = createProject('Test');
      await saveProject(project);
      await updateProjectNotes(project.id, 'Important notes here');
      const updated = (await getProjects())[0];
      expect(updated.notes).toBe('Important notes here');
    });
  });

  describe('budget', () => {
    it('adds budget items and tracks spending', async () => {
      const project = createProject('Test');
      project.budget.total = 5000;
      await saveProject(project);

      await addBudgetItem(project.id, { description: 'Sofa', amount: 1200, purchased: false });
      await addBudgetItem(project.id, { description: 'Paint', amount: 300, purchased: true });

      let updated = (await getProjects())[0];
      expect(updated.budget.items.length).toBe(2);
      expect(updated.budget.spent).toBe(300);

      // Toggle purchased
      const sofaId = updated.budget.items.find(i => i.description === 'Sofa')!.id;
      await toggleBudgetItemPurchased(project.id, sofaId);
      updated = (await getProjects())[0];
      expect(updated.budget.spent).toBe(1500);

      // Delete item
      await deleteBudgetItem(project.id, sofaId);
      updated = (await getProjects())[0];
      expect(updated.budget.items.length).toBe(1);
      expect(updated.budget.spent).toBe(300);
    });
  });

  describe('style guide', () => {
    it('sets and retrieves style guide', async () => {
      const project = createProject('Test');
      await saveProject(project);
      await updateProjectStyleGuide(project.id, {
        description: 'Warm minimalism',
        palette: ['#8B7355', '#D4C5A9'],
        materials: ['white oak', 'brass'],
        referenceDesignNames: ['Velvet Archive'],
      });
      const updated = (await getProjects())[0];
      expect(updated.styleGuide?.description).toBe('Warm minimalism');
      expect(updated.styleGuide?.palette).toEqual(['#8B7355', '#D4C5A9']);
    });
  });

  describe('getProjectCount', () => {
    it('returns correct count', async () => {
      expect(await getProjectCount()).toBe(0);
      await saveProject(createProject('A'));
      await saveProject(createProject('B'));
      expect(await getProjectCount()).toBe(2);
    });
  });
});
