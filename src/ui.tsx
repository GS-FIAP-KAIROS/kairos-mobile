import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text as RNText, TextProps, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useKairos } from './store';
import { font, palette, radius } from './theme';

export const tap = (kind: 'light' | 'success' = 'light') => {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

type TxtProps = TextProps & { v?: 'hero' | 'h1' | 'h2' | 'body' | 'small' | 'label' | 'num'; c?: string; w?: 'reg' | 'med' | 'bold' };
export function T({ v = 'body', c, w, style, ...p }: TxtProps) {
  const { t } = useKairos();
  const base = {
    hero: { fontFamily: font.display, fontSize: 38, lineHeight: 42, letterSpacing: -1 },
    h1: { fontFamily: font.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
    h2: { fontFamily: font.displayMed, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
    body: { fontFamily: font.body, fontSize: 15, lineHeight: 21 },
    small: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
    label: { fontFamily: font.bodyMed, fontSize: 13, lineHeight: 18 },
    num: { fontFamily: font.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.8 },
  }[v];
  const wf = w === 'bold' ? { fontFamily: font.bodyBold } : w === 'med' ? { fontFamily: font.bodyMed } : null;
  const col = c ?? (v === 'small' ? t.inkMute : t.ink);
  return <RNText {...p} style={[base, wf, { color: col }, style]} />;
}

export function Card({ children, style, onPress, tone }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; tone?: 'ink' | 'sol' | 'plain' }) {
  const { t } = useKairos();
  const bg = tone === 'ink' ? t.pill : tone === 'sol' ? palette.sol : t.surface;
  const inner = <View style={[{ backgroundColor: bg, borderRadius: radius.lg, padding: 18 }, style]}>{children}</View>;
  if (!onPress) return inner;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      {inner}
    </Pressable>
  );
}

export function Btn({ label, onPress, kind = 'ink', disabled, loading, style }: { label: string; onPress: () => void; kind?: 'ink' | 'sol' | 'ghost'; disabled?: boolean; loading?: boolean; style?: ViewStyle }) {
  const { t } = useKairos();
  const bg = disabled ? t.line : kind === 'sol' ? palette.sol : kind === 'ghost' ? 'transparent' : t.pill;
  const fg = disabled ? t.inkMute : kind === 'sol' ? '#16161A' : kind === 'ghost' ? t.ink : t.pillInk;
  return (
    <Pressable
      accessibilityRole="button" disabled={disabled || loading}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [{ height: 54, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: kind === 'ghost' ? 1 : 0, borderColor: t.line, opacity: pressed ? 0.85 : 1 }, style]}>
      <T w="bold" c={fg} style={{ fontSize: 16 }}>{loading ? 'Calculando…' : label}</T>
    </Pressable>
  );
}

/** Anel de progresso animado (inspirado no "1 of 5 done"). */
export function Ring({ value, size = 64, stroke = 7, color = palette.sol, children }: { value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const { t } = useKairos();
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const anim = useRef(new Animated.Value(0)).current;
  const [v, setV] = React.useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value: x }) => setV(x));
    Animated.timing(anim, { toValue: Math.max(0, Math.min(1, value)), duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      {children}
    </View>
  );
}

export function Bar({ value, color = palette.sol, height = 8 }: { value: number; color?: string; height?: number }) {
  const { t } = useKairos();
  return (
    <View style={{ height, borderRadius: height, backgroundColor: t.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(2, Math.min(100, value * 100))}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function Segmented<K extends string>({ items, value, onChange }: { items: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  const { t } = useKairos();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.surfaceAlt, borderRadius: 12, padding: 3 }}>
      {items.map(i => {
        const on = i.key === value;
        return (
          <Pressable key={i.key} onPress={() => { tap(); onChange(i.key); }}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: on ? t.surface : 'transparent' }}>
            <T v="label" c={on ? t.ink : t.inkMute}>{i.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  const { t } = useKairos();
  return (
    <Pressable onPress={() => { tap(); onPress(); }}
      style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, marginRight: 8, marginBottom: 8,
        backgroundColor: on ? t.pill : t.surface, borderWidth: 1, borderColor: on ? t.pill : t.line }}>
      <T v="label" c={on ? t.pillInk : t.ink}>{label}</T>
    </Pressable>
  );
}

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />;
}

export function Row({ icon, title, sub, right, onPress, last }: { icon?: React.ReactNode; title: string; sub?: string; right?: React.ReactNode; onPress?: () => void; last?: boolean }) {
  const { t } = useKairos();
  return (
    <Pressable onPress={onPress ? () => { tap(); onPress(); } : undefined}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 14, opacity: pressed ? 0.6 : 1,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderColor: t.line })}>
      {icon}
      <View style={{ flex: 1 }}>
        <T w="med">{title}</T>
        {sub ? <T v="small" style={{ marginTop: 2 }}>{sub}</T> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size={18} color={t.inkMute} /> : null)}
    </Pressable>
  );
}

export function Stepper({ value, onChange, step = 1, min = 1 }: { value: number; onChange: (n: number) => void; step?: number; min?: number }) {
  const { t } = useKairos();
  const b = (txt: string, fn: () => void) => (
    <Pressable onPress={() => { tap(); fn(); }} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
      <T v="h2">{txt}</T>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      {b('−', () => onChange(Math.max(min, value - step)))}
      <T v="num" style={{ minWidth: 70, textAlign: 'center' }}>{value}</T>
      {b('+', () => onChange(value + step))}
    </View>
  );
}

const P: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  map: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  truck: 'M2 6h11v10H2zM13 10h4l4 4v2h-8M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  close: 'M6 6l12 12M18 6 6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  gift: 'M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9S10.5 4 8 4.5 7 9 12 9zM12 9s1.5-5 4-4.5S17 9 12 9z',
  hand: 'M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 14.5a1.5 1.5 0 0 1 2.5-1.7L7 14',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  flame: 'M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-1 2-2 3-4 4 0-2-1-4-2-6-2 3-4 6-4 11a7 7 0 0 0 7 7z',
};
export function Icon({ name, size = 22, color, stroke = 1.8 }: { name: keyof typeof P | string; size?: number; color?: string; stroke?: number }) {
  const { t } = useKairos();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={P[name] ?? P.plus} stroke={color ?? t.ink} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconBubble({ name, bg, color }: { name: string; bg?: string; color?: string }) {
  const { t } = useKairos();
  return (
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg ?? t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={20} color={color} />
    </View>
  );
}

export function Banner() {
  const { fonte, recarregar, t } = useKairos();
  if (fonte === 'api') return null;
  const txt = fonte === 'conectando' ? 'Conectando à rede KAIROS…' : 'Modo offline: dados salvos no aparelho. Toque para reconectar.';
  return (
    <Pressable onPress={fonte === 'local' ? recarregar : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14 }}>
      <Dot color={fonte === 'conectando' ? palette.atencao : t.inkMute} />
      <T v="small" c={t.inkSoft} style={{ flex: 1 }}>{txt}</T>
    </Pressable>
  );
}
