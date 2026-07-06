export interface GameType {
  id: string;
  created_at: string;
  organizer_id: string;
  sport_type: string;
  title: string;
  location_text: string;
  starts_at: string;
  max_participants: number;
  is_public: boolean;
}