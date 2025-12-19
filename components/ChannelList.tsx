
import React from 'react';
import { Channel } from '../types';
import { Star, Tv } from 'lucide-react';

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId?: string;
  onSelectChannel: (channel: Channel) => void;
  favorites: string[];
  onToggleFavorite: (channelId: string) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ 
  channels, 
  selectedChannelId, 
  onSelectChannel, 
  favorites, 
  onToggleFavorite 
}) => {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Tv className="h-12 w-12 mb-2 opacity-50" />
        <p>No channels found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
      {channels.map((channel) => {
        const isFavorite = favorites.includes(channel.id);
        return (
          <div
            key={`${channel.id}-${channel.name}`}
            className={`group relative flex items-center p-3 rounded-lg transition-all border ${
              selectedChannelId === channel.id
                ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-900/20'
                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600'
            }`}
          >
            <button
              onClick={() => onSelectChannel(channel)}
              className="flex-1 flex items-center gap-4 min-w-0 text-left"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-12 h-12 rounded object-contain bg-slate-900 p-1 border border-slate-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/200/200?grayscale';
                  }}
                />
                {selectedChannelId === channel.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className={`font-semibold truncate text-sm ${selectedChannelId === channel.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                  {channel.name}
                </h3>
                <span className="text-xs text-slate-500 block mt-0.5">{channel.group}</span>
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(channel.id);
              }}
              className={`ml-2 p-1.5 rounded-full transition-colors ${
                isFavorite 
                  ? 'text-yellow-400 hover:bg-yellow-400/10' 
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-700'
              }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ChannelList;
