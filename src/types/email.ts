export type EmailType = 'campaign_brief' | 'work_delivery' | 'client_response' | 'team_message' | 'reputation_bonus' | 'acquisition_offer' | 'hostile_takeover' | 'news_article' | 'family_message' | 'legal_notice' | 'hr_notice' | 'client_commendation';

export interface CampaignBrief {
  clientName: string;
  // Strategic Brief Fields
  challenge: string;
  audience: string;
  message: string;
  successMetrics: string[];
  budget: number;
  timeline: string;
  vibe: string;
  openEndedAsk: string;
  // Optional extras
  constraints?: string[];
  clientPersonality?: string;
}

export interface WorkDelivery {
  campaignName: string;
  completedItems: string[];
  attachments: { name: string; preview?: string }[];
}

export interface ClientResponse {
  campaignName: string;
  reaction: string;
  scores: { category: string; score: number }[];
  nextSteps: string;
}

export interface TeamMessage {
  characterName: string;
  mood: 'happy' | 'excited' | 'thoughtful' | 'tired' | 'neutral';
}

export interface ReputationBonus {
  eventType: string;
  campaignName?: string;
  reputationChange: number;
}

export interface Email {
  id: string;
  type: EmailType;
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  subject: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  isUrgent?: boolean;
  // Type-specific data
  campaignBrief?: CampaignBrief;
  workDelivery?: WorkDelivery;
  clientResponse?: ClientResponse;
  teamMessage?: TeamMessage;
  reputationBonus?: ReputationBonus;
}

export type EmailFilter = 'all' | 'unread' | 'starred' | 'campaign_brief' | 'team_message' | 'reputation_bonus';
export type EmailSort = 'date_desc' | 'date_asc' | 'sender';
