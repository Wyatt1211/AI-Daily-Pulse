import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import AuthScreen from './components/AuthScreen';
import { AppState, FilterSettings, NewsArticle, User } from './types';
import * as storage from './services/storageService';
import * as geminiService from './services/geminiService';
import { Calendar, Loader2, Save, RotateCw, AlertTriangle, Menu } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [currentView, setCurrentView] = useState<'feed' | 'repo' | 'settings'>('feed');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [settings, setSettings] = useState<FilterSettings>({
    activeTopics: [],
    customSources: []
  });

  const [state, setState] = useState<AppState>({
    user: null,
    generatedNews: [],
    repository: [],
    isLoading: false,
    selectedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Default yesterday
    error: null,
  });

  // --- Effects ---
  useEffect(() => {
    // Check for existing session on mount
    const sessionUser = storage.getCurrentSessionUser();
    if (sessionUser) {
      handleLoginSuccess(sessionUser);
    }
  }, []);

  // --- Handlers ---
  
  const handleLoginSuccess = (user: User) => {
    // Load user-specific data
    const savedRepo = storage.getRepository(user.id);
    const savedSettings = storage.getSettings(user.id);
    
    setState(prev => ({
      ...prev,
      user: user,
      repository: savedRepo,
      generatedNews: [], // Clear old generated news on login
      error: null
    }));
    setSettings(savedSettings);
  };

  const handleLogout = () => {
    storage.logoutUser();
    setState(prev => ({
      ...prev,
      user: null,
      repository: [],
      generatedNews: []
    }));
  };

  const handleUpdateSettings = (newSettings: FilterSettings) => {
    if (!state.user) return;
    setSettings(newSettings);
    storage.saveSettings(state.user.id, newSettings);
  };

  const handleFetchNews = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Get titles from repository to exclude
      const repoTitles = state.repository.map(r => r.title);
      
      const news = await geminiService.fetchAiNews(
        state.selectedDate,
        settings.activeTopics,
        settings.customSources,
        repoTitles
      );

      setState(prev => ({
        ...prev,
        generatedNews: news,
        isLoading: false
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to fetch news. Please check your API Key or try again."
      }));
    }
  };

  const handleArchive = (article: NewsArticle) => {
    if (!state.user) return;
    const updatedRepo = storage.saveToRepository(state.user.id, article);
    // Remove from feed locally
    setState(prev => ({
      ...prev,
      repository: updatedRepo,
      generatedNews: prev.generatedNews.filter(n => n.id !== article.id)
    }));
  };

  const handleDismiss = (id: string) => {
    setState(prev => ({
      ...prev,
      generatedNews: prev.generatedNews.filter(n => n.id !== id)
    }));
  };

  const handleRemoveFromRepo = (id: string) => {
    if (!state.user) return;
    const updatedRepo = storage.removeFromRepository(state.user.id, id);
    setState(prev => ({ ...prev, repository: updatedRepo }));
  };

  // --- Render ---

  if (!state.user) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const renderFeed = () => (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-md py-4 md:py-6 border-b border-slate-800 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Mobile Header Row */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-2 md:space-x-4 flex-1">
            <div className="relative flex-1 md:flex-none">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={state.selectedDate}
                onChange={(e) => setState(prev => ({ ...prev, selectedDate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            <button
              onClick={handleFetchNews}
              disabled={state.isLoading}
              className="hidden md:flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              {state.isLoading ? <Loader2 className="animate-spin" size={18} /> : <RotateCw size={18} />}
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* Mobile Generate Button (Full Width) */}
        <button
          onClick={handleFetchNews}
          disabled={state.isLoading}
          className="md:hidden w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
           {state.isLoading ? <Loader2 className="animate-spin" size={18} /> : <RotateCw size={18} />}
           <span>{state.isLoading ? 'Analyzing...' : 'Generate Report'}</span>
        </button>

        <div className="text-slate-400 text-sm hidden md:block">
          {state.generatedNews.length > 0 ? `${state.generatedNews.length} Insights` : ''}
        </div>
      </div>

      {state.error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-8 flex items-start gap-3">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {state.error}
          </div>
        </div>
      )}

      {state.generatedNews.length === 0 && !state.isLoading && !state.error && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCw size={32} className="text-slate-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No News Loaded</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Select a date and click "Generate" to search the web for the latest AI breakthroughs.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {state.generatedNews.map(article => (
          <NewsCard 
            key={article.id} 
            article={article} 
            onArchive={handleArchive}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );

  const renderRepo = () => (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="py-6 border-b border-slate-800 mb-8 flex items-center gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Save className="text-purple-400" />
            Repository
          </h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Your curated collection of {state.repository.length} insights.
          </p>
        </div>
      </div>

      {state.repository.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-500">Repository is empty. Save items from the Daily Feed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {state.repository.map(article => (
            <NewsCard 
              key={article.id} 
              article={article} 
              isArchived={true}
              onDismiss={handleRemoveFromRepo} // Reusing onDismiss for remove from repo
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto">
       <div className="py-6 border-b border-slate-800 mb-8 flex items-center gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white">Source Configuration</h2>
      </div>
      
      <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Target Sources</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The AI Agent will prioritize information found via Google Search that originates from these platforms.
          <br />
          <span className="text-blue-400">Tip:</span> You can enter a <b>Name</b> (e.g. <i>"Hacker News"</i>) or a specific <b>URL</b> (e.g. <i>"arxiv.org"</i>).
        </p>

        <div className="space-y-3">
          {settings.customSources.map((source, idx) => (
             <div key={idx} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
               <span className="text-slate-200 truncate mr-2">{source}</span>
               <button 
                onClick={() => {
                  const newSources = settings.customSources.filter(s => s !== source);
                  handleUpdateSettings({...settings, customSources: newSources});
                }}
                className="text-slate-500 hover:text-red-400 shrink-0"
               >
                 <span className="text-xs">Remove</span>
               </button>
             </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
           <input 
             type="text" 
             id="newSourceInput"
             placeholder="Add Source..." 
             className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-0"
             onKeyDown={(e) => {
               if(e.key === 'Enter') {
                 const val = (e.target as HTMLInputElement).value;
                 if(val) {
                   handleUpdateSettings({...settings, customSources: [...settings.customSources, val]});
                   (e.target as HTMLInputElement).value = '';
                 }
               }
             }}
           />
           <button 
             onClick={() => {
               const input = document.getElementById('newSourceInput') as HTMLInputElement;
               if(input.value) {
                 handleUpdateSettings({...settings, customSources: [...settings.customSources, input.value]});
                 input.value = '';
               }
             }}
             className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm shrink-0"
           >
             Add
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar 
        currentUser={state.user}
        currentView={currentView} 
        onViewChange={setCurrentView}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="flex-1 w-full md:ml-80 p-4 md:p-8 transition-all">
        {currentView === 'feed' && renderFeed()}
        {currentView === 'repo' && renderRepo()}
        {currentView === 'settings' && renderSettings()}
      </main>
    </div>
  );
};

export default App;
