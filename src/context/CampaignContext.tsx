import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  Campaign,
  Deliverable,
  DeliverableType,
  Platform,
  DeliverableStatus,
  GeneratedWork,
  CampaignConcept,
  CampaignPhase,
} from '../types/campaign';
import { calculateTeamCost, getProductionCost } from '../types/campaign';
import type { CampaignBrief } from '../types/email';
import { generateConcepts as generateConceptsFromBrief, tweakConcept as tweakConceptAPI } from '../utils/conceptGenerator';
import { generateDeliverable as generateDeliverableAI } from '../utils/apiService';

// State
interface CampaignState {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  isGenerating: boolean;
  generatingDeliverableId: string | null;
  isGeneratingConcepts: boolean;
}

// Actions
type CampaignAction =
  | { type: 'CREATE_CAMPAIGN'; payload: { briefId: string; clientName: string; campaignName: string; brief: CampaignBrief; budget: number; deadline: Date } }
  | { type: 'SELECT_CAMPAIGN'; payload: { campaignId: string | null } }
  | { type: 'SET_CONCEPTING_TEAM'; payload: { campaignId: string; memberIds: string[] } }
  | { type: 'SET_STRATEGIC_DIRECTION'; payload: { campaignId: string; direction: string } }
  | { type: 'START_GENERATING_CONCEPTS'; payload: { campaignId: string } }
  | { type: 'SET_GENERATED_CONCEPTS'; payload: { campaignId: string; concepts: CampaignConcept[] } }
  | { type: 'SELECT_CONCEPT'; payload: { campaignId: string; conceptId: string } }
  | { type: 'START_CAMPAIGN_GENERATION'; payload: { campaignId: string; deliverables?: Deliverable[] } }
  | { type: 'SET_DELIVERABLE_GENERATED'; payload: { campaignId: string; deliverableId: string; work: GeneratedWork } }
  | { type: 'FINISH_CAMPAIGN_GENERATION'; payload: { campaignId: string } }
  | { type: 'APPROVE_IN_REVIEW'; payload: { campaignId: string; deliverableId: string } }
  | { type: 'FLAG_IN_REVIEW'; payload: { campaignId: string; deliverableId: string; feedback: string } }
  | { type: 'START_REVISIONS'; payload: { campaignId: string } }
  | { type: 'FINISH_REVISIONS'; payload: { campaignId: string } }
  | { type: 'FINISH_REVIEW'; payload: { campaignId: string } }
  | { type: 'ADD_DELIVERABLE'; payload: { campaignId: string; deliverable: Omit<Deliverable, 'id' | 'assignedTeam' | 'status' | 'productionCost' | 'generatedWork'> } }
  | { type: 'UPDATE_DELIVERABLE'; payload: { campaignId: string; deliverableId: string; updates: Partial<Deliverable> } }
  | { type: 'REMOVE_DELIVERABLE'; payload: { campaignId: string; deliverableId: string } }
  | { type: 'ASSIGN_TEAM'; payload: { campaignId: string; deliverableId: string; memberIds: string[] } }
  | { type: 'START_GENERATING'; payload: { deliverableId: string } }
  | { type: 'FINISH_GENERATING'; payload: { campaignId: string; deliverableId: string; work: GeneratedWork } }
  | { type: 'UPDATE_DELIVERABLE_STATUS'; payload: { campaignId: string; deliverableId: string; status: DeliverableStatus; feedback?: string } }
  | { type: 'SUBMIT_CAMPAIGN'; payload: { campaignId: string } }
  | { type: 'COMPLETE_CAMPAIGN'; payload: { campaignId: string; score: number; feedback: string } }
  | { type: 'SET_DELIVERABLE_GENERATION_FAILED'; payload: { campaignId: string; deliverableId: string; error: string } }
  | { type: 'UPDATE_CONCEPT'; payload: { campaignId: string; conceptId: string; concept: CampaignConcept } }
  | { type: 'RECORD_TOOL_USED'; payload: { campaignId: string; toolId: string } }
  | { type: 'SET_PRODUCTION_TEAM'; payload: { campaignId: string; memberIds: string[] } };

