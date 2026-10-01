import React, { useState, useRef, useEffect } from 'react';
import { useTuxi } from '../../context/TuxiContext';
import { 
  Award, 
  Gift, 
  Sparkles, 
  Star, 
  ChevronDown, 
  User, 
  CheckCircle2, 
  ArrowUpRight, 
  TrendingUp, 
  Tag, 
  Clock, 
  Check, 
  X,
  Zap
} from 'lucide-react';

export const LoyaltyPointsTracker: React.FC = () => {
  const { loyaltyProfile, redeemReward, config, formatPrice } = useTuxi();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [rewardRedeemedFeedback, setRewardRedeemedFeedback] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRedeem = (points: number, title: string) => {
    const success = redeemReward(points, title);
    if (success) {
      setRewardRedeemedFeedback(`Successfully redeemed "${title}"! Voucher applied to your checkout.`);
      setTimeout(() => setRewardRedeemedFeedback(''), 4000);
    }
  };

  const progressPercent = Math.min(
    100, 
    Math.round((loyaltyProfile.totalPoints / loyaltyProfile.nextTierPoints) * 100)
  );

  const pointsToNext = Math.max(0, loyaltyProfile.nextTierPoints - loyaltyProfile.totalPoints);

  const redeemableRewards = [
    {
      id: 'rew-1',
      title: `${config.currencySymbol}5.00 Off Any Order`,
      costPoints: 500,
      description: 'Instant discount deducted at checkout'
    },
    {
      id: 'rew-2',
      title: 'Free Courier Delivery',
      costPoints: 350,
      description: 'Zero delivery fee on next point-to-point dispatch'
    },
    {
      id: 'rew-3',
      title: `${config.currencySymbol}10.00 Off Eats Kitchen`,
      costPoints: 1000,
      description: 'Premium discount on orders above 25.00'
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile & Loyalty Tracker Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-xs select-none ${
          isOpen
            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 text-slate-900 shadow-xs'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
        }`}
        title="View Loyalty Points & Rewards Activity"
      >
        {/* User Avatar */}
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&h=80&q=80"
            alt="Emma Watson Profile"
            className="w-6 h-6 rounded-full object-cover border border-amber-300"
          />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[7px] font-bold">
            ★
          </span>
        </div>

        {/* User Name & Tier Badge */}
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="font-bold text-slate-900 text-[11px]">Emma W.</span>
          <span className="text-[9px] font-mono text-amber-700 font-semibold uppercase flex items-center gap-0.5">
            {loyaltyProfile.tier} Member
          </span>
        </div>

        {/* Live Points Badge */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200 font-mono font-bold text-[11px]">
          <Award className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>{loyaltyProfile.totalPoints.toLocaleString()} pts</span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
      </button>

      {/* Loyalty Points Popover & Rewards Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 text-xs text-slate-800 space-y-4 animate-fade-in">
          
          {/* Header Profile Area */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Emma Watson"
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-300 shadow-xs"
              />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Emma Watson</h3>
                <span className="text-[11px] text-slate-500">emma.watson@example.com</span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{loyaltyProfile.tier} Tier</span>
            </span>
          </div>

          {rewardRedeemedFeedback && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{rewardRedeemedFeedback}</span>
            </div>
          )}

          {/* Current Points Balance Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-500/10 border border-amber-200/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">
                  Current Points Balance
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-1.5 mt-0.5">
                  <span>{loyaltyProfile.totalPoints.toLocaleString()}</span>
                  <span className="text-xs text-amber-800 font-normal">pts</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Redemption Value</span>
                <span className="font-bold text-slate-800 font-mono text-sm">
                  ~{config.currencySymbol}{(loyaltyProfile.totalPoints * 0.01).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Progress to Next Tier */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Progress to <strong>Platinum</strong></span>
                <span className="font-mono font-bold text-amber-800">{pointsToNext} pts left</span>
              </div>
              <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Gold (1.5x Multiplier)</span>
                <span>Platinum (2.0x Multiplier)</span>
              </div>
            </div>
          </div>

          {/* Redeem Rewards Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-indigo-600" />
                <span>Available Rewards to Redeem</span>
              </h4>
              <span className="text-[10px] text-slate-400">Instant checkout discount</span>
            </div>

            <div className="space-y-2">
              {redeemableRewards.map(rew => {
                const canAfford = loyaltyProfile.totalPoints >= rew.costPoints;
                return (
                  <div
                    key={rew.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{rew.title}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">{rew.description}</span>
                    </div>

                    <button
                      onClick={() => handleRedeem(rew.costPoints, rew.title)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] font-mono transition-all shrink-0 ${
                        canAfford
                          ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {rew.costPoints} pts
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Points Activity Stream */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Recent Points Activity</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Live Ledger</span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {loyaltyProfile.recentActivity.map(act => (
                <div key={act.id} className="pt-1.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-800 block text-[11px]">{act.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{act.date}</span>
                  </div>

                  <span className={`font-mono font-bold text-xs ${
                    act.pointsDelta > 0 ? 'text-emerald-600' : 'text-amber-700'
                  }`}>
                    {act.pointsDelta > 0 ? `+${act.pointsDelta}` : act.pointsDelta} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Rule Tip */}
          <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[10px] text-indigo-950 flex items-start gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Earn <strong>10 points</strong> for every {config.currencySymbol}1.00 spent on Eats, Shop, and Courier. Gold members enjoy <strong>1.5x points acceleration</strong>!
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
