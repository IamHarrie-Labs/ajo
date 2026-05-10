import { useState, useEffect } from 'react';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calc(target: string): Countdown {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const s = Math.floor(diff / 1000);
  return {
    days:    Math.floor(s / 86400),
    hours:   Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    expired: false,
  };
}

/** Live countdown to a target ISO date/datetime string. Updates every second. */
export function useCountdown(target: string): Countdown {
  const [remaining, setRemaining] = useState(() => calc(target));

  useEffect(() => {
    setRemaining(calc(target));
    const id = setInterval(() => setRemaining(calc(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return remaining;
}
