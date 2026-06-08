import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Flame, Trophy, ArrowRight, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const motivationalQuotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Every morning brings new potential, but if you dwell on the misfortunes of the day before, you tend to overlook tremendous opportunities.", author: "Harvey Mackay" },
  { text: "Today is a new day. Don't let your history interfere with your destiny.", author: "Steve Maraboli" },
  { text: "Rise up, start fresh, see the bright opportunity in each new day.", author: "Unknown" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "An early-morning walk is a blessing for the whole day.", author: "Henry David Thoreau" },
  { text: "Morning is an important time of day, because how you spend your morning can often tell you what kind of day you are going to have.", author: "Lemony Snicket" },
  { text: "With the new day comes new strength and new thoughts.", author: "Eleanor Roosevelt" },
  { text: "The breeze at dawn has secrets to tell you. Don't go back to sleep.", author: "Rumi" },
];

const STREAK_KEY = "wakeup-streak";
const LAST_WAKEUP_KEY = "wakeup-last-date";

function getStreak(): number {
  try {
    const streak = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
    const lastDate = localStorage.getItem(LAST_WAKEUP_KEY);
    if (!lastDate) return 0;
    const last = new Date(lastDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return 0;
    return streak;
  } catch {
    return 0;
  }
}

function incrementStreak(): number {
  const lastDate = localStorage.getItem(LAST_WAKEUP_KEY);
  const today = new Date().toISOString().split("T")[0];
  if (lastDate === today) return getStreak();
  let streak = getStreak();
  streak += 1;
  localStorage.setItem(STREAK_KEY, streak.toString());
  localStorage.setItem(LAST_WAKEUP_KEY, today);
  return streak;
}

interface WakeUpSuccessScreenProps {
  onDismiss: () => void;
}

export const WakeUpSuccessScreen = ({ onDismiss }: WakeUpSuccessScreenProps) => {
  const { isDark } = useTheme();
  const [streak, setStreak] = useState(0);
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const [wakeUpTime] = useState(() => new Date());
  const [showContent, setShowContent] = useState(false);

  // Pre-compute random sparkle positions once
  const sparkles = useMemo(
    () => Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      top: Math.random() * 90 + 2,
      left: Math.random() * 95 + 2,
      size: Math.random() * 6 + 4,
      delay: Math.random() * 3,
      dur: 2.4 + Math.random() * 2.6,
    })),
    []
  );

  useEffect(() => {
    setStreak(incrementStreak());
    const t = setTimeout(() => setShowContent(true), 80);
    return () => clearTimeout(t);
  }, []);

  const formattedTime = wakeUpTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = wakeUpTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center p-4 overflow-hidden transition-all duration-700 ${
        isDark
          ? 'bg-[radial-gradient(ellipse_at_top,hsl(230,60%,16%)_0%,hsl(245,50%,10%)_55%,hsl(255,45%,8%)_100%)]'
          : 'bg-[radial-gradient(ellipse_at_top,hsl(45,100%,90%)_0%,hsl(20,100%,82%)_45%,hsl(340,90%,86%)_100%)]'
      }`}
    >
      {/* Aurora sweep */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-60 mix-blend-screen ${
          isDark
            ? 'bg-[conic-gradient(from_180deg_at_50%_120%,transparent,hsl(230,80%,45%)/0.4,transparent_40%,hsl(260,70%,50%)/0.4,transparent)]'
            : 'bg-[conic-gradient(from_180deg_at_50%_120%,transparent,hsl(45,100%,75%)/0.5,transparent_40%,hsl(340,90%,80%)/0.5,transparent)]'
        }`}
        style={{ animation: 'aurora-spin 24s linear infinite' }}
      />

      {/* Ambient orbs */}
      <div
        className={`pointer-events-none absolute -top-24 -left-24 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-50 ${
          isDark ? 'bg-indigo-500/30' : 'bg-amber-300/60'
        }`}
        style={{ animation: 'float-slow 8s ease-in-out infinite' }}
      />
      <div
        className={`pointer-events-none absolute -bottom-28 -right-20 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-40 ${
          isDark ? 'bg-violet-600/25' : 'bg-rose-300/55'
        }`}
        style={{ animation: 'float-slow 10s ease-in-out infinite reverse' }}
      />
      <div
        className={`pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-30 ${
          isDark ? 'bg-blue-500/20' : 'bg-yellow-200/60'
        }`}
        style={{ animation: 'float-slow 12s ease-in-out infinite' }}
      />

      {/* Floating sparkles */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className={`pointer-events-none absolute rounded-full ${
            isDark ? 'bg-blue-100/85' : 'bg-white'
          }`}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            boxShadow: isDark
              ? '0 0 12px hsl(225,90%,75%)'
              : '0 0 10px hsl(40,100%,75%)',
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      <div
        className={`relative w-full max-w-sm transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Animated sun/moon icon */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Outer glow */}
            <span
              className={`absolute inset-0 rounded-full blur-2xl ${
                isDark ? 'bg-indigo-400/40' : 'bg-amber-300/70'
              }`}
              style={{ animation: 'pulse-glow 2.4s ease-in-out infinite' }}
            />
            <div
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20 ${
                isDark
                  ? 'bg-gradient-to-br from-blue-300 via-indigo-500 to-violet-700'
                  : 'bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-500'
              }`}
              style={{ animation: 'gentle-bounce 2.8s ease-in-out infinite' }}
            >
              <Sun className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2.4} />
            </div>
          </div>
        </div>

        {/* Main card */}
        <Card
          className={`relative p-7 text-center space-y-6 rounded-3xl border backdrop-blur-2xl overflow-hidden ${
            isDark
              ? 'bg-slate-900/70 border-indigo-300/20 shadow-[0_25px_70px_-15px_hsl(230_90%_30%/0.6),inset_0_1px_0_0_hsl(220_90%_90%/0.1)]'
              : 'bg-white/75 border-white/70 shadow-[0_25px_70px_-15px_rgba(251,146,60,0.4)]'
          }`}
        >
          {/* Card highlight sheen */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1/2 -left-1/3 w-[180%] h-[80%] rotate-12 opacity-30"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
              animation: 'sheen 6s ease-in-out infinite',
            }}
          />

          {/* Title */}
          <div className="relative space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <h1
                className={`text-3xl font-extrabold tracking-tight bg-clip-text text-transparent ${
                  isDark
                    ? 'bg-gradient-to-r from-white via-indigo-100 to-violet-200 drop-shadow-[0_0_18px_hsl(230_90%_70%/0.55)]'
                    : 'bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600'
                }`}
                style={
                  isDark
                    ? { filter: 'drop-shadow(0 2px 12px hsl(235 90% 65% / 0.45))' }
                    : undefined
                }
              >
                You're Awake!
              </h1>
              <Sparkles
                className={`w-6 h-6 ${isDark ? 'text-indigo-200' : 'text-amber-500'} animate-pulse`}
                style={isDark ? { filter: 'drop-shadow(0 0 8px hsl(230 90% 75% / 0.8))' } : undefined}
              />
            </div>
            <p
              className={`text-sm font-medium ${isDark ? 'text-indigo-100/90' : 'text-slate-600'}`}
              style={isDark ? { textShadow: '0 0 12px hsl(230 80% 60% / 0.35)' } : undefined}
            >
              {formattedDate}
            </p>
          </div>

          {/* Wake-up time */}
          <div
            className={`relative rounded-2xl p-5 overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/15 shadow-[inset_0_1px_0_0_hsl(220_90%_90%/0.12),inset_0_-1px_0_0_hsl(230_60%_20%/0.4)]'
                : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60'
            }`}
          >
            {/* Inner radial highlight (dark only) */}
            {isDark && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 60%, hsl(230 90% 65% / 0.28) 0%, transparent 60%)',
                }}
              />
            )}
            <p
              className={`relative text-[11px] uppercase tracking-[0.22em] mb-1.5 font-bold ${
                isDark ? 'text-indigo-200' : 'text-orange-600/90'
              }`}
              style={isDark ? { textShadow: '0 0 10px hsl(230 90% 65% / 0.6)' } : undefined}
            >
              Woke up at
            </p>
            <p
              className={`relative text-6xl font-extrabold tracking-tight tabular-nums leading-none bg-clip-text text-transparent ${
                isDark
                  ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400'
                  : 'bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600'
              }`}
              style={
                isDark
                  ? {
                      animation: 'time-pop 0.6s ease-out',
                      filter:
                        'drop-shadow(0 0 22px hsl(230 95% 70% / 0.65)) drop-shadow(0 4px 10px hsl(255 85% 55% / 0.45))',
                    }
                  : {
                      animation: 'time-pop 0.6s ease-out',
                      filter:
                        'drop-shadow(0 0 16px hsl(25 95% 60% / 0.45)) drop-shadow(0 2px 6px hsl(340 80% 55% / 0.3))',
                    }
              }
            >
              {formattedTime}
            </p>
          </div>

          {/* Streak */}
          <div
            className={`relative rounded-2xl p-4 flex items-center justify-center gap-3 overflow-hidden ${
              isDark
                ? 'bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-blue-500/15 border border-indigo-400/30 shadow-[inset_0_1px_0_0_hsl(220_90%_90%/0.12)]'
                : 'bg-gradient-to-r from-orange-100 via-rose-100 to-amber-100 border border-orange-200/70'
            }`}
          >
            {isDark && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{
                  background:
                    'linear-gradient(to bottom, hsl(220 90% 85% / 0.08), transparent)',
                }}
              />
            )}
            <div className="relative">
              {streak >= 7 ? (
                <Trophy
                  className={`w-9 h-9 ${isDark ? 'text-indigo-200' : 'text-amber-600'} drop-shadow`}
                  style={isDark ? { filter: 'drop-shadow(0 0 10px hsl(230 90% 70% / 0.75))' } : undefined}
                />
              ) : (
                <Flame
                  className={`w-9 h-9 ${isDark ? 'text-blue-200' : 'text-orange-500'} drop-shadow`}
                  style={{
                    animation: 'flame-flicker 1.4s ease-in-out infinite',
                    filter: isDark ? 'drop-shadow(0 0 10px hsl(220 95% 70% / 0.75))' : undefined,
                  }}
                />
              )}
            </div>
            <div className="relative text-left">
              <p
                className={`text-2xl font-extrabold tabular-nums leading-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                style={isDark ? { textShadow: '0 0 14px hsl(230 90% 70% / 0.5)' } : undefined}
              >
                {streak} day{streak !== 1 ? 's' : ''}
              </p>
              <p
                className={`text-xs font-semibold ${isDark ? 'text-indigo-100/95' : 'text-orange-700/85'}`}
                style={isDark ? { textShadow: '0 0 8px hsl(230 80% 60% / 0.4)' } : undefined}
              >
                {streak >= 7 ? 'Amazing streak! 🏆' : streak >= 3 ? 'Keep it going! 🔥' : 'No-snooze streak'}
              </p>
            </div>
          </div>

          {/* Motivational quote */}
          <div
            className={`relative space-y-2 px-3 py-3 rounded-xl border-l-4 overflow-hidden ${
              isDark
                ? 'border-indigo-300/80 bg-white/[0.04]'
                : 'border-amber-400 bg-amber-50/60'
            }`}
            style={
              isDark
                ? { boxShadow: 'inset 3px 0 14px -6px hsl(230 95% 65% / 0.45), inset 0 1px 0 0 hsl(220 90% 90% / 0.08)' }
                : undefined
            }
          >
            <p
              className={`text-sm italic leading-relaxed ${isDark ? 'text-indigo-50' : 'text-slate-700'}`}
              style={isDark ? { textShadow: '0 0 10px hsl(230 70% 50% / 0.35)' } : undefined}
            >
              "{quote.text}"
            </p>
            <p
              className={`text-xs font-semibold tracking-wide ${
                isDark ? 'text-indigo-200' : 'text-amber-700'
              }`}
              style={isDark ? { textShadow: '0 0 8px hsl(230 85% 65% / 0.5)' } : undefined}
            >
              — {quote.author}
            </p>
          </div>

          {/* Dismiss button */}
          <Button
            onClick={onDismiss}
            size="lg"
            className={`group relative w-full h-14 text-base font-bold gap-2 rounded-2xl border-0 text-white overflow-hidden
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                       ${isDark
                         ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 hover:from-blue-600 hover:via-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60'
                         : 'bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:via-amber-600 hover:to-rose-600 shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60'}`}
          >
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
            <span className="relative">Start My Day</span>
            <ArrowRight className="relative w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </Card>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(20px, -16px) scale(1.06); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.15); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes flame-flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); opacity: 1; }
          50%      { transform: scale(1.15) rotate(2deg); opacity: 0.9; }
        }
        @keyframes time-pop {
          0%   { transform: scale(0.92); opacity: 0; }
          60%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50%      { opacity: 1; transform: scale(1.1); }
        }
        @keyframes aurora-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes glow-pulse-dark {
          0%, 100% { filter: drop-shadow(0 0 18px hsl(230 95% 70% / 0.5)) drop-shadow(0 4px 8px hsl(255 85% 55% / 0.35)); }
          50%      { filter: drop-shadow(0 0 30px hsl(230 95% 70% / 0.85)) drop-shadow(0 4px 12px hsl(255 85% 55% / 0.6)); }
        }
        @keyframes glow-pulse-light {
          0%, 100% { filter: drop-shadow(0 0 14px hsl(25 95% 60% / 0.35)) drop-shadow(0 2px 5px hsl(340 80% 55% / 0.25)); }
          50%      { filter: drop-shadow(0 0 22px hsl(25 95% 60% / 0.65)) drop-shadow(0 2px 8px hsl(340 80% 55% / 0.45)); }
        }
        @keyframes sheen {
          0%, 100% { transform: translateX(-30%) rotate(12deg); opacity: 0; }
          50%      { transform: translateX(30%) rotate(12deg); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
};
