import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Card, Badge, ProgressBar } from '../components/ui';
import { getRaids } from '../utils/storage';
import { calculateDashboardAnalytics, calculateGearAnalytics } from '../utils/analytics';
import { formatCurrency, formatPercentage } from '../utils/economy';
import { User, Trophy, Target, TrendingUp, Skull, Clock, Star, Shield, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export function Commander() {
  const analytics = useMemo(() => calculateDashboardAnalytics(), []);
  const gearAnalytics = useMemo(() => calculateGearAnalytics(), []);
  const raids = getRaids();

  // Calculate lifetime records
  const records = useMemo(() => {
    if (raids.length === 0) return null;

    const bestProfit = raids.reduce((best, r) => r.netProfit > best.netProfit ? r : best, raids[0]);
    const worstProfit = raids.reduce((worst, r) => r.netProfit < worst.netProfit ? r : worst, raids[0]);
    const mostKills = raids.reduce((best, r) => r.kills > best.kills ? r : best, raids[0]);
    const longestRaid = raids.reduce((longest, r) => r.duration > longest.duration ? r : longest, raids[0]);

    return { bestProfit, worstProfit, mostKills, longestRaid };
  }, [raids]);

  // Define achievements
  const achievements: Achievement[] = useMemo(() => {
    const result: Achievement[] = [
      {
        id: 'first_raid',
        name: 'First Blood',
        description: 'Complete your first raid',
        icon: <Skull size={20} />,
        unlocked: raids.length >= 1,
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Complete 100 raids',
        icon: <Trophy size={20} />,
        unlocked: raids.length >= 100,
        progress: raids.length,
        maxProgress: 100,
      },
      {
        id: 'profit_king',
        name: 'Profit King',
        description: 'Accumulate $1,000,000 profit',
        icon: <TrendingUp size={20} />,
        unlocked: analytics.lifetimeProfit >= 1000000,
        progress: analytics.lifetimeProfit,
        maxProgress: 1000000,
      },
      {
        id: 'extractor',
        name: 'The Extractor',
        description: 'Achieve 75% extraction rate across 50 raids',
        icon: <Target size={20} />,
        unlocked: analytics.extractionRate >= 75 && raids.length >= 50,
        progress: analytics.extractionRate,
        maxProgress: 75,
      },
    ];

    // Records-based achievements
    result.push({
      id: 'money_maker',
      name: 'Money Maker',
      description: 'Earn $100,000 in a single raid',
      icon: <Star size={20} />,
      unlocked: records ? records.bestProfit.netProfit >= 100000 : false,
    });

    result.push({
      id: 'slayer',
      name: 'Slayer',
      description: 'Get 10 kills in a single raid',
      icon: <Zap size={20} />,
      unlocked: records ? records.mostKills.kills >= 10 : false,
    });

    result.push({
      id: 'rescue_expert',
      name: 'Rescue Expert',
      description: 'Recover 90%+ gear value in death',
      icon: <Shield size={20} />,
      unlocked: gearAnalytics.bestRescuePercentage >= 90,
    });

    result.push({
      id: 'marathon',
      name: 'Marathon Man',
      description: 'Survive a raid lasting 60+ minutes',
      icon: <Clock size={20} />,
      unlocked: records ? records.longestRaid.duration >= 60 : false,
    });

    return result;
  }, [raids, analytics, gearAnalytics, records]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Prestige level based on completed raids
  const prestigeLevel = useMemo(() => {
    if (raids.length >= 1000) return { level: 10, title: 'Legend' };
    if (raids.length >= 500) return { level: 9, title: 'Master' };
    if (raids.length >= 250) return { level: 8, title: 'Expert' };
    if (raids.length >= 100) return { level: 7, title: 'Veteran' };
    if (raids.length >= 75) return { level: 6, title: 'Seasoned' };
    if (raids.length >= 50) return { level: 5, title: 'Skilled' };
    if (raids.length >= 25) return { level: 4, title: 'Trained' };
    if (raids.length >= 10) return { level: 3, title: 'Rookie' };
    if (raids.length >= 5) return { level: 2, title: 'Beginner' };
    if (raids.length >= 1) return { level: 1, title: 'Recruit' };
    return { level: 0, title: 'Unknown' };
  }, [raids]);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-abi-orange to-abi-orange-dark flex items-center justify-center shadow-glow">
            <User size={48} className="text-white" />
          </div>

          {/* Info */}
          <div>
            <Badge variant="orange" size="sm">{prestigeLevel.title}</Badge>
            <h1 className="text-2xl font-bold text-abi-text mt-2">Commander</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-abi-text-muted">
              <span>Prestige Level {prestigeLevel.level}</span>
              <span>|</span>
              <span>{raids.length} raids completed</span>
            </div>
          </div>

          {/* Stats */}
          <div className="ml-auto grid grid-cols-3 gap-8 text-center">
            <div>
              <p className={`text-2xl font-bold ${analytics.lifetimeProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${formatCurrency(analytics.lifetimeProfit)}
              </p>
              <p className="text-xs text-abi-text-muted">Lifetime Profit</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-abi-text">
                {formatPercentage(analytics.extractionRate)}
              </p>
              <p className="text-xs text-abi-text-muted">Extraction Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-abi-text">
                {analytics.totalRaids}
              </p>
              <p className="text-xs text-abi-text-muted">Total Raids</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Lifetime Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-xs text-abi-text-muted uppercase">Best Profit</span>
          </div>
          {records ? (
            <>
              <p className="text-xl font-bold text-green-400">
                +${formatCurrency(records.bestProfit.netProfit)}
              </p>
              <p className="text-sm text-abi-text-dim">{records.bestProfit.map}</p>
            </>
          ) : (
            <p className="text-abi-text-dim">No data</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-red-400" />
            <span className="text-xs text-abi-text-muted uppercase">Worst Profit</span>
          </div>
          {records ? (
            <>
              <p className="text-xl font-bold text-red-400">
                ${formatCurrency(records.worstProfit.netProfit)}
              </p>
              <p className="text-sm text-abi-text-dim">{records.worstProfit.map}</p>
            </>
          ) : (
            <p className="text-abi-text-dim">No data</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-abi-orange" />
            <span className="text-xs text-abi-text-muted uppercase">Most Kills</span>
          </div>
          {records ? (
            <>
              <p className="text-xl font-bold text-abi-text">{records.mostKills.kills}</p>
              <p className="text-sm text-abi-text-dim">{records.mostKills.map}</p>
            </>
          ) : (
            <p className="text-abi-text-dim">No data</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-400" />
            <span className="text-xs text-abi-text-muted uppercase">Longest Raid</span>
          </div>
          {records ? (
            <>
              <p className="text-xl font-bold text-abi-text">{records.longestRaid.duration}m</p>
              <p className="text-sm text-abi-text-dim">{records.longestRaid.map}</p>
            </>
          ) : (
            <p className="text-abi-text-dim">No data</p>
          )}
        </Card>
      </div>

      {/* Achievements */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider flex items-center gap-2">
            <Trophy size={16} className="text-abi-orange" />
            Achievements
          </h3>
          <span className="text-sm text-abi-text-muted">
            {unlockedCount}/{achievements.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`
                p-3 rounded-lg border transition-all duration-200
                ${achievement.unlocked
                  ? 'bg-abi-orange/10 border-abi-orange/30'
                  : 'bg-abi-bg border-abi-border opacity-50'
                }
              `}
            >
              <div className={`mb-2 ${achievement.unlocked ? 'text-abi-orange' : 'text-abi-text-dim'}`}>
                {achievement.icon}
              </div>
              <p className="text-sm font-semibold text-abi-text">{achievement.name}</p>
              <p className="text-xs text-abi-text-muted mt-1">{achievement.description}</p>
              {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                <ProgressBar
                  value={achievement.progress}
                  max={achievement.maxProgress}
                  variant="orange"
                  size="sm"
                  className="mt-2"
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
