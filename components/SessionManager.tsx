/**
 * Session Manager Component for Room
 * 
 * UI for saving, loading, and managing analysis sessions
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Clock, 
  MessageSquare,
  X,
  Check,
  Edit2
} from 'lucide-react';
import {
  SavedSession,
  SessionMetadata,
  getSessionMetadata,
  getSession,
  deleteSession,
  renameSession,
  exportSession,
  importSession,
  searchSessions,
  getStorageInfo
} from '../services/sessionStorage';

// ============================================================================
// TYPES
// ============================================================================

interface SessionManagerProps {
  /** Currently open session ID (if any) */
  currentSessionId?: string;
  /** Callback when a session is selected to load */
  onLoadSession: (session: SavedSession) => void;
  /** Callback to save current state */
  onSaveSession: () => void;
  /** Whether there's unsaved work */
  hasUnsavedChanges?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SessionManager({
  currentSessionId,
  onLoadSession,
  onSaveSession,
  hasUnsavedChanges = false
}: SessionManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Get sessions (refresh on open)
  const sessions = useMemo(() => {
    if (!isOpen) return [];
    return searchQuery ? searchSessions(searchQuery) : getSessionMetadata();
  }, [isOpen, searchQuery]);
  
  const storageInfo = useMemo(() => getStorageInfo(), [isOpen]);
  
  // Handlers
  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setEditingId(null);
    setConfirmDeleteId(null);
  }, []);
  
  const handleLoad = useCallback((id: string) => {
    const session = getSession(id);
    if (session) {
      onLoadSession(session);
      handleClose();
    }
  }, [onLoadSession, handleClose]);
  
  const handleDelete = useCallback((id: string) => {
    deleteSession(id);
    setConfirmDeleteId(null);
    // Force refresh
    setSearchQuery(q => q + ' ');
    setSearchQuery(q => q.trim());
  }, []);
  
  const handleStartRename = useCallback((session: SessionMetadata) => {
    setEditingId(session.id);
    setEditName(session.name);
  }, []);
  
  const handleSaveRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameSession(editingId, editName.trim());
    }
    setEditingId(null);
  }, [editingId, editName]);
  
  const handleExport = useCallback((id: string) => {
    const json = exportSession(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room-institute-session-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, []);
  
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const session = importSession(text);
        if (session) {
          onLoadSession(session);
          handleClose();
        } else {
          alert('Invalid session file');
        }
      }
    };
    input.click();
  }, [onLoadSession, handleClose]);
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <>
      {/* Trigger Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveSession}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
            ${hasUnsavedChanges 
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          title="Save Session"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </button>
        
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          title="Open Sessions"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Sessions</span>
        </button>
      </div>
      
      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <div 
            className="bg-white dark:bg-stone-800 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Saved Sessions</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            
            {/* Search & Import */}
            <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-700 flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-sm font-medium text-stone-700 dark:text-stone-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
            </div>
            
            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                  {searchQuery ? 'No sessions found' : 'No saved sessions yet'}
                </div>
              ) : (
                sessions.map(session => (
                  <div
                    key={session.id}
                    className={`group bg-stone-50 dark:bg-stone-700/50 p-3 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors ${
                      session.id === currentSessionId ? 'ring-2 ring-emerald-500' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <img
                        src={session.thumbnail}
                        alt=""
                        className="w-16 h-16 object-cover bg-stone-200 flex-shrink-0"
                      />
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {editingId === session.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button 
                              onClick={handleSaveRename}
                              className="p-1 hover:bg-emerald-100"
                            >
                              <Check className="w-4 h-4 text-emerald-600" />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-1 hover:bg-stone-200"
                            >
                              <X className="w-4 h-4 text-stone-500" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-stone-800 dark:text-stone-100 truncate">
                            {session.name}
                          </h3>
                        )}
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(session.updatedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {session.messageCount} messages
                          </span>
                        </div>
                        
                        {session.tags && session.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {session.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {confirmDeleteId === session.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600"
                              title="Confirm delete"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-2 bg-stone-100 hover:bg-stone-200"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleLoad(session.id)}
                              className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-600"
                              title="Open session"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStartRename(session)}
                              className="p-2 hover:bg-stone-200"
                              title="Rename"
                            >
                              <Edit2 className="w-4 h-4 text-stone-500" />
                            </button>
                            <button
                              onClick={() => handleExport(session.id)}
                              className="p-2 hover:bg-stone-200"
                              title="Export"
                            >
                              <Download className="w-4 h-4 text-stone-500" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(session.id)}
                              className="p-2 hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-stone-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>
                {storageInfo.sessionCount} / {storageInfo.maxSessions} sessions
              </span>
              <span>
                ~{(storageInfo.estimatedSize / 1024).toFixed(1)} KB used
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SessionManager;