// Initial state
const initialState: CampaignState = {
  campaigns: [],
  selectedCampaignId: null,
  isGenerating: false,
  generatingDeliverableId: null,
  isGeneratingConcepts: false,
};

// Reducer
function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case 'CREATE_CAMPAIGN': {
      const { briefId, clientName, campaignName, brief, budget, deadline } = action.payload;
      const newCampaign: Campaign = {
        id: `campaign-${Date.now()}`,
        briefId,
        clientName,
        campaignName,
        brief,
        clientBudget: budget,
        teamFee: 0,
        productionBudget: budget,
        productionSpent: 0,
        startDate: new Date(),
        deadline,
        phase: 'concepting',
        conceptingTeam: null,
        strategicDirection: '',
        generatedConcepts: [],
        selectedConceptId: null,
        deliverables: [],
      };
      return {
        ...state,
        campaigns: [...state.campaigns, newCampaign],
        selectedCampaignId: newCampaign.id,
      };
    }

    case 'SELECT_CAMPAIGN':
      return {
        ...state,
        selectedCampaignId: action.payload.campaignId,
      };

    case 'SET_CONCEPTING_TEAM': {
      const { campaignId, memberIds } = action.payload;
      const cost = calculateTeamCost(memberIds.length);
      return {
        ...state,
        campaigns: state.campaigns.map(campaign => {
          if (campaign.id !== campaignId) return campaign;
          return {
            ...campaign,
            conceptingTeam: memberIds.length > 0 ? { memberIds, cost } : null,
            teamFee: cost,
            productionBudget: campaign.clientBudget - cost,
          };
        }),
      };
    }

    case 'SET_STRATEGIC_DIRECTION': {
      const { campaignId, direction } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, strategicDirection: direction }
            : campaign
        ),
      };
    }

    case 'START_GENERATING_CONCEPTS': {
      const { campaignId } = action.payload;
      return {
        ...state,
        isGeneratingConcepts: true,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, phase: 'concepting' as CampaignPhase }
            : campaign
        ),
      };
    }

    case 'SET_GENERATED_CONCEPTS': {
      const { campaignId, concepts } = action.payload;
      return {
        ...state,
        isGeneratingConcepts: false,
        campaigns: state.campaigns.map(campaign => {
          if (campaign.id !== campaignId) return campaign;
          // Only advance to 'selecting' if we actually got concepts back.
          // Empty array = API failure / early return — stay on 'concepting' so user can retry.
          if (concepts.length === 0) return { ...campaign, generatedConcepts: [] };
          return { ...campaign, generatedConcepts: concepts, phase: 'selecting' as CampaignPhase };
        }),
      };
    }

    case 'SELECT_CONCEPT': {
      const { campaignId, conceptId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, selectedConceptId: conceptId }
            : campaign
        ),
      };
    }

    case 'START_CAMPAIGN_GENERATION': {
      const { campaignId, deliverables: preBuiltDeliverables } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign => {
          if (campaign.id !== campaignId) return campaign;
          // Use pre-built deliverables if provided, otherwise build from concept
          const finalDeliverables = preBuiltDeliverables || (() => {
            const selectedConcept = campaign.generatedConcepts.find(c => c.id === campaign.selectedConceptId);
            return selectedConcept?.suggestedDeliverables.flatMap(
              (suggestion, index) => {
                return Array.from({ length: suggestion.quantity }, (_, i) => ({
                  id: `del-${Date.now()}-${index}-${i}`,
                  type: suggestion.type,
                  platform: suggestion.platform,
                  description: suggestion.description,
                  assignedTeam: campaign.conceptingTeam,
                  status: 'not_started' as DeliverableStatus,
                  productionCost: getProductionCost(suggestion.type),
                  generatedWork: null,
                  suggested: true,
                }));
              }
            ) || [];
          })();
          const totalProductionCost = finalDeliverables.reduce((sum, d) => sum + d.productionCost, 0);
          return {
            ...campaign,
            phase: 'generating' as CampaignPhase,
            deliverables: finalDeliverables,
            productionSpent: totalProductionCost,
          };
        }),
      };
    }

    case 'SET_DELIVERABLE_GENERATED': {
      const { campaignId, deliverableId, work } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                deliverables: campaign.deliverables.map(del =>
                  del.id === deliverableId
                    ? { ...del, generatedWork: work, status: 'ready_for_review' as DeliverableStatus }
                    : del
                ),
              }
            : campaign
        ),
      };
    }

    case 'FINISH_CAMPAIGN_GENERATION': {
      const { campaignId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, phase: 'reviewing' as CampaignPhase }
            : campaign
        ),
      };
    }

    case 'APPROVE_IN_REVIEW': {
      const { campaignId, deliverableId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                deliverables: campaign.deliverables.map(del =>
                  del.id === deliverableId
                    ? { ...del, status: 'approved' as DeliverableStatus }
                    : del
                ),
              }
            : campaign
        ),
      };
    }

    case 'FLAG_IN_REVIEW': {
      const { campaignId, deliverableId, feedback } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                deliverables: campaign.deliverables.map(del =>
                  del.id === deliverableId
                    ? {
                        ...del,
                        status: 'needs_revision' as DeliverableStatus,
                        generatedWork: del.generatedWork
                          ? { ...del.generatedWork, feedback }
                          : null,
                      }
                    : del
                ),
              }
            : campaign
        ),
      };
    }

    case 'START_REVISIONS': {
      const { campaignId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, phase: 'generating' as CampaignPhase }
            : campaign
        ),
      };
    }

    case 'FINISH_REVISIONS': {
      const { campaignId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, phase: 'reviewing' as CampaignPhase }
            : campaign
        ),
      };
    }

    case 'FINISH_REVIEW': {
      const { campaignId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, phase: 'executing' as CampaignPhase }
            : campaign
        ),
      };
    }

    case 'ADD_DELIVERABLE': {
      const { campaignId, deliverable } = action.payload;
      const cost = getProductionCost(deliverable.type);
      const newDeliverable: Deliverable = {
        ...deliverable,
        id: `del-${Date.now()}`,
        assignedTeam: null,
        status: 'not_started',
        productionCost: cost,
        generatedWork: null,
      };
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, deliverables: [...campaign.deliverables, newDeliverable], productionSpent: campaign.productionSpent + cost }
            : campaign
        ),
      };
    }

    case 'UPDATE_DELIVERABLE': {
      const { campaignId, deliverableId, updates } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                deliverables: campaign.deliverables.map(del =>
                  del.id === deliverableId ? { ...del, ...updates } : del
                ),
              }
            : campaign
        ),
      };
    }

    case 'REMOVE_DELIVERABLE': {
      const { campaignId, deliverableId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign => {
          if (campaign.id !== campaignId) return campaign;
          const deliverable = campaign.deliverables.find(d => d.id === deliverableId);
          const costToRefund = deliverable?.productionCost || 0;
          return {
            ...campaign,
            deliverables: campaign.deliverables.filter(del => del.id !== deliverableId),
            productionSpent: campaign.productionSpent - costToRefund,
          };
        }),
      };
    }

    case 'ASSIGN_TEAM': {
      const { campaignId, deliverableId, memberIds } = action.payload;
      const cost = calculateTeamCost(memberIds.length);
      return {
        ...state,
        campaigns: state.campaigns.map(campaign => {
          if (campaign.id !== campaignId) return campaign;
          return {
            ...campaign,
            deliverables: campaign.deliverables.map(del =>
              del.id === deliverableId
                ? {
                    ...del,
                    assignedTeam: memberIds.length > 0 ? { memberIds, cost } : null,
                  }
                : del
            ),
          };
        }),
      };
    }

    case 'START_GENERATING':
      return {
        ...state,
        isGenerating: true,
        generatingDeliverableId: action.payload.deliverableId,
      };

    case 'FINISH_GENERATING': {
      const { campaignId, deliverableId, work } = action.payload;
      return {
        ...state,
        isGenerating: false,
        generatingDeliverableId: null,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                deliverables: campaign.deliverables.map(del =>
                  del.id === deliverableId
                    ? { ...del, generatedWork: work, status: 'ready_for_review' as DeliverableStatus }
                    : del
                ),
              }
            : campaign
        ),
      };
    }

    case 'UPDATE_DELIVERABLE_STATUS': {
      const { campaignId, deliverableId, status, feedback } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                deliverables: campaign.deliverables.map(del =>
                  del.id === deliverableId
                    ? {
                        ...del,
                        status,
                        generatedWork: del.generatedWork && feedback
                          ? { ...del.generatedWork, feedback }
                          : del.generatedWork,
                      }
                    : del
                ),
              }
            : campaign
        ),
      };
    }

    case 'SUBMIT_CAMPAIGN': {
      const { campaignId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? { ...campaign, phase: 'submitted', submittedAt: new Date() }
            : campaign
        ),
      };
    }

    case 'COMPLETE_CAMPAIGN': {
      const { campaignId, score, feedback } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                phase: 'completed',
                clientScore: score,
                clientFeedback: feedback,
              }
            : campaign
        ),
      };
    }

    case 'SET_DELIVERABLE_GENERATION_FAILED': {
      const { campaignId, deliverableId, error } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                deliverables: campaign.deliverables.map(del =>
                  del.id === deliverableId
                    ? { ...del, status: 'generation_failed' as DeliverableStatus, generationError: error }
                    : del
                ),
              }
            : campaign
        ),
      };
    }

    case 'UPDATE_CONCEPT': {
      const { campaignId, conceptId, concept } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId
            ? {
                ...campaign,
                generatedConcepts: campaign.generatedConcepts.map(c =>
                  c.id === conceptId ? concept : c
                ),
              }
            : campaign
        ),
      };
    }

    case 'RECORD_TOOL_USED': {
      const { campaignId, toolId } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign => {
          if (campaign.id !== campaignId) return campaign;
          const already = campaign.toolsUsed?.includes(toolId);
          return already ? campaign : {
            ...campaign,
            toolsUsed: [...(campaign.toolsUsed || []), toolId],
          };
        }),
      };
    }

    case 'SET_PRODUCTION_TEAM': {
      const { campaignId, memberIds } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map(campaign => {
          if (campaign.id !== campaignId) return campaign;
          const conceptingCount = campaign.conceptingTeam?.memberIds.length || 0;
          const totalCount = conceptingCount + memberIds.length;
          const newTeamFee = calculateTeamCost(totalCount);
          return {
            ...campaign,
            productionTeam: memberIds.length > 0
              ? { memberIds, cost: newTeamFee - calculateTeamCost(conceptingCount) }
              : null,
            teamFee: newTeamFee,
            productionBudget: campaign.clientBudget - newTeamFee,
          };
        }),
      };
    }

    default:
      return state;
  }
}

