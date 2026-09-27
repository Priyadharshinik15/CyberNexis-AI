import { useEffect, useState } from "react";

// A single seedable RNG for demo determinism — but we still want live movement,
// so we blend it with Math.random for jitter.
export function useTicker(intervalMs = 1500) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

export function useSeries<T>(build: (prev: T[]) => T[], intervalMs = 1500, initial: T[] = []) {
  const [data, setData] = useState<T[]>(initial);
  useEffect(() => {
    setData(build([]));
    const id = setInterval(() => setData((prev) => build(prev)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps
  return data;
}

export const ATTACK_TYPES = [
  "DoS",
  "Reconnaissance",
  "Botnet",
  "Backdoor",
  "Exploit",
  "Worm",
  "Shellcode",
  "Generic",
  "Analysis",
] as const;

export const COUNTRIES = [
  { code: "RU", name: "Russia", lat: 61, lng: 105 },
  { code: "CN", name: "China", lat: 35, lng: 105 },
  { code: "US", name: "United States", lat: 38, lng: -97 },
  { code: "BR", name: "Brazil", lat: -14, lng: -51 },
  { code: "IN", name: "India", lat: 22, lng: 78 },
  { code: "DE", name: "Germany", lat: 51, lng: 10 },
  { code: "KP", name: "N. Korea", lat: 40, lng: 127 },
  { code: "IR", name: "Iran", lat: 32, lng: 53 },
  { code: "NG", name: "Nigeria", lat: 9, lng: 8 },
  { code: "UA", name: "Ukraine", lat: 48, lng: 31 },
];

export function randomIP() {
  return `${1 + ri(223)}.${ri(255)}.${ri(255)}.${1 + ri(254)}`;
}
export function ri(max: number) {
  return Math.floor(Math.random() * max);
}
export function pick<T>(arr: readonly T[]): T {
  return arr[ri(arr.length)];
}

export function nowHHMMSS(d = new Date()) {
  return d.toTimeString().slice(0, 8);
}
