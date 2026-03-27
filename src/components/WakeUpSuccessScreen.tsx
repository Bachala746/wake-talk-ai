import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Flame, Trophy, ArrowRight } from "lucide-react";
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
    if (diffDays > 1) return 0; // streak broken
    return streak;
  } catch {
    return 0;
  }
}

function incrementStreak(): number {
  const lastDate = localStorage.getItem(LAST_WAKEUP_KEY);
  const today = new Date().toISOString().split("T")[0];
  
  if (lastDate === today) {
    // Already recorded today
    return getStreak();
  }

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
    const newStreak = incrementStreak();
    setStreak(newStreak);
    // Animate in
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formattedTime = wakeUpTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = wakeUpTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${
      isDark
        ? 'bg-gradient-to-br from-[hsl(240,20%,12%)] via-[hsl(25,40%,18%)] to-[hsl(240,20%,12%)]'
        : 'bg-[var(--gradient-dawn)]'
    }`}>
      <div className={`w-full max-w-sm transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Celebration icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center animate-bounce ${
            isDark
              ? 'bg-primary/20 border-2 border-primary/40'
              : 'bg-primary/15 border-2 border-primary/30'
          }`}>
            <Sun className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Main card */}
        <Card className={`p-6 text-center space-y-6 ${
          isDark
            ? 'bg-card/80 backdrop-blur-lg border-border/50'
            : 'bg-card/90 backdrop-blur-lg border-border/50 shadow-lg'
        }`}>
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              You're Awake! 🎉
            </h1>
            <p className="text-muted-foreground text-sm">{formattedDate}</p>
          </div>

          {/* Wake-up time */}
          <div className={`rounded-xl p-4 ${
            isDark ? 'bg-muted/50' : 'bg-muted/70'
          }`}>
            <p className="text-sm text-muted-foreground mb-1">Woke up at</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">{formattedTime}</p>
          </div>

          {/* Streak */}
          <div className={`rounded-xl p-4 flex items-center justify-center gap-3 ${
            isDark ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/15'
          }`}>
            {streak >= 7 ? (
              <Trophy className="w-7 h-7 text-primary" />
            ) : (
              <Flame className="w-7 h-7 text-primary" />
            )}
            <div className="text-left">
              <p className="text-2xl font-bold text-foreground">{streak} day{streak !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground">
                {streak >= 7 ? 'Amazing streak! 🏆' : streak >= 3 ? 'Keep it going! 🔥' : 'No-snooze streak'}
              </p>
            </div>
          </div>

          {/* Motivational quote */}
          <div className="space-y-2 px-2">
            <p className="text-sm italic text-foreground/80 leading-relaxed">
              "{quote.text}"
            </p>
            <p className="text-xs text-muted-foreground">— {quote.author}</p>
          </div>

          {/* Dismiss button */}
          <Button
            onClick={onDismiss}
            className="w-full h-12 text-base font-semibold gap-2"
            size="lg"
          >
            Start My Day
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Card>
      </div>
    </div>
  );
};
