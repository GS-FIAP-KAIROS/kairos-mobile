import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useKairos } from '../store';
import { Banner, Btn, Card, Dot, Icon, IconBubble, Ring, Row, T } from '../ui';
import { catGlyph, catLabel } from '../api';
import { corUrgencia, palette } from '../theme';

const SAUDACAO = {
  doador: 'O que você pode doar hoje?',
  comunidade: 'Do que sua comunidade precisa?',
  equipe: 'Quem precisa de ajuda primeiro?',
};

export default function Home() {
  const k = useKairos();
  const { t, usuario, solicitacoes, impacto } = k;
  const nav = useNavigation<any>();
  const ins = useSafeAreaInsets();
  const primeiro = usuario?.nome.split(' ')[0] ?? '';
  const abertas = solicitacoes.filter(s => s.status === 'ABERTA' || s.status === 'EM_ATENDIMENTO')
    .sort((a, b) => k.prio(b) - k.prio(a));
  const topo = abertas[0];
  const c = topo ? k.comunidade(topo.comunidadeId) : undefined;
  const total = impacto.atendidas + impacto.abertas;
  const proxima = abertas[1] ? k.comunidade(abertas[1].comunidadeId)?.nome : undefined;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingTop: ins.top + 12, paddingBottom: 130 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
        <T v="h2">KAIROS</T>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <T w="bold">{primeiro.slice(0, 1).toUpperCase()}</T>
        </View>
      </View>

      <T v="hero">Olá, {primeiro}.</T>
      <T v="h2" c={t.inkSoft} style={{ marginTop: 4, marginBottom: 20, fontFamily: 'Inter_500Medium', fontSize: 18 }}>{SAUDACAO[usuario?.papel ?? 'equipe']}</T>
      <Banner />

      {/* Progresso do dia */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <Ring value={total ? impacto.atendidas / total : 0} size={66}>
          <T w="bold" style={{ fontSize: 14 }}>{total ? Math.round((impacto.atendidas / total) * 100) : 0}%</T>
        </Ring>
        <View style={{ flex: 1 }}>
          <T v="h2">{impacto.atendidas} de {total} pedidos atendidos</T>
          <T v="small" style={{ marginTop: 2 }}>
            {impacto.abertas ? `${impacto.abertas} aguardando${proxima ? `, depois vem ${proxima}` : ''}` : 'Nenhum pedido aguardando. Bom trabalho!'}
          </T>
        </View>
      </Card>

      {/* Mais urgente agora */}
      {topo && c ? (
        <Card tone="ink" style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Dot color={corUrgencia(topo.urgencia)} />
            <T v="small" c={t.dark ? '#5a5a62' : '#B9B9C0'}>Mais urgente agora</T>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <T v="h1" c={t.pillInk}>{c.nome}</T>
              <T c={t.dark ? '#5a5a62' : '#B9B9C0'} style={{ marginTop: 4 }}>
                {catGlyph(topo.categoria)} {topo.quantidade} × {catLabel(topo.categoria).toLowerCase()} · urgência {topo.urgencia}/5
              </T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <T v="num" c={palette.sol}>{k.prio(topo).toFixed(0)}</T>
              <T v="small" c={t.dark ? '#5a5a62' : '#B9B9C0'}>prioridade</T>
            </View>
          </View>
          <Btn kind="sol" label="Planejar a entrega" onPress={() => nav.navigate('Entrega')} style={{ marginTop: 18 }} />
        </Card>
      ) : null}

      {/* Acoes */}
      <Card style={{ paddingVertical: 4, marginBottom: 12 }}>
        <Row icon={<IconBubble name="gift" />} title="Doar um recurso" sub="Cadastre e veja onde ele vai ajudar" onPress={() => nav.navigate('Doar')} />
        <Row icon={<IconBubble name="hand" />} title="Pedir ajuda" sub="Registre o que sua comunidade precisa" onPress={() => nav.navigate('Pedir')} />
        <Row icon={<IconBubble name="map" />} title="Ver comunidades" sub="Ranking de quem precisa mais" onPress={() => nav.navigate('Comunidades')} last />
      </Card>

      {/* Impacto */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <T v="num">{impacto.kg}</T>
          <T v="small">kg entregues</T>
        </Card>
        <Card style={{ flex: 1 }}>
          <T v="num">{impacto.familias}</T>
          <T v="small">famílias atendidas</T>
        </Card>
        <Card tone="sol" style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <T v="num" c="#16161A">{impacto.sequencia}</T>
            <Icon name="flame" size={18} color="#16161A" />
          </View>
          <T v="small" c="#16161A">dias com entrega</T>
        </Card>
      </View>
    </ScrollView>
  );
}