// Context
interface CampaignContextValue extends CampaignState {
  createCampaign: (briefId: string, clientName: string, campaignName: string, brief: CampaignBrief, budget: number, deadline: Date) => void;
  selectCampaign: (campaignId: string | null) => void;
  setConceptingTeam: (campaignId: string, memberIds: string[]) => void;
  setStrategicDirection: (campaignId: string, direction: string) => void;
  generateConcepts: (campaignId: string) => Promise<void>;
  tweakConcept: (campaignId: string, conceptId: string, tweakNote: string) => Promise<void>;
  selectConcept: (campaignId: string, conceptId: string) => void;
  setProductionTeam: (campaignId: string, memberIds: string[]) => void;
  generateCampaignDeliverables: (campaignId: string, productionMemberIds?: string[]) => Promise<void>;
  approveInReview: (campaignId: string, deliverableId: string) => void;
  flagInReview: (campaignId: string, deliverableId: string, feedback: string) => void;
  requestRevisions: (campaignId: string) => Promise<void>;
  finishReview: (campaignId: string) => void;
  generatingProgress: { current: number; total: number } | null;
  addDeliverable: (campaignId: string, type: DeliverableType, platform: Platform, description: string, creativeDirection?: string) => void;
  updateDeliverable: (campaignId: string, deliverableId: string, updates: Partial<Deliverable>) => void;
  removeDeliverable: (campaignId: string, deliverableId: string) => void;
  assignTeam: (campaignId: string, deliverableId: string, memberIds: string[]) => void;
  generateWork: (campaignId: string, deliverableId: string) => Promise<void>;
  approveDeliverable: (campaignId: string, deliverableId: string) => void;
  requestRevision: (campaignId: string, deliverableId: string, feedback: string) => void;
  submitCampaign: (campaignId: string) => Promise<void>;
  completeCampaign: (campaignId: string, score: number, feedback: string) => void;
  getSelectedCampaign: () => Campaign | null;
  getCampaign: (campaignId: string) => Campaign | undefined;
  getActiveCampaigns: () => Campaign[];
  canSubmitCampaign: (campaignId: string) => boolean;
  getProductionBudgetRemaining: (campaignId: string) => number;
  canAffordTeam: (campaignId: string, teamSize: number) => boolean;
  retryDeliverableGeneration: (campaignId: string, deliverableId: string) => Promise<void>;
  recordToolUsed: (campaignId: string, toolId: string) => void;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

// Provider
interface CampaignProviderProps {
  children: React.ReactNode;
}

export function CampaignProvider({ children }: CampaignProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(campaignReducer, initialState);
  const [generatingProgress, setGeneratingProgress] = React.useState<{ current: number; total: number } | null>(null);

  const createCampaign = useCallback((
    briefId: string,
    clientName: string,
    campaignName: string,
    brief: CampaignBrief,
    budget: number,
    deadline: Date
  ) => {
    dispatch({ type: 'CREATE_CAMPAIGN', payload: { briefId, clientName, campaignName, brief, budget, deadline } });
  }, []);

  const selectCampaign = useCallback((campaignId: string | null) => {
    dispatch({ type: 'SELECT_CAMPAIGN', payload: { campaignId } });
  }, []);

  const setConceptingTeam = useCallback((campaignId: string, memberIds: string[]) => {
    dispatch({ type: 'SET_CONCEPTING_TEAM', payload: { campaignId, memberIds } });
  }, []);

  const setStrategicDirection = useCallback((campaignId: string, direction: string) => {
    dispatch({ type: 'SET_STRATEGIC_DIRECTION', payload: { campaignId, direction } });
  }, []);

  const generateConcepts = useCallback(async (campaignId: string) => {
    dispatch({ type: 'START_GENERATING_CONCEPTS', payload: { campaignId } });

    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign || !campaign.conceptingTeam) {
      // Dispatch reset so isGeneratingConcepts doesn't stay stuck at true
      dispatch({ type: 'SET_GENERATED_CONCEPTS', payload: { campaignId, concepts: [] } });
      return;
    }

    try {
      // Call Claude API to generate concepts from player direction
      const concepts = await generateConceptsFromBrief(campaign);
      dispatch({ type: 'SET_GENERATED_CONCEPTS', payload: { campaignId, concepts } });
    } catch (error) {
      console.error('Concept generation failed:', error);
      // Reset state so player can retry
      dispatch({ type: 'SET_GENERATED_CONCEPTS', payload: { campaignId, concepts: [] } });
    }
  }, [state.campaigns]);

