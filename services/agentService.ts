import { AgentProfile } from '../types';

const STORAGE_KEY = 'zenspace_agent_profile';

/**
 * Save agent profile to localStorage
 */
export function saveAgentProfile(profile: AgentProfile): void {
  try {
    const serialized = JSON.stringify(profile);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save agent profile:', error);
  }
}

/**
 * Get agent profile from localStorage
 */
export function getAgentProfile(): AgentProfile | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    return JSON.parse(serialized) as AgentProfile;
  } catch (error) {
    console.error('Failed to load agent profile:', error);
    return null;
  }
}

/**
 * Remove agent profile from localStorage
 */
export function clearAgentProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear agent profile:', error);
  }
}