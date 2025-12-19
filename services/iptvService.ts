
import { Channel } from '../types';

const PLAYLISTS = [
  { url: 'https://iptv-org.github.io/iptv/languages/hin.m3u', lang: 'Hindi' },
  { url: 'https://iptv-org.github.io/iptv/languages/ben.m3u', lang: 'Bengali' },
  { url: 'https://iptv-org.github.io/iptv/languages/eng.m3u', lang: 'English' }
];

export const fetchAndParsePlaylist = async (): Promise<Channel[]> => {
  try {
    // Fetch all playlists in parallel
    const promises = PLAYLISTS.map(item => 
      fetch(item.url)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${item.url}`);
          return res.text();
        })
        .then(text => ({ text, lang: item.lang }))
        .catch(err => {
          console.warn(`Error loading playlist ${item.url}:`, err);
          return null; 
        })
    );
    
    const results = await Promise.all(promises);
    const channels: Channel[] = [];
    const seenIds = new Set<string>(); // To deduplicate channels
    
    results.forEach(result => {
      if (!result) return;
      
      const { text, lang } = result;
      const lines = text.split('\n');
      let currentChannel: Partial<Channel> = {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('#EXTINF:')) {
          // Extract metadata using regex
          const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
          const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
          const groupTitleMatch = line.match(/group-title="([^"]+)"/);
          
          // Extract name (last part after the last comma)
          const nameParts = line.split(',');
          const name = nameParts[nameParts.length - 1].trim();
          
          // Generate a fallback ID if tvg-id is missing
          const id = tvgIdMatch ? tvgIdMatch[1] : `gen-${Math.random().toString(36).substr(2, 9)}`;

          currentChannel = {
            id,
            logo: tvgLogoMatch ? tvgLogoMatch[1] : 'https://picsum.photos/200/200?blur=2',
            group: groupTitleMatch ? groupTitleMatch[1] : 'General',
            name: name || 'Unknown Channel',
            language: lang
          };
        } else if (line.startsWith('http') && !line.startsWith('#')) {
          currentChannel.url = line;
          
          if (currentChannel.name && currentChannel.url && currentChannel.id) {
            // Simple deduplication based on ID
            if (!seenIds.has(currentChannel.id)) {
              seenIds.add(currentChannel.id);
              channels.push(currentChannel as Channel);
            }
          }
          currentChannel = {};
        }
      }
    });
    
    return channels;
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
};
