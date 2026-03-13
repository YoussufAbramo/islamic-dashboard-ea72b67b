/**
 * Actions Queue — logs user CRUD actions to localStorage for the Developer panel.
 */

export type ActionStatus = 'queued' | 'completed' | 'stopped';

export interface ActionEntry {
  id: string;
  timestamp: string;
  type: 'add' | 'modify' | 'delete' | 'other';
  status: ActionStatus;
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
  status: ActionStatus = 'completed',
) {
  const entry: ActionEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    status,
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

export function updateActionStatus(id: string, status: ActionStatus) {
  const list = getActions();
  const idx = list.findIndex(a => a.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('actions-queue-update'));
  }
}

export function clearActions() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('actions-queue-update'));
}
