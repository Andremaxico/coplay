export type SportType = 'football' | 'basketball' | 'volleyball' | 'tennis' | 'other';

export interface OrganizerType {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface GameType {
  id: string;
  created_at: string;
  organizer_id: string;
  sport_type: SportType;
  title: string;
  location_text: string;
  starts_at: string;
  max_participants: number;
  current_participants?: number;
  is_public: boolean;
  organizer?: OrganizerType;
}

export interface UserMetadataType {
  avatar_data?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  telegram?: string;
  main_sport?: SportType;
}

export interface UserType {
  id?: string;
  email?: string | null;
  user_metadata?: UserMetadataType;
}