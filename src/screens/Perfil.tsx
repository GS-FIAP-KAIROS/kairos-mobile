import React from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKairos } from '../store';
import { Bar, Card, Icon, IconBubble, Row, T } from '../ui';
import { API_URL } from '../api';
import { palette } from '../theme';

const PAPEL = { doador: 'Doador', comunidade: 'Liderança comunitária', equipe: 'Equipe e voluntários' };

export default function Perfil() {
  const k = useKairos();
  const { t, usuario, impacto, fonte } = k;
  const ins = useSafeAreaInsets();

  const conquistas = [
    { nome: 'Primeira entrega', meta: 1, atual: impacto.atendidas, txt: 'pedido atendido' },
    { nome: '100 kg sem desperdício', meta: 100, atual: impacto.kg, txt: 'kg entregues' },
    { nome: '10 famílias', meta: 10, atual: impacto.familias, txt: 'famílias' },
    { nome: 'Uma semana de rede', meta: 7, atual: impacto.sequencia, txt: 'dias com entrega' },
  ];
  const ganhas = conquistas.filter(c => c.atual >= c.meta).length;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingTop: ins.top + 12, paddingBottom: 130 }}>
      <View style={{ alignItems: 'center', marginBottom: 22 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: palette.sol, alignItems: 'center', justifyContent: 'center' }}>
          <T v="h1" c="#16161A">{usuario?.nome.slice(0, 1).toUpperCase()}</T>
        </View>
        <T v="h1" style={{ marginTop: 12 }}>{usuario?.nome}</T>
        <T v="small">{usuario ? PAPEL[usuario.papel] : ''}</T>
      </View>

      <Card tone="ink" style={{ marginBottom: 12 }}>
        <T v="small" c={t.dark ? '#5a5a62' : '#B9B9C0'}>Impacto da rede até agora</T>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {[[impacto.kg, 'kg entregues'], [impacto.familias, 'famílias'], [impacto.atendidas, 'pedidos']].map(([n, l]) => (
            <View key={String(l)} style={{ flex: 1 }}>
              <T v="num" c={palette.sol}>{n}</T>
              <T v="small" c={t.dark ? '#5a5a62' : '#B9B9C0'}>{l}</T>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <T v="h2">Conquistas</T>
          <T v="small">{ganhas} de {conquistas.length}</T>
        </View>
        {conquistas.map(c => {
          const ok = c.atual >= c.meta;
          return (
            <View key={c.nome} style={{ paddingVertical: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: ok ? palette.sol : t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                  {ok ? <Icon name="check" size={14} color="#16161A" stroke={2.4} /> : null}
                </View>
                <T w="med" style={{ flex: 1 }}>{c.nome}</T>
                <T v="small">{Math.min(c.atual, c.meta)}/{c.meta}</T>
              </View>
              <Bar value={c.atual / c.meta} height={6} color={ok ? palette.sol : t.inkMute} />
            </View>
          );
        })}
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <T v="h2" style={{ marginBottom: 10 }}>Objetivos que o KAIROS apoia</T>
        <T v="small">ODS 1 Erradicação da pobreza, 2 Fome zero, 10 Redução das desigualdades, 11 Cidades sustentáveis e 12 Consumo responsável.</T>
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <Row icon={<IconBubble name="moon" />} title="Modo escuro" right={<Switch value={k.escuro} onValueChange={k.alternarTema} trackColor={{ true: palette.sol }} />} />
        <Row icon={<IconBubble name="bolt" />} title="Conexão com a rede"
          sub={fonte === 'api' ? `Online · ${API_URL.replace('https://', '')}` : fonte === 'conectando' ? 'Conectando…' : 'Offline · toque para reconectar'}
          onPress={k.recarregar} />
        <Row icon={<IconBubble name="user" />} title="Trocar de perfil" sub="Doador, comunidade ou equipe" onPress={k.sair} last />
      </Card>
    </ScrollView>
  );
}
