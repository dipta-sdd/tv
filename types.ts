
export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  language: string;
}

export interface PlaylistState {
  channels: Channel[];
  filteredChannels: Channel[];
  categories: string[];
  languages: string[];
  selectedCategories: string[];
  selectedLanguage: string;
  searchQuery: string;
  favorites: string[];
  showFavorites: boolean;
  loading: boolean;
  error: string | null;
}
