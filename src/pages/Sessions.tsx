import { useState, useMemo } from 'react';
import { Card, Badge, Caption, DataValue, DisplayValue, EmptyState, MapName, MetaLabel, Modal, Divider, PageHeader, StatusBadge } from '../components/ui';
import { formatCurrency, formatDateTime, formatPercentage } from '../utils/economy';
import { useAggregatedSessions, useRaids } from '../hooks/useStorageQuery';
import { STATUS_ICONS } from '../data/constants';
import { Clock, TrendingUp, Target, Calendar, ChevronRight } from 'lucide-react';
import type { Session, Raid } from '../types';

interface SessionsProps {
  onRaidClick: (raidId: string) => void;
}

export function Sessions({ onRaidClick }: SessionsProps) {
  const sessions = useAggregatedSessions();
  const raids = useRaids();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const sessionRaids = useMemo(() => {
    if (!selectedSession) return [];
    return raids.filter((r: Raid) => r.sessionId === selectedSession.id);
  }, [selectedSession, raids]);

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        eyebrow="Session log"
        title="Sessions"
        meta="Track play blocks and raid streaks"
      />

      {/* Sessions Grid */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <Card
              key={session.id}
              className="p-4 cursor-pointer"
              hover
              onClick={() => setSelectedSession(session)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-abi-orange" />
                  <Caption>
                    {formatDateTime(session.startTime)}
                  </Caption>
                </div>
                <Badge variant="default" size="sm">
                  {session.raidCount} raids
                </Badge>
              </div>

              <div className="mb-3">
                <DisplayValue tone={session.totalProfit >= 0 ? 'positive' : 'negative'}>
                  {session.totalProfit >= 0 ? '+' : ''}${formatCurrency(session.totalProfit)}
                </DisplayValue>
                <div className="flex items-center gap-3 mt-[var(--space-value-meta)]">
                  <Caption className="flex items-center gap-1">
                    <Target size={12} /> {formatPercentage(session.extractionRate)}
                  </Caption>
                  <Caption className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    {session.totalInvestment > 0
                      ? formatPercentage((session.totalProfit / session.totalInvestment) * 100)
                      : '0%'
                    }
                  </Caption>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Caption tone="muted">Investment: ${formatCurrency(session.totalInvestment)}</Caption>
                <ChevronRight size={16} className="text-secondary" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Clock size={48} />}
          title="No sessions yet"
          description="Sessions are automatically created from your raid history"
        />
      )}

      {/* Session Detail Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title="Session Details"
        size="lg"
      >
        {selectedSession && (
          <div className="space-y-4">
            {/* Session Info */}
            <div className="flex items-center justify-between">
              <div>
                <Caption>
                  {formatDateTime(selectedSession.startTime)}
                </Caption>
                <Caption tone="muted" className="block mt-[var(--space-value-meta)]">
                  Duration: {Math.round((selectedSession.endTime - selectedSession.startTime) / 60000)} minutes
                </Caption>
              </div>
              <div className="text-right">
                <DisplayValue tone={selectedSession.totalProfit >= 0 ? 'positive' : 'negative'}>
                  {selectedSession.totalProfit >= 0 ? '+' : ''}${formatCurrency(selectedSession.totalProfit)}
                </DisplayValue>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-abi-bg rounded-lg">
              <div className="text-center">
                <DataValue>{selectedSession.raidCount}</DataValue>
                <MetaLabel className="block mt-[var(--space-value-meta)]">Raids</MetaLabel>
              </div>
              <div className="text-center">
                <DataValue tone="positive">{formatPercentage(selectedSession.extractionRate)}</DataValue>
                <MetaLabel className="block mt-[var(--space-value-meta)]">Extract</MetaLabel>
              </div>
              <div className="text-center">
                <DataValue>${formatCurrency(selectedSession.totalInvestment)}</DataValue>
                <MetaLabel className="block mt-[var(--space-value-meta)]">Invested</MetaLabel>
              </div>
              <div className="text-center">
                <DataValue tone="positive">${formatCurrency(selectedSession.totalLoot)}</DataValue>
                <MetaLabel className="block mt-[var(--space-value-meta)]">Looted</MetaLabel>
              </div>
            </div>

            <Divider />

            {/* Raids List */}
            <div>
              <h4 className="type-label text-secondary mb-[var(--space-section)]">
                Raids in Session
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sessionRaids.map((raid: Raid) => (
                  <div
                    key={raid.id}
                    onClick={() => {
                      onRaidClick(raid.id);
                      setSelectedSession(null);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-abi-bg cursor-pointer hover:bg-abi-bg-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status={raid.status} icon={STATUS_ICONS[raid.status]} />
                      <MapName>{raid.map}</MapName>
                    </div>
                    <div className="flex items-center gap-3">
                      <Caption>{raid.duration}m</Caption>
                      <DataValue tone={raid.netProfit >= 0 ? 'positive' : 'negative'}>
                        ${formatCurrency(raid.netProfit)}
                      </DataValue>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
