/**
 * Actions Queue — logs user CRUD actions to localStorage for the Developer panel.
 */

export interface ActionEntry {
  id: string;
  timestamp: string;
  type: 'add' | 'modify' | 'delete' | 'other';
  entity: string;
  entityId?: string;
  summary: string;
  details?: string;
}

const STORAGE_KEY = 'app_actions_queue';
const MAX_ENTRIES = 500;

export function getActions(): ActionEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function logAction(
  type: ActionEntry['type'],
  entity: string,
  summary: string,
  entityId?: string,
  details?: string,
) {
  const entry: ActionEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    entity,
    entityId,
    summary,
    details,
  };
  const list = getActions();
  list.unshift(entry);
  if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('actions-queue-update'));
}

export function clearActions() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('actions-queue-update'));
}