  const tweakConcept = useCallback(async (campaignId: string, conceptId: string, tweakNote: string) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const concept = campaign.generatedConcepts.find(c => c.id === conceptId);
    if (!concept) return;

    const tweaked = await tweakConceptAPI(concept, tweakNote, campaign);
    dispatch({ type: 'UPDATE_CONCEPT', payload: { campaignId, conceptId, concept: tweaked } });
  }, [state.campaigns]);

  const selectConcept = useCallback((campaignId: string, conceptId: string) => {
    dispatch({ type: 'SELECT_CONCEPT', payload: { campaignId, conceptId } });
  }, []);

  const setProductionTeam = useCallback((campaignId: string, memberIds: string[]) => {
    dispatch({ type: 'SET_PRODUCTION_TEAM', payload: { campaignId, memberIds } });
  }, []);

  const generateCampaignDeliverables = useCallback(async (campaignId: string, productionMemberIds?: string[]) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const selectedConcept = campaign.generatedConcepts.find(c => c.id === campaign.selectedConceptId);
    if (!selectedConcept) return;

    // Merge concepting + production teams
    const conceptingIds = campaign.conceptingTeam?.memberIds || [];
    const prodIds = productionMemberIds || [];
    const allMemberIds = [...conceptingIds, ...prodIds];
    const mergedTeam = allMemberIds.length > 0
      ? { memberIds: allMemberIds, cost: calculateTeamCost(allMemberIds.length) }
      : campaign.conceptingTeam;

    // Build deliverables list ONCE, shared between reducer and async loop
    const deliverables: Deliverable[] = selectedConcept.suggestedDeliverables.flatMap(
      (suggestion, index) => Array.from({ length: suggestion.quantity }, (_, i) => ({
        id: `del-${Date.now()}-${index}-${i}`,
        type: suggestion.type,
        platform: suggestion.platform,
        description: suggestion.description,
        assignedTeam: mergedTeam,
        status: 'not_started' as DeliverableStatus,
        productionCost: getProductionCost(suggestion.type),
        generatedWork: null,
        suggested: true,
      }))
    );

    // Pass pre-built deliverables to reducer so IDs match
    console.log('[AgencyRPG] Starting generation for', deliverables.length, 'deliverables');
    dispatch({ type: 'START_CAMPAIGN_GENERATION', payload: { campaignId, deliverables } });

    setGeneratingProgress({ current: 0, total: deliverables.length });

    // Generate content for each deliverable via AI
    for (let i = 0; i < deliverables.length; i++) {
      setGeneratingProgress({ current: i, total: deliverables.length });

      try {
        console.log(`[AgencyRPG] Generating deliverable ${i + 1}/${deliverables.length}: ${deliverables[i].type} (${deliverables[i].id})`);
        const result = await generateDeliverableAI(
          deliverables[i],
          campaign,
          selectedConcept!
        );

        console.log(`[AgencyRPG] ✓ Got result for ${deliverables[i].type}, content length: ${result.content.length}, hasImage: ${!!result.imageUrl}`);
        const work: GeneratedWork = {
          id: `work-${Date.now()}-${i}`,
          content: result.content,
          preview: result.preview,
          imageUrl: result.imageUrl,
          generatedAt: new Date(),
          revisionNumber: 1,
        };
        dispatch({ type: 'SET_DELIVERABLE_GENERATED', payload: { campaignId, deliverableId: deliverables[i].id, work } });
      } catch (error) {
        console.error(`[AgencyRPG] ✗ Deliverable generation failed for ${deliverables[i].type}:`, error);
        dispatch({
          type: 'SET_DELIVERABLE_GENERATION_FAILED',
          payload: {
            campaignId,
            deliverableId: deliverables[i].id,
            error: error instanceof Error ? error.message : 'Generation failed',
          },
        });
      }

      setGeneratingProgress({ current: i + 1, total: deliverables.length });
    }

    console.log('[AgencyRPG] Generation complete, transitioning to review');
    setGeneratingProgress(null);
    dispatch({ type: 'FINISH_CAMPAIGN_GENERATION', payload: { campaignId } });
  }, [state.campaigns]);

  const approveInReview = useCallback((campaignId: string, deliverableId: string) => {
    dispatch({ type: 'APPROVE_IN_REVIEW', payload: { campaignId, deliverableId } });
  }, []);

  const flagInReview = useCallback((campaignId: string, deliverableId: string, feedback: string) => {
    dispatch({ type: 'FLAG_IN_REVIEW', payload: { campaignId, deliverableId, feedback } });
  }, []);

  const requestRevisions = useCallback(async (campaignId: string) => {
    dispatch({ type: 'START_REVISIONS', payload: { campaignId } });

    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const selectedConcept = campaign.generatedConcepts.find(c => c.id === campaign.selectedConceptId);
    const flaggedDeliverables = campaign.deliverables.filter(d => d.status === 'needs_revision');

    setGeneratingProgress({ current: 0, total: flaggedDeliverables.length });

    for (let i = 0; i < flaggedDeliverables.length; i++) {
      setGeneratingProgress({ current: i, total: flaggedDeliverables.length });

      const del = flaggedDeliverables[i];
      try {
        const result = await generateDeliverableAI(
          del,
          campaign,
          selectedConcept!,
          del.generatedWork?.feedback
        );

        const work: GeneratedWork = {
          id: `work-${Date.now()}-rev-${i}`,
          content: result.content,
          preview: result.preview,
          imageUrl: result.imageUrl,
          generatedAt: new Date(),
          revisionNumber: (del.generatedWork?.revisionNumber || 0) + 1,
        };
        dispatch({ type: 'SET_DELIVERABLE_GENERATED', payload: { campaignId, deliverableId: del.id, work } });
      } catch (error) {
        dispatch({
          type: 'SET_DELIVERABLE_GENERATION_FAILED',
          payload: {
            campaignId,
            deliverableId: del.id,
            error: error instanceof Error ? error.message : 'Revision failed',
          },
        });
      }

      setGeneratingProgress({ current: i + 1, total: flaggedDeliverables.length });
    }

    setGeneratingProgress(null);
    dispatch({ type: 'FINISH_REVISIONS', payload: { campaignId } });
  }, [state.campaigns]);

  const finishReview = useCallback((campaignId: string) => {
    dispatch({ type: 'FINISH_REVIEW', payload: { campaignId } });
  }, []);

  const addDeliverable = useCallback((
    campaignId: string,
    type: DeliverableType,
    platform: Platform,
    description: string,
    creativeDirection?: string
  ) => {
    dispatch({
      type: 'ADD_DELIVERABLE',
      payload: { campaignId, deliverable: { type, platform, description, creativeDirection } },
    });
  }, []);

  const updateDeliverable = useCallback((
    campaignId: string,
    deliverableId: string,
    updates: Partial<Deliverable>
  ) => {
    dispatch({ type: 'UPDATE_DELIVERABLE', payload: { campaignId, deliverableId, updates } });
  }, []);

  const removeDeliverable = useCallback((campaignId: string, deliverableId: string) => {
    dispatch({ type: 'REMOVE_DELIVERABLE', payload: { campaignId, deliverableId } });
  }, []);

  const assignTeam = useCallback((campaignId: string, deliverableId: string, memberIds: string[]) => {
    dispatch({ type: 'ASSIGN_TEAM', payload: { campaignId, deliverableId, memberIds } });
  }, []);

  const generateWork = useCallback(async (campaignId: string, deliverableId: string) => {
    dispatch({ type: 'START_GENERATING', payload: { deliverableId } });

    const campaign = state.campaigns.find(c => c.id === campaignId);
    const deliverable = campaign?.deliverables.find(d => d.id === deliverableId);
    const selectedConcept = campaign?.generatedConcepts.find(c => c.id === campaign.selectedConceptId);

    if (deliverable && campaign && selectedConcept) {
      try {
        const result = await generateDeliverableAI(
          deliverable,
          campaign,
          selectedConcept,
          deliverable.generatedWork?.feedback
        );

        const work: GeneratedWork = {
          id: `work-${Date.now()}`,
          content: result.content,
          preview: result.preview,
          imageUrl: result.imageUrl,
          generatedAt: new Date(),
          revisionNumber: (deliverable.generatedWork?.revisionNumber || 0) + 1,
        };
        dispatch({ type: 'FINISH_GENERATING', payload: { campaignId, deliverableId, work } });
      } catch (error) {
        dispatch({
          type: 'SET_DELIVERABLE_GENERATION_FAILED',
          payload: {
            campaignId,
            deliverableId,
            error: error instanceof Error ? error.message : 'Generation failed',
          },
        });
      }
    }
  }, [state.campaigns]);

  const approveDeliverable = useCallback((campaignId: string, deliverableId: string) => {
    dispatch({
      type: 'UPDATE_DELIVERABLE_STATUS',
      payload: { campaignId, deliverableId, status: 'approved' },
    });
  }, []);

  const requestRevision = useCallback((campaignId: string, deliverableId: string, feedback: string) => {
    dispatch({
      type: 'UPDATE_DELIVERABLE_STATUS',
      payload: { campaignId, deliverableId, status: 'needs_revision', feedback },
    });
  }, []);

  const submitCampaign = useCallback(async (campaignId: string) => {
    dispatch({ type: 'SUBMIT_CAMPAIGN', payload: { campaignId } });
    // Note: No longer auto-completing - CampaignWorkspace handles scoring via ReputationContext
  }, []);

  const completeCampaign = useCallback((campaignId: string, score: number, feedback: string) => {
    dispatch({ type: 'COMPLETE_CAMPAIGN', payload: { campaignId, score, feedback } });
  }, []);

  const getSelectedCampaign = useCallback(() => {
    if (!state.selectedCampaignId) return null;
    return state.campaigns.find(c => c.id === state.selectedCampaignId) || null;
  }, [state.selectedCampaignId, state.campaigns]);

  const getCampaign = useCallback((campaignId: string) => {
    return state.campaigns.find(c => c.id === campaignId);
  }, [state.campaigns]);

  const getActiveCampaigns = useCallback(() => {
    return state.campaigns.filter(c => c.phase !== 'completed');
  }, [state.campaigns]);

  const canSubmitCampaign = useCallback((campaignId: string) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign || campaign.deliverables.length === 0) return false;
    return campaign.deliverables.every(d => d.status === 'approved');
  }, [state.campaigns]);

  const getProductionBudgetRemaining = useCallback((campaignId: string) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return 0;
    return campaign.productionBudget - campaign.productionSpent;
  }, [state.campaigns]);

  const retryDeliverableGeneration = useCallback(async (campaignId: string, deliverableId: string) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const deliverable = campaign.deliverables.find(d => d.id === deliverableId);
    const selectedConcept = campaign.generatedConcepts.find(c => c.id === campaign.selectedConceptId);
    if (!deliverable || !selectedConcept) return;

    // Reset error state
    dispatch({ type: 'UPDATE_DELIVERABLE', payload: { campaignId, deliverableId, updates: { status: 'in_progress', generationError: undefined } } });

    try {
      const result = await generateDeliverableAI(
        deliverable,
        campaign,
        selectedConcept,
        deliverable.generatedWork?.feedback
      );

      const work: GeneratedWork = {
        id: `work-${Date.now()}-retry`,
        content: result.content,
        preview: result.preview,
        imageUrl: result.imageUrl,
        generatedAt: new Date(),
        revisionNumber: (deliverable.generatedWork?.revisionNumber || 0) + 1,
      };
      dispatch({ type: 'SET_DELIVERABLE_GENERATED', payload: { campaignId, deliverableId, work } });
    } catch (error) {
      dispatch({
        type: 'SET_DELIVERABLE_GENERATION_FAILED',
        payload: {
          campaignId,
          deliverableId,
          error: error instanceof Error ? error.message : 'Retry failed',
        },
      });
    }
  }, [state.campaigns]);

  const recordToolUsed = useCallback((campaignId: string, toolId: string) => {
    dispatch({ type: 'RECORD_TOOL_USED', payload: { campaignId, toolId } });
  }, []);

  const canAffordTeam = useCallback((campaignId: string, teamSize: number) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return false;
    const cost = calculateTeamCost(teamSize);
    return cost <= campaign.clientBudget;
  }, [state.campaigns]);

  const value: CampaignContextValue = {
    ...state,
    createCampaign,
    selectCampaign,
    setConceptingTeam,
    setStrategicDirection,
    generateConcepts,
    tweakConcept,
    selectConcept,
    setProductionTeam,
    generateCampaignDeliverables,
    approveInReview,
    flagInReview,
    requestRevisions,
    finishReview,
    generatingProgress,
    addDeliverable,
    updateDeliverable,
    removeDeliverable,
    assignTeam,
    generateWork,
    approveDeliverable,
    requestRevision,
    submitCampaign,
    completeCampaign,
    getSelectedCampaign,
    getCampaign,
    getActiveCampaigns,
    canSubmitCampaign,
    getProductionBudgetRemaining,
    canAffordTeam,
    retryDeliverableGeneration,
    recordToolUsed,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaignContext(): CampaignContextValue {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaignContext must be used within a CampaignProvider');
  }
  return context;
}
