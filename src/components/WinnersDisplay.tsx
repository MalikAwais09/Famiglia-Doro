import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { WinnerClaimAgreement } from '@/components/agreements/WinnerClaimAgreement'
import { toast } from 'sonner'
import { formatLocalDateTime } from '@/lib/utils/dateUtils'

interface WinnerData {
  id: string
  placement: number
  prize_claimed: boolean
  claimed_at: string | null
  user_id: string
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  }
  submissions: {
    id: string
    title: string
    description: string | null
    votes_count: number
    content_url: string | null
    content_type: string
  }
}

interface Props {
  challengeId: string
  currentUserId?: string
  challengeTitle?: string
  prizeDescription?: string
  prizeType?: string
}

export function WinnersDisplay({
  challengeId,
  currentUserId,
  challengeTitle,
  prizeDescription,
  prizeType,
}: Props) {
  const [winners, setWinners] = useState<WinnerData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWinner, setSelectedWinner] = useState<WinnerData | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  useEffect(() => {
    fetchWinners()
  }, [challengeId])

  const fetchWinners = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('winners')
      .select(`
        id,
        placement,
        prize_claimed,
        claimed_at,
        user_id,
        profiles!winners_user_id_fkey (
          id, name, avatar_url
        ),
        submissions!winners_submission_id_fkey (
          id, title, description,
          votes_count, content_url, content_type
        )
      `)
      .eq('challenge_id', challengeId)
      .order('placement', { ascending: true })

    if (error) {
      console.error('Winners fetch error:', error)
    } else {
      setWinners((data as any) ?? [])
    }
    setLoading(false)
  }

  const handleClaimPrize = async () => {
    if (!selectedWinner) return
    setClaimingId(selectedWinner.id)
    try {
      const { error } = await supabase
        .from('winners')
        .update({
          prize_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', selectedWinner.id)

      if (error) {
        toast.error('Failed to claim prize')
        return
      }

      toast.success('🎉 Prize claimed successfully!')
      setShowClaimModal(false)
      setSelectedWinner(null)
      fetchWinners()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setClaimingId(null)
    }
  }

  if (loading) {
    return (
      <div>
        <p>Loading winners...</p>
      </div>
    )
  }

  if (winners.length === 0) return null

  const medals = ['🥇', '🥈', '🥉']
  const placementLabels = ['1st Place', '2nd Place', '3rd Place']
  const pointsEarned = [100, 50, 25]
  const medalColors = [
    'border-yellow-500 bg-yellow-500/10',
    'border-gray-400 bg-gray-400/10',
    'border-orange-400 bg-orange-400/10',
  ]

  void challengeTitle
  void prizeDescription
  void prizeType

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">🏆 Challenge Winners</h2>

      <div className="flex flex-col gap-4">
        {winners.map((winner, index) => {
          const isCurrentUserWinner = currentUserId === winner.user_id
          const avatarUrl = winner.profiles?.avatar_url
          const name = winner.profiles?.name ?? 'Unknown'
          const submission = winner.submissions
          const contentType = submission?.content_type

          return (
            <div
              key={winner.id}
              className={`rounded-xl border-2 p-4 ${medalColors[index] ?? 'border-gray-600'}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{medals[index]}</span>

                  <div className="flex items-center gap-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-muted-foreground">
                        {placementLabels[index]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span>🗳️ {submission?.votes_count ?? 0} votes</span>
                  <span>⭐ +{pointsEarned[index]} points</span>
                </div>
              </div>

              {submission && (
                <div className="mt-3 p-3 rounded-lg bg-black/20">
                  <p className="font-medium text-sm">
                    Submission: {submission.title ?? 'Untitled'}
                  </p>
                  {submission.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {submission.description}
                    </p>
                  )}

                  {submission.content_url && contentType === 'image' && (
                    <img
                      src={submission.content_url}
                      alt="Submission"
                      className="mt-2 rounded-lg max-h-48 object-cover w-full"
                    />
                  )}

                  {submission.content_url && contentType === 'video' && (
                    <video
                      src={submission.content_url}
                      controls
                      className="mt-2 rounded-lg max-h-48 w-full"
                    />
                  )}

                  {submission.content_url && contentType === 'link' && (
                    <a
                      href={submission.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs mt-1 block underline"
                    >
                      {submission.content_url}
                    </a>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                {winner.prize_claimed && (
                  <span className="text-green-400 text-sm">
                    ✅ Prize Claimed
                    {winner.claimed_at && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatLocalDateTime(winner.claimed_at)})
                      </span>
                    )}
                  </span>
                )}

                {isCurrentUserWinner && !winner.prize_claimed && (
                  <button
                    onClick={() => {
                      setSelectedWinner(winner)
                      setShowClaimModal(true)
                    }}
                    disabled={claimingId === winner.id}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg text-sm"
                  >
                    {claimingId === winner.id ? 'Claiming...' : '🎁 Claim Prize'}
                  </button>
                )}

                {isCurrentUserWinner && (
                  <span className="text-yellow-400 text-sm font-medium">
                    🎉 This is you!
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showClaimModal && selectedWinner && (
        <WinnerClaimAgreement
          isOpen={showClaimModal}
          onConfirm={handleClaimPrize}
          onCancel={() => {
            setShowClaimModal(false)
            setSelectedWinner(null)
          }}
        />
      )}
    </div>
  )
}
