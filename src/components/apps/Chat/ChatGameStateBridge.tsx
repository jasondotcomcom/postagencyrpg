import { useEffect } from 'react';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useReputationContext } from '../../../context/ReputationContext';
import { usePortfolioContext } from '../../../context/PortfolioContext';
import { setChatGameSnapshot } from '../../../utils/chatGameState';

/**
 * Feeds a plain snapshot of game state to team chat. ChatProvider sits above
 * the campaign / reputation / portfolio providers, so it can't read them;
 * this renders inside all of them and writes the snapshot chat reads from.
 */
export default function ChatGameStateBridge(): null {
  const { campaigns } = useCampaignContext();
  const { state: rep } = useReputationContext();
  const { entries } = usePortfolioContext();

  useEffect(() => {
    const activeBriefs = campaigns
      .filter(c => c.phase !== 'submitted' && c.phase !== 'completed')
      .map(c => ({
        clientName: c.clientName,
        campaignName: c.campaignName,
        phase: c.phase,
        deadline: new Date(c.deadline).getTime(),
      }))
      .sort((a, b) => a.deadline - b.deadline);
    setChatGameSnapshot({ activeBriefs });
  }, [campaigns]);

  useEffect(() => {
    const last = [...rep.completedCampaigns].sort((a, b) => b.completedAt - a.completedAt)[0];
    setChatGameSnapshot({
      reputationTier: rep.currentTier?.name ?? null,
      completedCount: rep.completedCampaigns.length,
      ...(last ? { lastScore: { campaignName: last.name, clientName: last.clientName, score: last.score, at: last.completedAt } } : {}),
    });
  }, [rep.currentTier, rep.completedCampaigns]);

  useEffect(() => {
    const awardsWon = entries
      .filter(e => e.award)
      .sort((a, b) => b.completedAt - a.completedAt)
      .map(e => `${e.award} for "${e.campaignName}"`);
    setChatGameSnapshot({ awardsWon });
  }, [entries]);

  return null;
}
