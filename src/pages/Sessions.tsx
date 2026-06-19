import { useState, useMemo } from 'react';
import { Card, Badge, EmptyState, Modal, Divider } from '../components/ui';
import { aggregateSessions } from '../utils/analytics';
import { formatCurrency, formatDateTime, formatPercentage } from '../utils/economy';
import { getRaids } from '../utils/storage';
import { STATUS_ICONS } from '../data/constants';
import { Clock, TrendingUp, Target, Calendar, ChevronRight } from 'lucide-react';
import type { Session, Raid } from '../types';

interface SessionsProps {
  onRaidClick: (raidId: string) => void;
}

export function Sessions({ onRaidClick }: SessionsProps) {
  const sessions = useMemo(() => aggregateSessions(), []);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const sessionRaids = useMemo(() => {
    if (!selectedSession) return [];
    return getRaids().filter((r: Raid) => r.sessionId === selectedSession.id);
  }, [selectedSession]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-abi-text">Sessions</h1>
        <p className="text-abi-text-muted text-sm mt-1">Track your play sessions</p>
      </div>

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
                  <span className="text-sm text-abi-text-muted">
                    {formatDateTime(session.startTime)}
                  </span>
                </div>
                <Badge variant="default" size="sm">
                  {session.raidCount} raids
                </Badge>
              </div>

              <div className="mb-3">
                <p className={`text-2xl font-bold ${session.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {session.totalProfit >= 0 ? '+' : ''}${formatCurrency(session.totalProfit)}
                </p>
                <div className="flex items-center gap-3 mt-1 text-sm text-abi-text-muted">
                  <span className="flex items-center gap-1">
                    <Target size={12} /> {formatPercentage(session.extractionRate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    {session.totalInvestment > 0
                      ? formatPercentage((session.totalProfit / session.totalInvestment) * 100)
                      : '0%'
                    }
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-abi-text-dim">
                <span>Investment: ${formatCurrency(session.totalInvestment)}</span>
                <ChevronRight size={16} className="text-abi-text-muted" />
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
                <p className="text-abi-text-muted text-sm">
                  {formatDateTime(selectedSession.startTime)}
                </p>
                <p className="text-xs text-abi-text-dim mt-1">
                  Duration: {Math.round((selectedSession.endTime - selectedSession.startTime) / 60000)} minutes
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${selectedSession.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedSession.totalProfit >= 0 ? '+' : ''}${formatCurrency(selectedSession.totalProfit)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-abi-bg rounded-lg">
              <div className="text-center">
                <p className="text-lg font-bold text-abi-text">{selectedSession.raidCount}</p>
                <p className="text-xs text-abi-text-muted">Raids</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{formatPercentage(selectedSession.extractionRate)}</p>
                <p className="text-xs text-abi-text-muted">Extract</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-abi-text">${formatCurrency(selectedSession.totalInvestment)}</p>
                <p className="text-xs text-abi-text-muted">Invested</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">${formatCurrency(selectedSession.totalLoot)}</p>
                <p className="text-xs text-abi-text-muted">Looted</p>
              </div>
            </div>

            <Divider />

            {/* Raids List */}
            <div>
              <h4 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-3">
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
                      <Badge
                        variant={raid.status === 'EXTRACTED' ? 'success' : raid.status === 'DIED' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {STATUS_ICONS[raid.status]}
                      </Badge>
                      <span className="text-sm text-abi-text">{raid.map}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-abi-text-muted">{raid.duration}m</span>
                      <span className={`text-sm ${raid.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${formatCurrency(raid.netProfit)}
                      </span>
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
