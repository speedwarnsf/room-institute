/**
 * ProjectManager — browse, create, and manage multi-room projects.
 * Pro-only feature with project overview, style guide, notes, and budget tracking.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, Trash2, ArrowLeft, Check, X, Palette,
  Calendar, StickyNote, DollarSign, Link, Unlink, Settings,
  ChevronDown, ChevronUp, Home,
} from 'lucide-react';
import { Project, ProjectBudget, ProjectBudgetItem, ProjectStyleGuide, Room } from '../types';
import {
  getProjects, saveProject, deleteProject as deleteProjectFromStorage,
  createProject, addRoomToProject, removeRoomFromProject,
  addBudgetItem, toggleBudgetItemPurchased, deleteBudgetItem,
} from '../services/projectStorage';
import { getRooms } from '../services/houseRoomStorage';

interface ProjectManagerProps {
  onBack: () => void;
  onOpenRoom: (roomId: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ onBack, onOpenRoom }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const refresh = useCallback(async () => {
    const [p, r] = await Promise.all([getProjects(), getRooms()]);
    setProjects(p);
    setRooms(r);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    const project = createProject(newName.trim(), newDesc.trim() || undefined);
    await saveProject(project);
    setNewName('');
    setNewDesc('');
    setShowNewForm(false);
    await refresh();
    setSelectedProjectId(project.id);
  }, [newName, newDesc, refresh]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteProjectFromStorage(id);
    setConfirmDeleteId(null);
    if (selectedProjectId === id) setSelectedProjectId(null);
    await refresh();
  }, [selectedProjectId, refresh]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={selectedProject ? () => setSelectedProjectId(null) : onBack}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </button>
          <FolderOpen className="w-6 h-6 text-emerald-500" />
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {selectedProject ? selectedProject.name : 'Projects'}
          </h2>
        </div>
        {!selectedProject && (
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* New project form */}
      {showNewForm && !selectedProject && (
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Create Project</h3>
          <input
            type="text"
            placeholder="Project name (e.g., Kitchen + Living Room Renovation)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
          />
          <textarea
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
              Create
            </button>
            <button onClick={() => { setShowNewForm(false); setNewName(''); setNewDesc(''); }} className="px-4 py-2 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      {!selectedProject && !showNewForm && (
        <>
          {projects.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-stone-500 dark:text-stone-400 mb-2">No projects yet</p>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6 max-w-xs mx-auto">
                Group multiple rooms into a project for coordinated design with shared style and budget tracking
              </p>
              <button
                onClick={() => setShowNewForm(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {projects.map(project => {
                  const projectRooms = rooms.filter(r => project.roomIds.includes(r.id));
                  return (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500"
                      onClick={() => setSelectedProjectId(project.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open project: ${project.name}, ${project.roomIds.length} rooms`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedProjectId(project.id); } }}
                    >
                      {/* Room thumbnails mosaic */}
                      <div className="h-32 bg-stone-100 dark:bg-stone-700 overflow-hidden flex">
                        {projectRooms.length > 0 ? (
                          projectRooms.slice(0, 3).map((room, i) => (
                            <div key={room.id} className="flex-1 h-full overflow-hidden" style={{ borderRight: i < Math.min(projectRooms.length, 3) - 1 ? '1px solid' : 'none', borderColor: 'var(--color-stone-200)' }}>
                              {room.sourceImageThumb ? (
                                <img src={room.sourceImageThumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="w-6 h-6 text-stone-300 dark:text-stone-600" />
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-10 h-10 text-stone-300 dark:text-stone-600" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 sm:p-4">
                        <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">{project.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-stone-400 dark:text-stone-500">
                          <span className="flex items-center gap-1"><Home className="w-3 h-3" />{project.roomIds.length} room{project.roomIds.length !== 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          {project.budget.total > 0 && (
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${project.budget.spent.toLocaleString()} / ${project.budget.total.toLocaleString()}</span>
                          )}
                        </div>
                        {project.styleGuide && (
                          <div className="flex gap-1 mt-2">
                            {project.styleGuide.palette.slice(0, 5).map((c, i) => (
                              <div key={i} className="w-3.5 h-3.5 border border-stone-200 dark:border-stone-600" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {confirmDeleteId === project.id ? (
                          <div className="flex gap-1">
                            <button onClick={e => { e.stopPropagation(); handleDelete(project.id); }} className="p-1.5 bg-red-500 text-white shadow-sm hover:bg-red-600">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }} className="p-1.5 bg-white dark:bg-stone-600 shadow-sm">
                              <X className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(project.id); }} className="p-1.5 bg-white/90 dark:bg-stone-600/90 shadow-sm hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Project detail */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          allRooms={rooms}
          onUpdate={refresh}
          onOpenRoom={onOpenRoom}
        />
      )}
    </div>
  );
};

// ============================================================================
// ProjectDetail — overview, rooms, style guide, notes, budget
// ============================================================================

const ProjectDetail: React.FC<{
  project: Project;
  allRooms: Room[];
  onUpdate: () => void;
  onOpenRoom: (roomId: string) => void;
}> = ({ project, allRooms, onUpdate, onOpenRoom }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'style' | 'notes' | 'budget'>('overview');
  const [notes, setNotes] = useState(project.notes);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [budgetTotal, setBudgetTotal] = useState(String(project.budget.total || ''));
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemRoomId, setNewItemRoomId] = useState('');

  // Style guide state
  const [styleDesc, setStyleDesc] = useState(project.styleGuide?.description || '');
  const [stylePalette, setStylePalette] = useState(project.styleGuide?.palette?.join(', ') || '');
  const [styleMaterials, setStyleMaterials] = useState(project.styleGuide?.materials?.join(', ') || '');

  const projectRooms = allRooms.filter(r => project.roomIds.includes(r.id));
  const availableRooms = allRooms.filter(r => !project.roomIds.includes(r.id));

  const handleAddRoom = useCallback(async (roomId: string) => {
    await addRoomToProject(project.id, roomId);
    setShowRoomPicker(false);
    onUpdate();
  }, [project.id, onUpdate]);

  const handleRemoveRoom = useCallback(async (roomId: string) => {
    await removeRoomFromProject(project.id, roomId);
    onUpdate();
  }, [project.id, onUpdate]);

  const handleSaveNotes = useCallback(async () => {
    project.notes = notes;
    await saveProject(project);
    onUpdate();
  }, [project, notes, onUpdate]);

  const handleSaveBudgetTotal = useCallback(async () => {
    project.budget.total = parseFloat(budgetTotal) || 0;
    await saveProject(project);
    onUpdate();
  }, [project, budgetTotal, onUpdate]);

  const handleAddBudgetItem = useCallback(async () => {
    if (!newItemDesc.trim() || !newItemAmount.trim()) return;
    await addBudgetItem(project.id, {
      description: newItemDesc.trim(),
      amount: parseFloat(newItemAmount) || 0,
      roomId: newItemRoomId || undefined,
      purchased: false,
    });
    setNewItemDesc('');
    setNewItemAmount('');
    setNewItemRoomId('');
    onUpdate();
  }, [project.id, newItemDesc, newItemAmount, newItemRoomId, onUpdate]);

  const handleTogglePurchased = useCallback(async (itemId: string) => {
    await toggleBudgetItemPurchased(project.id, itemId);
    onUpdate();
  }, [project.id, onUpdate]);

  const handleDeleteBudgetItem = useCallback(async (itemId: string) => {
    await deleteBudgetItem(project.id, itemId);
    onUpdate();
  }, [project.id, onUpdate]);

  const handleSaveStyleGuide = useCallback(async () => {
    const palette = stylePalette.split(',').map(s => s.trim()).filter(Boolean);
    const materials = styleMaterials.split(',').map(s => s.trim()).filter(Boolean);
    const referenceDesignNames = projectRooms
      .flatMap(r => r.designs.map(d => d.option.name))
      .filter(Boolean);
    const styleGuide: ProjectStyleGuide = {
      description: styleDesc,
      palette,
      materials,
      referenceDesignNames,
    };
    project.styleGuide = styleGuide;
    await saveProject(project);
    onUpdate();
  }, [project, styleDesc, stylePalette, styleMaterials, projectRooms, onUpdate]);

  const tabs = [
    { id: 'overview' as const, label: 'Rooms', icon: Home },
    { id: 'style' as const, label: 'Style Guide', icon: Palette },
    { id: 'notes' as const, label: 'Notes', icon: StickyNote },
    { id: 'budget' as const, label: 'Budget', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Description */}
      {project.description && (
        <p className="text-sm text-stone-500 dark:text-stone-400">{project.description}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 dark:border-stone-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview / Rooms tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
              Rooms ({projectRooms.length})
            </h3>
            <button
              onClick={() => setShowRoomPicker(!showRoomPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <Link className="w-3.5 h-3.5" />
              Add Room
            </button>
          </div>

          {/* Room picker dropdown */}
          {showRoomPicker && (
            <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3 space-y-2">
              {availableRooms.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-500 py-2 text-center">No rooms available to add. Create rooms first.</p>
              ) : (
                availableRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleAddRoom(room.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-stone-200 dark:bg-stone-600 overflow-hidden flex-shrink-0">
                      {room.sourceImageThumb ? (
                        <img src={room.sourceImageThumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home className="w-4 h-4 text-stone-400" /></div>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{room.name}</span>
                      <span className="text-xs text-stone-400 dark:text-stone-500 block">{room.designs.length} design{room.designs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Room cards */}
          {projectRooms.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
              <p className="text-sm text-stone-400 dark:text-stone-500">Add rooms to this project to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projectRooms.map(room => {
                const latestDesign = room.designs.length > 0
                  ? [...room.designs].sort((a, b) => b.generatedAt - a.generatedAt)[0]
                  : null;
                return (
                  <div
                    key={room.id}
                    className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden group hover:shadow-md transition-all"
                  >
                    <div className="h-32 bg-stone-100 dark:bg-stone-700 overflow-hidden relative">
                      {latestDesign?.option.visualizationThumb ? (
                        <img src={latestDesign.option.visualizationThumb} alt="" className="w-full h-full object-cover" />
                      ) : room.sourceImageThumb ? (
                        <img src={room.sourceImageThumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home className="w-8 h-8 text-stone-300 dark:text-stone-600" /></div>
                      )}
                      {latestDesign && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5">
                          {latestDesign.option.name}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <button onClick={() => onOpenRoom(room.id)} className="text-sm font-semibold text-stone-800 dark:text-stone-100 hover:text-emerald-600 dark:hover:text-emerald-400 truncate block text-left">
                          {room.name}
                        </button>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{room.designs.length} design{room.designs.length !== 1 ? 's' : ''}</p>
                        {latestDesign && (
                          <div className="flex gap-1 mt-1">
                            {latestDesign.option.palette.slice(0, 5).map((c, i) => (
                              <div key={i} className="w-3 h-3 border border-stone-200 dark:border-stone-600" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveRoom(room.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove from project"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Style Guide tab */}
      {activeTab === 'style' && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Define a shared style direction. When generating new designs for rooms in this project, Room will reference this guide for consistency.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-1">Style Direction</label>
              <textarea
                value={styleDesc}
                onChange={e => setStyleDesc(e.target.value)}
                placeholder="e.g., Warm minimalism with natural materials, muted earth tones, and brass accents throughout"
                rows={3}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-1">Shared Palette (comma-separated hex)</label>
              <input
                type="text"
                value={stylePalette}
                onChange={e => setStylePalette(e.target.value)}
                placeholder="#8B7355, #D4C5A9, #2C2C2C, #F5F0EB, #B8860B"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {stylePalette && (
                <div className="flex gap-1 mt-2">
                  {stylePalette.split(',').map((c, i) => (
                    <div key={i} className="w-6 h-6 border border-stone-200 dark:border-stone-600" style={{ backgroundColor: c.trim() }} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-1">Materials / Finishes (comma-separated)</label>
              <input
                type="text"
                value={styleMaterials}
                onChange={e => setStyleMaterials(e.target.value)}
                placeholder="white oak, brushed brass, limewashed plaster, bouclé"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <button
            onClick={handleSaveStyleGuide}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            Save Style Guide
          </button>
        </div>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Project notes, inspiration links, contractor info, timeline..."
            rows={10}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <button
            onClick={handleSaveNotes}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            Save Notes
          </button>
        </div>
      )}

      {/* Budget tab */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* Total budget */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-1">Total Budget</label>
              <div className="flex items-center gap-2">
                <span className="text-stone-400">$</span>
                <input
                  type="number"
                  value={budgetTotal}
                  onChange={e => setBudgetTotal(e.target.value)}
                  onBlur={handleSaveBudgetTotal}
                  placeholder="0"
                  className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {project.budget.total > 0 && (
              <div className="text-right pb-2">
                <p className="text-xs text-stone-400 dark:text-stone-500">Spent</p>
                <p className="text-lg font-bold text-stone-800 dark:text-stone-100">${project.budget.spent.toLocaleString()}</p>
                <div className="w-32 h-2 bg-stone-200 dark:bg-stone-700 mt-1">
                  <div
                    className={`h-full transition-all ${project.budget.spent > project.budget.total ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (project.budget.spent / project.budget.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add item */}
          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">Add Expense</h4>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={newItemDesc}
                onChange={e => setNewItemDesc(e.target.value)}
                placeholder="Description"
                className="flex-1 min-w-[150px] px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                value={newItemAmount}
                onChange={e => setNewItemAmount(e.target.value)}
                placeholder="$0"
                className="w-24 px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={newItemRoomId}
                onChange={e => setNewItemRoomId(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">General</option>
                {projectRooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddBudgetItem}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Items list */}
          {project.budget.items.length > 0 && (
            <div className="space-y-1">
              {project.budget.items.map(item => {
                const roomName = item.roomId ? projectRooms.find(r => r.id === item.roomId)?.name : null;
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2 px-3 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 group">
                    <button
                      onClick={() => handleTogglePurchased(item.id)}
                      className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        item.purchased
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-stone-300 dark:border-stone-600 hover:border-emerald-400'
                      }`}
                    >
                      {item.purchased && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${item.purchased ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-100'}`}>
                        {item.description}
                      </span>
                      {roomName && (
                        <span className="text-xs text-stone-400 dark:text-stone-500 ml-2">({roomName})</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">${item.amount.toLocaleString()}</span>
                    <button
                      onClick={() => handleDeleteBudgetItem(item.id)}
                      className="p-1 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
