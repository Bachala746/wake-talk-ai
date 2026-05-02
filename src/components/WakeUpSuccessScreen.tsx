import { useState, useEffect } from "react";
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
          ? 'bg-gradient-to-br from-[hsl(240,30%,10%)] via-[hsl(260,35%,16%)] to-[hsl(20,40%,16%)]'
          : 'bg-gradient-to-br from-[hsl(35,100%,88%)] via-[hsl(20,100%,82%)] to-[hsl(340,90%,88%)]'
      }`}
    >
      {/* Ambient sunrise orbs */}
      <div
        className={`pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-50 ${
          isDark ? 'bg-orange-500/30' : 'bg-amber-300/60'
        }`}
        style={{ animation: 'float-slow 8s ease-in-out infinite' }}
      />
      <div
        className={`pointer-events-none absolute -bottom-24 -right-16 w-96 h-96 rounded-full blur-3xl opacity-40 ${
          isDark ? 'bg-pink-500/20' : 'bg-rose-300/50'
        }`}
        style={{ animation: 'float-slow 10s ease-in-out infinite reverse' }}
      />

      <div
        className={`relative w-full max-w-sm transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Animated sun icon */}
        <div className="flex justify-center mb-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Sunrays */}
            <span
              className={`absolute inset-0 rounded-full ${isDark ? 'bg-orange-400/20' : 'bg-amber-300/50'} blur-xl`}
              style={{ animation: 'pulse-glow 2.4s ease-in-out infinite' }}
            />
            <span
              className={`absolute inset-2 rounded-full border-2 ${isDark ? 'border-orange-400/40' : 'border-amber-400/60'}`}
              style={{ animation: 'spin-slow 14s linear infinite' }}
            />
            <div
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ${
                isDark
                  ? 'bg-gradient-to-br from-orange-400 to-rose-500'
                  : 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500'
              }`}
              style={{ animation: 'gentle-bounce 2.8s ease-in-out infinite' }}
            >
              <Sun className="w-10 h-10 text-white drop-shadow" strokeWidth={2.4} />
            </div>
          </div>
        </div>

        {/* Main card */}
        <Card
          className={`p-7 text-center space-y-6 rounded-3xl border backdrop-blur-xl ${
            isDark
              ? 'bg-slate-900/70 border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]'
              : 'bg-white/80 border-white/60 shadow-[0_20px_60px_-15px_rgba(251,146,60,0.35)]'
          }`}
        >
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                You're Awake!
              </h1>
              <Sparkles className={`w-6 h-6 ${isDark ? 'text-orange-300' : 'text-amber-500'} animate-pulse`} />
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formattedDate}</p>
          </div>

          {/* Wake-up time */}
          <div
            className={`rounded-2xl p-5 ${
              isDark
                ? 'bg-white/5 border border-white/10'
                : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100'
            }`}
          >
            <p className={`text-xs uppercase tracking-wider mb-1.5 font-semibold ${isDark ? 'text-slate-400' : 'text-orange-600/80'}`}>
              Woke up at
            </p>
            <p
              className={`text-5xl font-extrabold tracking-tight tabular-nums ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              style={{ animation: 'time-pop 0.6s ease-out' }}
            >
              {formattedTime}
            </p>
          </div>

          {/* Streak */}
          <div
            className={`rounded-2xl p-4 flex items-center justify-center gap-3 ${
              isDark
                ? 'bg-orange-500/10 border border-orange-400/20'
                : 'bg-gradient-to-r from-orange-100 to-rose-100 border border-orange-200/60'
            }`}
          >
            <div className="relative">
              {streak >= 7 ? (
                <Trophy className={`w-8 h-8 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
              ) : (
                <Flame
                  className={`w-8 h-8 ${isDark ? 'text-orange-400' : 'text-orange-500'}`}
                  style={{ animation: 'flame-flicker 1.4s ease-in-out infinite' }}
                />
              )}
            </div>
            <div className="text-left">
              <p className={`text-2xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {streak} day{streak !== 1 ? 's' : ''}
              </p>
              <p className={`text-xs font-medium ${isDark ? 'text-orange-200/80' : 'text-orange-700/80'}`}>
                {streak >= 7 ? 'Amazing streak! 🏆' : streak >= 3 ? 'Keep it going! 🔥' : 'No-snooze streak'}
              </p>
            </div>
          </div>

          {/* Motivational quote */}
          <div className="space-y-2 px-1">
            <p className={`text-sm italic leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              "{quote.text}"
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>— {quote.author}</p>
          </div>

          {/* Dismiss button — gradient + interactive */}
          <Button
            onClick={onDismiss}
            size="lg"
            className="group w-full h-14 text-base font-bold gap-2 rounded-2xl border-0 text-white
                       bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500
                       hover:from-orange-600 hover:via-amber-600 hover:to-rose-600
                       shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start My Day
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
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
          50%      { opacity: 0.75; transform: scale(1.12); }
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
          50%      { transform: scale(1.12) rotate(2deg); opacity: 0.9; }
        }
        @keyframes time-pop {
          0%   { transform: scale(0.92); opacity: 0; }
          60%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
