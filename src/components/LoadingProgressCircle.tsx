import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface LoadingProgressCircleProps {
  isDeepResearch?: boolean;
  isComplete?: boolean;
  onAnimationComplete?: () => void;
}

const LoadingProgressCircle: React.FC<LoadingProgressCircleProps> = ({
  isDeepResearch = false,
  isComplete = false,
  onAnimationComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Duration: ~5 seconds for normal, ~90 seconds for deep research
  const totalDuration = isDeepResearch ? 90000 : 5000;
  const updateInterval = 100;

  useEffect(() => {
    if (isComplete) {
      // When loading is complete, immediately set to 100% and show green
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Immediately set to 100% and show complete state
      setProgress(100);
      setShowComplete(true);

      // Short delay for user to see the green state, then transition
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isComplete, onAnimationComplete]);

  useEffect(() => {
    if (isComplete) return;

    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const linearProgress = Math.min(elapsed / totalDuration, 1);

      let easedProgress: number;
      if (linearProgress < 0.7) {
        easedProgress = (linearProgress / 0.7) * 85;
      } else if (linearProgress < 0.95) {
        easedProgress = 85 + ((linearProgress - 0.7) / 0.25) * 10;
      } else {
        easedProgress = 95 + ((linearProgress - 0.95) / 0.05) * 4;
      }

      setProgress(Math.min(Math.round(easedProgress), 99));
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [totalDuration, isComplete]);

  // Circle dimensions
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isFullyComplete = progress >= 100 && showComplete;

  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-16">
      <div
        className={cn("relative transition-all duration-500", isFullyComplete && "scale-105")}
        style={{ width: size, height: size }}
      >
        {/* Glow effect when complete */}
        {isFullyComplete && (
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: "radial-gradient(circle, hsl(var(--stock-green) / 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              transform: "scale(1.3)",
            }}
          />
        )}

        <svg width={size} height={size} className="transform -rotate-90" style={{ overflow: "visible" }}>
          {/* Glass background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth={strokeWidth}
            className="drop-shadow-sm"
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
            </linearGradient>
            <linearGradient id="completeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--stock-green))" />
              <stop offset="100%" stopColor="hsl(142 76% 46%)" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Strong glow for complete state */}
            <filter id="glowComplete" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isFullyComplete ? "url(#completeGradient)" : "url(#progressGradient)"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={isFullyComplete ? "url(#glowComplete)" : "url(#glow)"}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Inner glass backdrop */}
        <div
          className={cn(
            "absolute inset-4 rounded-full backdrop-blur-sm transition-all duration-500",
            "bg-gradient-to-br from-background/80 via-background/60 to-background/40",
            "border border-border/20 shadow-inner",
            isFullyComplete && "from-stock-green/10 via-stock-green/5 to-transparent border-stock-green/30",
          )}
        />

        {/* Percentage text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "text-4xl md:text-5xl font-bold tabular-nums transition-colors duration-500",
              isFullyComplete ? "text-stock-green" : "text-foreground",
            )}
          >
            {Math.round(progress)}%
          </span>
          <span className="text-xs md:text-sm text-muted-foreground mt-1">
            {isDeepResearch ? "KI-Analyse" : "Analyse"}
          </span>
        </div>
      </div>

      {/* Status text */}
      <p
        className={cn(
          "mt-6 text-sm md:text-base font-medium transition-colors duration-500",
          isFullyComplete ? "text-stock-green" : "text-foreground",
        )}
      >
        {isFullyComplete
          ? "Analyse abgeschlossen"
          : isDeepResearch
            ? "KI analysiert qualitative Kriterien..."
            : "Analysiere Finanzdaten..."}
      </p>
    </div>
  );
};

export default LoadingProgressCircle;
