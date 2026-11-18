import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { Papel, useKairos } from '../store';
import { Btn, Icon, T, tap } from '../ui';
import { font, palette, radius } from '../theme';

const PAPEIS: { key: Papel; title: string; sub: string; icon: string }[] = [
  { key: 'doador', title: 'Quero doar', sub: 'Cadastre alimentos, água, roupas e kits', icon: 'gift' },
  { key: 'comunidade', title: 'Minha comunidade precisa', sub: 'Peça recursos e acompanhe a entrega', icon: 'hand' },
  { key: 'equipe', title: 'Sou da equipe ou voluntário', sub: 'Planeje rotas e confirme entregas', icon: 'truck' },
];

/** Mapa abstrato: a base KAIROS ligada as comunidades (mesma ideia do video 3D). */
function Rede() {
  const pts = [[60, 70], [270, 50], [310, 170], [40, 190], [180, 210]];
  const hub = [175, 120];
  return (
    <Svg width="100%" height={240} viewBox="0 0 350 240">
      {pts.map(([x, y], i) => <Line key={i} x1={hub[0]} y1={hub[1]} x2={x} y2={y} stroke="#16161A" strokeOpacity={0.25} strokeWidth={1.5} strokeDasharray="4 6" />)}
      {pts.map(([x, y], i) => <Circle key={'p' + i} cx={x} cy={y} r={i < 2 ? 9 : 6} fill={i < 2 ? palette.urgente : '#16161A'} />)}
      <Circle cx={hub[0]} cy={hub[1]} r={30} fill="#16161A" />
      <Circle cx={hub[0]} cy={hub[1]} r={11} fill={palette.sol} />
    </Svg>
  );
}

export default function Welcome() {
  const { t, entrar } = useKairos();
  const ins = useSafeAreaInsets();
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState<Papel>('equipe');
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: palette.sol }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingTop: ins.top + 24, paddingHorizontal: 24 }}>
          <T v="h1" c="#16161A" style={{ fontSize: 34 }}>KAIROS</T>
          <T c="#16161A" style={{ marginTop: 6, opacity: 0.75 }}>Cada doação, no lugar certo, na hora certa.</T>
        </View>
        <Rede />
        <View style={{ flex: 1, backgroundColor: t.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 24, paddingBottom: ins.bottom + 24 }}>
          <T v="h1">Como você quer ajudar hoje?</T>
          <View style={{ marginTop: 18, gap: 10 }}>
            {PAPEIS.map(p => {
              const on = p.key === papel;
              return (
                <Pressable key={p.key} onPress={() => { tap(); setPapel(p.key); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md,
                    borderWidth: on ? 2 : 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.surfaceAlt : t.surface }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette.sol : t.surfaceAlt }}>
                    <Icon name={p.icon} color="#16161A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T w="bold">{p.title}</T>
                    <T v="small">{p.sub}</T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <T v="label" style={{ marginTop: 22, marginBottom: 8 }}>Seu nome</T>
          <TextInput value={nome} onChangeText={setNome} placeholder="Como podemos te chamar?" placeholderTextColor={t.inkMute}
            style={{ height: 54, borderRadius: radius.md, borderWidth: 1, borderColor: t.line, paddingHorizontal: 16, fontSize: 16, color: t.ink, fontFamily: font.body }} />
          <Btn label="Entrar na rede" disabled={!nome.trim()} onPress={() => { tap('success'); entrar({ nome: nome.trim(), papel }); }} style={{ marginTop: 18 }} />
          <T v="small" style={{ textAlign: 'center', marginTop: 14 }}>Sem senha: seu perfil fica salvo só neste aparelho.</T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
