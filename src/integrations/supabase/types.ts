export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          logo: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          logo: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo?: string
          created_at?: string
        }
      }
      competitions: {
        Row: {
          id: string
          name: string
          logo: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          logo: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo?: string
          created_at?: string
        }
      }
      match_highlights: {
        Row: {
          id: string
          title: string
          date: string
          thumbnail_url: string
          video_url: string
          duration: string
          views: number
          home_team_id: string
          away_team_id: string
          home_score: number
          away_score: number
          competition_id: string
          created_at: string
        }
        Insert: {
          id: string
          title: string
          date: string
          thumbnail_url: string
          video_url: string
          duration: string
          views: number
          home_team_id: string
          away_team_id: string
          home_score: number
          away_score: number
          competition_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          date?: string
          thumbnail_url?: string
          video_url?: string
          duration?: string
          views?: number
          home_team_id?: string
          away_team_id?: string
          home_score?: number
          away_score?: number
          competition_id?: string
          created_at?: string
        }
      }
      league_tables: {
        Row: {
          id: string
          team_id: string
          competition_id: string
          position: number
          played: number
          won: number
          drawn: number
          lost: number
          goals_for: number
          goals_against: number
          goal_difference: number
          points: number
          created_at: string
        }
        Insert: {
          id: string
          team_id: string
          competition_id: string
          position: number
          played: number
          won: number
          drawn: number
          lost: number
          goals_for: number
          goals_against: number
          goal_difference: number
          points: number
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          competition_id?: string
          position?: number
          played?: number
          won?: number
          drawn?: number
          lost?: number
          goals_for?: number
          goals_against?: number
          goal_difference?: number
          points?: number
          created_at?: string
        }
      }
      fixtures: {
        Row: {
          id: string
          home_team_id: string
          away_team_id: string
          date: string
          competition_id: string
          venue: string
          created_at: string
        }
        Insert: {
          id: string
          home_team_id: string
          away_team_id: string
          date: string
          competition_id: string
          venue: string
          created_at?: string
        }
        Update: {
          id?: string
          home_team_id?: string
          away_team_id?: string
          date?: string
          competition_id?: string
          venue?: string
          created_at?: string
        }
      }
      team_competitions: {
        Row: {
          id: string
          team_id: string
          competition_id: string
          created_at: string
        }
        Insert: {
          id: string
          team_id: string
          competition_id: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          competition_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
type Tables = Database['public']['Tables']

// Derived types for each table
export type Team = Tables['teams']['Row']
export type TeamInsert = Tables['teams']['Insert']
export type TeamUpdate = Tables['teams']['Update']

export type Competition = Tables['competitions']['Row']
export type CompetitionInsert = Tables['competitions']['Insert']
export type CompetitionUpdate = Tables['competitions']['Update']

export type MatchHighlight = Tables['match_highlights']['Row']
export type MatchHighlightInsert = Tables['match_highlights']['Insert']
export type MatchHighlightUpdate = Tables['match_highlights']['Update']

export type LeagueTable = Tables['league_tables']['Row']
export type LeagueTableInsert = Tables['league_tables']['Insert']
export type LeagueTableUpdate = Tables['league_tables']['Update']

export type Fixture = Tables['fixtures']['Row']
export type FixtureInsert = Tables['fixtures']['Insert']
export type FixtureUpdate = Tables['fixtures']['Update']

export type TeamCompetition = Tables['team_competitions']['Row']
export type TeamCompetitionInsert = Tables['team_competitions']['Insert']
export type TeamCompetitionUpdate = Tables['team_competitions']['Update']
