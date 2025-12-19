
import React from 'react';
import { Channel, PlaylistState } from '../types';
import ChannelList from './ChannelList';
import { Search, Filter, X, Star, Check, Tv } from 'lucide-react';

export interface SidebarProps {
  state: PlaylistState;
  onSearchChange: (query: string) => void;
  onLanguageChange: (lang: string) => void;
  onCategoryToggle: (category: string) => void;
  onClearCategories: () => void;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onToggleShowFavorites: () => void;
  selectedChannelId?: string;
  showCategoryFilter: boolean;
  setShowCategoryFilter: (show: boolean) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  state,
  onSearchChange,
  onLanguageChange,
  onCategoryToggle,
  onClearCategories,
  onSelectChannel,
  onToggleFavorite,
  onToggleShowFavorites,
  selectedChannelId,
  showCategoryFilter,
  setShowCategoryFilter,
  onClose,
  showCloseButton = false,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Tv className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">BagaBaga Tv</h1>
          </div>
          {showCloseButton && onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Language Selection */}
        <div className="mb-4">
           <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Select Language</label>
           <div className="flex flex-wrap gap-2">
             {state.languages.map(lang => (
               <button
                 key={lang}
                 onClick={() => onLanguageChange(lang)}
                 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                   state.selectedLanguage === lang
                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                     : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
                 }`}
               >
                 {lang}
               </button>
             ))}
           </div>
        </div>

        {/* Search & Action Buttons */}
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={state.showFavorites ? "Search favorites..." : "Search channels..."}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-500 text-slate-200"
              value={state.searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
          </div>
          
          <button
            onClick={onToggleShowFavorites}
            title={state.showFavorites ? "Show All" : "Show Favorites"}
            className={`relative p-2 rounded-xl border transition-all flex items-center justify-center w-10 h-10 ${
              state.showFavorites
                ? 'bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
             <Star className="h-5 w-5" fill={state.showFavorites ? "currentColor" : "none"} />
          </button>

          <button
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            title="Filter Categories"
            className={`relative p-2 rounded-xl border transition-all flex items-center justify-center w-10 h-10 ${
              showCategoryFilter 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Filter className="h-5 w-5" />
            {state.selectedCategories.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-slate-900"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content Area: Category List OR Channel List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative bg-black/20">
        {showCategoryFilter ? (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Categories</span>
                {state.selectedCategories.length > 0 && (
                    <button onClick={onClearCategories} className="text-xs text-red-400 hover:text-red-300 font-medium">Clear All</button>
                )}
            </div>
            {state.categories.length === 0 ? (
                <p className="text-center text-slate-500 py-4 text-sm">No categories available for this language</p>
            ) : (
                state.categories.map(cat => (
                    <label 
                       key={cat} 
                       className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                           state.selectedCategories.includes(cat) 
                             ? 'bg-indigo-900/20 border-indigo-500/50' 
                             : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                       }`}
                    >
                       <div className={`relative w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                           state.selectedCategories.includes(cat) 
                             ? 'bg-indigo-600 border-indigo-600' 
                             : 'bg-slate-800 border-slate-500'
                       }`}>
                           {state.selectedCategories.includes(cat) && (
                               <Check className="h-3.5 w-3.5 text-white" />
                           )}
                           <input 
                               type="checkbox" 
                               className="absolute inset-0 opacity-0 cursor-pointer"
                               checked={state.selectedCategories.includes(cat)}
                               onChange={() => onCategoryToggle(cat)}
                           />
                       </div>
                       <span className={`text-sm font-medium ${state.selectedCategories.includes(cat) ? 'text-white' : 'text-slate-300'}`}>{cat}</span>
                    </label>
                ))
            )}
            {/* Apply Button */}
            <div className="pt-4 pb-2">
                 <button 
                    onClick={() => setShowCategoryFilter(false)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
                 >
                    Done ({state.filteredChannels.length} Channels)
                 </button>
            </div>
          </div>
        ) : (
          // Channel List View
          state.loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium animate-pulse">Scanning frequencies...</p>
            </div>
          ) : state.error ? (
            <div className="p-4 text-center">
              <p className="text-red-400 text-sm mb-4">{state.error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg transition-colors"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
                <div className="mb-4 space-y-2 animate-in fade-in slide-in-from-top-1">
                    {state.showFavorites && (
                        <div className="flex items-center justify-between p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                                <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Favorites Only</span>
                            </div>
                            <span className="text-xs text-slate-500">{state.filteredChannels.length} results</span>
                        </div>
                    )}

                    {state.selectedCategories.length > 0 && (
                        <div>
                             <div className="w-full flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-500 font-medium">Active Filters:</span>
                                <button onClick={onClearCategories} className="text-[10px] text-indigo-400 hover:text-indigo-300">Clear</button>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                 {state.selectedCategories.map(cat => (
                                     <span key={cat} className="inline-flex items-center gap-1 bg-indigo-900/30 border border-indigo-500/30 text-indigo-200 text-xs px-2 py-1 rounded-md">
                                         {cat}
                                         <button onClick={() => onCategoryToggle(cat)} className="hover:text-white">
                                             <X className="h-3 w-3" />
                                         </button>
                                     </span>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                <ChannelList
                    channels={state.filteredChannels}
                    selectedChannelId={selectedChannelId}
                    onSelectChannel={onSelectChannel}
                    favorites={state.favorites}
                    onToggleFavorite={onToggleFavorite}
                />
            </>
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
