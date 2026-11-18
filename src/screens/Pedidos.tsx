import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useKairos } from '../store';
import { Banner, Btn, Card, Dot, Icon, Segmented, T, tap } from '../ui';
import { catGlyph, catLabel, Distribuicao } from '../api';
import { corUrgencia, palette } from '../theme';

type Aba = 'abertos' | 'rota' | 'atendidos';
const ETAPAS = ['Planejada', 'Em rota', 'Entregue'];
const idx = { PLANEJADA: 0, EM_ROTA: 1, ENTREGUE: 2 };

function Rastreio({ d }: { d: Distribuicao }) {
  const k = useKairos();
  const { t } = k;
  const s = k.solicitacao(d.solicitacaoId);
  const c = s ? k.comunidade(s.comunidadeId) : undefined;
  const r = k.recurso(d.recursoId);
  const i = idx[d.status];
  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <T v="small">Entrega KRS-{String(d.id).padStart(4, '0')}</T>
          <T v="h2" style={{ marginTop: 2 }}>{c?.nome ?? 'Comunidade'}</T>
          <T v="small" style={{ marginTop: 2 }}>{d.quantidade} × {r?.nome ?? 'recurso'}</T>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T v="num" style={{ fontSize: 22 }}>{d.prioridade.toFixed(0)}</T>
          <T v="small">prioridade</T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
        {ETAPAS.map((e, j) => (
          <React.Fragment key={e}>
            <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
              backgroundColor: j <= i ? t.pill : t.surfaceAlt }}>
              {j <= i ? <Icon name="check" size={13} color={t.pillInk} stroke={2.4} /> : null}
            </View>
            {j < 2 ? <View style={{ flex: 1, height: 2, marginHorizontal: 4, backgroundColor: j < i ? t.pill : t.line }} /> : null}
          </React.Fragment>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {ETAPAS.map(e => <T key={e} v="small">{e}</T>)}
      </View>
      {d.status !== 'ENTREGUE' ? (
        <Btn kind={d.status === 'EM_ROTA' ? 'sol' : 'ink'} label={d.status === 'PLANEJADA' ? 'Saiu para entrega' : 'Confirmar entrega'}
          onPress={() => { if (d.status === 'EM_ROTA') tap('success'); k.avancar(d); }} style={{ marginTop: 16, height: 48 }} />
      ) : null}
    </Card>
  );
}

export default function Pedidos() {
  const k = useKairos();
  const { t, solicitacoes, distribuicoes } = k;
  const nav = useNavigation<any>();
  const ins = useSafeAreaInsets();
  const [aba, setAba] = useState<Aba>('abertos');

  const abertos = solicitacoes.filter(s => s.status === 'ABERTA' || s.status === 'EM_ATENDIMENTO').sort((a, b) => k.prio(b) - k.prio(a));
  const rota = distribuicoes.filter(d => d.status !== 'ENTREGUE');
  const feitos = distribuicoes.filter(d => d.status === 'ENTREGUE');

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingTop: ins.top + 12, paddingBottom: 130 }}>
      <T v="small">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</T>
      <T v="hero" style={{ marginBottom: 18 }}>Pedidos</T>
      <Banner />
      <Segmented<Aba> value={aba} onChange={setAba}
        items={[{ key: 'abertos', label: `Abertos ${abertos.length}` }, { key: 'rota', label: `Em rota ${rota.length}` }, { key: 'atendidos', label: 'Atendidos' }]} />
      <View style={{ height: 16 }} />

      {aba === 'abertos' ? (
        <Card style={{ paddingVertical: 4 }}>
          {abertos.map((s, i) => {
            const c = k.comunidade(s.comunidadeId);
            return (
              <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderColor: t.line }}>
                <T style={{ fontSize: 22 }}>{catGlyph(s.categoria)}</T>
                <View style={{ flex: 1 }}>
                  <T w="med">{c?.nome}</T>
                  <T v="small">{s.quantidade} × {catLabel(s.categoria).toLowerCase()} · {s.status === 'EM_ATENDIMENTO' ? 'entrega planejada' : 'aguardando'}</T>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Dot color={corUrgencia(s.urgencia)} />
                  <T v="small">{k.prio(s).toFixed(0)}</T>
                </View>
              </View>
            );
          })}
          <Pressable onPress={() => { tap(); nav.navigate('Pedir'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 }}>
            <Icon name="plus" color={palette.urgente} />
            <T c={palette.urgente} w="med">Novo pedido</T>
          </Pressable>
        </Card>
      ) : null}

      {aba === 'rota' ? (rota.length ? rota.map(d => <Rastreio key={d.id} d={d} />) : (
        <Card>
          <T v="h2">Nenhuma entrega na rua</T>
          <T v="small" style={{ marginTop: 4, marginBottom: 14 }}>Monte a próxima carga e o KAIROS escolhe quem atender primeiro.</T>
          <Btn label="Planejar entrega" onPress={() => nav.navigate('Entrega')} />
        </Card>
      )) : null}

      {aba === 'atendidos' ? (feitos.length ? feitos.map(d => <Rastreio key={d.id} d={d} />) : (
        <Card><T v="small">As entregas confirmadas aparecem aqui.</T></Card>
      )) : null}
    </ScrollView>
  );
}
