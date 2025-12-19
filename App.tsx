
import React, { useState, useEffect } from 'react';
import { Channel, PlaylistState } from './types';
import { fetchAndParsePlaylist } from './services/iptvService';
import VideoPlayer from './components/VideoPlayer';
import Sidebar, { SidebarProps } from './components/Sidebar';
import { Menu, Star, Wifi } from 'lucide-react';

const PREFS_KEY = 'zenith_prefs_v1';

const App: React.FC = () => {
  // Initialize state with default values, we'll merge saved prefs in useEffect
  const [state, setState] = useState<PlaylistState>({
    channels: [],
    filteredChannels: [],
    categories: [],
    languages: [],
    selectedCategories: [],
    selectedLanguage: 'All',
    searchQuery: '',
    favorites: [],
    showFavorites: false,
    loading: true,
    error: null,
  });

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  // Load preferences from local storage on mount
  useEffect(() => {
    const loadPrefs = () => {
      try {
        const saved = localStorage.getItem(PREFS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setState(prev => ({
            ...prev,
            selectedLanguage: parsed.selectedLanguage || 'All',
            selectedCategories: parsed.selectedCategories || [],
            searchQuery: parsed.searchQuery || '',
            favorites: parsed.favorites || [],
            showFavorites: parsed.showFavorites || false
          }));
        }
      } catch (e) {
        console.error("Failed to load preferences", e);
      }
    };
    loadPrefs();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const prefs = {
      selectedLanguage: state.selectedLanguage,
      selectedCategories: state.selectedCategories,
      searchQuery: state.searchQuery,
      favorites: state.favorites,
      showFavorites: state.showFavorites
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [state.selectedLanguage, state.selectedCategories, state.searchQuery, state.favorites, state.showFavorites]);

  // Init Playlist
  useEffect(() => {
    const initPlaylist = async () => {
      try {
        const channels = await fetchAndParsePlaylist();
        const categories = Array.from(new Set(channels.map(c => c.group))).sort();
        const languages = Array.from(new Set(channels.map(c => c.language))).sort();
        
        setState(prev => ({
          ...prev,
          channels,
          filteredChannels: channels,
          categories: categories,
          languages: ['All', ...languages],
          loading: false,
        }));
        
        // Auto-select first channel if none selected
        if (!selectedChannel && channels.length > 0) {
          setSelectedChannel(channels[0]);
        }
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load channels. Please try again later.',
        }));
      }
    };

    initPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Filtering Logic
  useEffect(() => {
    let filtered = state.channels;

    // Filter by Favorites
    if (state.showFavorites) {
       filtered = filtered.filter(c => state.favorites.includes(c.id));
    } else {
        // Only apply language filter if NOT showing favorites (or apply both if desired, but usually favorites overrides)
        // Let's allow filtering favorites by language/category as well
        if (state.selectedLanguage !== 'All') {
           filtered = filtered.filter(c => c.language === state.selectedLanguage);
        }
    }

    // Filter by Categories (Multi-select)
    if (state.selectedCategories.length > 0) {
      filtered = filtered.filter(c => state.selectedCategories.includes(c.group));
    }

    // Filter by Search
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.group.toLowerCase().includes(query)
      );
    }

    setState(prev => ({ ...prev, filteredChannels: filtered }));
  }, [state.selectedCategories, state.selectedLanguage, state.searchQuery, state.channels, state.showFavorites, state.favorites]);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    // On mobile, close sidebar when selecting
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setState(prev => {
        const relevantChannels = lang === 'All' 
            ? prev.channels 
            : prev.channels.filter(c => c.language === lang);
        
        const newCategories = Array.from(new Set(relevantChannels.map(c => c.group))).sort();
        
        return { 
            ...prev, 
            selectedLanguage: lang, 
            selectedCategories: [],
            categories: newCategories,
            showFavorites: false // Reset favorites view when changing language context potentially
        };
    });
  };

  const toggleCategory = (category: string) => {
    setState(prev => {
      const isSelected = prev.selectedCategories.includes(category);
      if (isSelected) {
        return { ...prev, selectedCategories: prev.selectedCategories.filter(c => c !== category) };
      } else {
        return { ...prev, selectedCategories: [...prev.selectedCategories, category] };
      }
    });
  };

  const clearCategories = () => setState(prev => ({ ...prev, selectedCategories: [] }));

  const toggleFavorite = (id: string) => {
      setState(prev => {
          const isFav = prev.favorites.includes(id);
          const newFavorites = isFav 
             ? prev.favorites.filter(fid => fid !== id)
             : [...prev.favorites, id];
          return { ...prev, favorites: newFavorites };
      });
  };

  const toggleShowFavorites = () => {
      setState(prev => ({ ...prev, showFavorites: !prev.showFavorites }));
  };

  // Create common props for Sidebar to reuse in both main view and video player
  // NOTE: removed isOpen as it's not in SidebarProps
  const sidebarProps: Omit<SidebarProps, 'onClose'> = {
    state,
    onSearchChange: (q) => setState(prev => ({ ...prev, searchQuery: q })),
    onLanguageChange: handleLanguageChange,
    onCategoryToggle: toggleCategory,
    onClearCategories: clearCategories,
    onSelectChannel: handleSelectChannel,
    onToggleFavorite: toggleFavorite,
    onToggleShowFavorites: toggleShowFavorites,
    selectedChannelId: selectedChannel?.id,
    showCategoryFilter,
    setShowCategoryFilter
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
           {...sidebarProps}
           onClose={() => setIsSidebarOpen(false)}
           showCloseButton={true}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Navbar (Mobile Only) */}
        <header className="lg:hidden p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold">BagaBaga Tv</h1>
          </div>
          {selectedChannel && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-500 font-medium animate-pulse">LIVE</span>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 flex flex-col gap-8 overflow-y-auto">
          {/* Player Container */}
          <div className="w-full h-full flex flex-col">
            <VideoPlayer 
                channel={selectedChannel} 
                sidebarProps={sidebarProps}
            />
            
            {selectedChannel && (
              <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-4">
                  <img src={selectedChannel.logo} alt={selectedChannel.name} className="h-16 w-16 object-contain bg-slate-950 p-2 rounded-xl border border-slate-800" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">{selectedChannel.name}</h2>
                      <span className="bg-red-600/10 text-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-600/20">LIVE</span>
                      {state.favorites.includes(selectedChannel.id) && (
                         <span className="text-yellow-500">
                             <Star className="h-5 w-5" fill="currentColor" />
                         </span>
                      )}
                    </div>
                    <p className="text-slate-400 font-medium">{selectedChannel.language} • {selectedChannel.group} • HD</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-500 mb-1">Status</span>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 text-sm font-semibold">
                        <Wifi className="h-3 w-3" />
                        Connected
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
