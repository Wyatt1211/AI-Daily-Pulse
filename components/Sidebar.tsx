import React, { useState } from 'react';
import { FilterSettings, User } from '../types';
import { Settings, BookOpen, Newspaper, Plus, X, LogOut, User as UserIcon } from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  currentView: 'feed' | 'repo' | 'settings';
  onViewChange: (view: 'feed' | 'repo' | 'settings') => void;
  settings: FilterSettings;
  onUpdateSettings: (s: FilterSettings) => void;
  onLogout: () => void;
  isOpen: boolean;       // Control visibility on mobile
  onClose: () => void;   // Close handler for mobile
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, 
  currentView, 
  onViewChange, 
  settings, 
  onUpdateSettings,
  onLogout,
  isOpen,
  onClose
}) => {
  const [newTopic, setNewTopic] = useState("");

  const toggleTopic = (topic: string) => {
    const isActive = settings.activeTopics.includes(topic);
    let newTopics;
    if (isActive) {
      newTopics = settings.activeTopics.filter(t => t !== topic);
    } else {
      newTopics = [...settings.activeTopics, topic];
    }
    onUpdateSettings({ ...settings, activeTopics: newTopics });
  };

  const addTopic = () => {
    if (newTopic && !settings.activeTopics.includes(newTopic)) {
      onUpdateSettings({ ...settings, activeTopics: [...settings.activeTopics, newTopic] });
      setNewTopic("");
    }
  };

  const handleViewChange = (view: 'feed' | 'repo' | 'settings') => {
    onViewChange(view);
    onClose(); // Close sidebar on mobile when navigating
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-screen w-80 bg-slate-900 border-r border-slate-800 
        flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AI Daily Pulse
            </h1>
            <p className="text-slate-400 text-xs mt-1">Intelligent Aggregator</p>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8">
          
          {/* User Profile */}
          <div className="flex items-center space-x-3 px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {currentUser.username.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
              <p className="text-xs text-slate-500">Free Plan</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <button
              onClick={() => handleViewChange('feed')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'feed' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Newspaper size={20} />
              <span className="font-medium">Daily Briefing</span>
            </button>
            
            <button
              onClick={() => handleViewChange('repo')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'repo' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen size={20} />
              <span className="font-medium">Knowledge Repo</span>
            </button>

            <button
              onClick={() => handleViewChange('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'settings' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings size={20} />
              <span className="font-medium">Sources & Config</span>
            </button>
          </div>

          {/* Filters */}
          {currentView === 'feed' && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
                Focus Topics
              </h3>
              <div className="space-y-2 mb-4">
                {settings.activeTopics.map(topic => (
                  <div 
                    key={topic} 
                    className="flex items-center justify-between group px-2 py-1 rounded hover:bg-slate-800/50"
                  >
                    <label className="flex items-center space-x-3 cursor-pointer flex-1">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                         true ? 'bg-cyan-500/20 border-cyan-500' : 'border-slate-600'
                      }`}>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                      </div>
                      <span className="text-sm text-slate-300">{topic}</span>
                    </label>
                    <button 
                      onClick={() => toggleTopic(topic)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 px-2 mt-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Add topic..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                />
                <button 
                  onClick={addTopic}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">Sign Out</span>
          </button>
          <p className="text-center text-xs text-slate-600">
            Powered by Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
