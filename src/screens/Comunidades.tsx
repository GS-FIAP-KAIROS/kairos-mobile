import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKairos } from '../store';
import { Banner, Bar, Card, T } from '../ui';
import { pesoSocial } from '../api';
import { palette } from '../theme';

export default function Comunidades() {
  const k = useKairos();
  const { t, comunidades, solicitacoes } = k;
  const ins = useSafeAreaInsets();
  const linhas = comunidades.map(c => {
    const abertas = solicitacoes.filter(s => s.comunidadeId === c.id && (s.status === 'ABERTA' || s.status === 'EM_ATENDIMENTO'));
    const score = abertas.reduce((a, s) => Math.max(a, k.prio(s)), 0);
    return { c, abertas: abertas.length, score };
  }).sort((a, b) => b.score - a.score || pesoSocial(b.c) - pesoSocial(a.c));
  const max = Math.max(1, ...linhas.map(l => l.score));

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingTop: ins.top + 12, paddingBottom: 130 }}>
      <T v="hero">Comunidades</T>
      <T c={t.inkSoft} style={{ marginTop: 6, marginBottom: 18 }}>
        Prioridade = urgência × vulnerabilidade × tamanho da população. Quem está no topo recebe primeiro.
      </T>
      <Banner />
      {linhas.map(({ c, abertas, score }, i) => (
        <Card key={c.id} tone={i === 0 && score ? 'ink' : 'plain'} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T v="h2" c={i === 0 && score ? t.pillInk : t.ink}>{c.nome}</T>
              <T v="small" style={{ marginTop: 2 }}>
                {c.cidade}/{c.uf} · {c.populacao.toLocaleString('pt-BR')} pessoas · vulnerabilidade {c.indiceVulnerabilidade}/10
              </T>
            </View>
            <T v="num" style={{ fontSize: 24 }} c={i === 0 && score ? palette.sol : t.ink}>{score.toFixed(0)}</T>
          </View>
          <View style={{ marginTop: 12 }}>
            <Bar value={score / max} color={score / max > 0.66 ? palette.urgente : score / max > 0.33 ? palette.atencao : palette.ok} />
          </View>
          <T v="small" style={{ marginTop: 8 }}>{abertas ? `${abertas} pedido${abertas > 1 ? 's' : ''} aberto${abertas > 1 ? 's' : ''}` : 'Sem pedidos abertos'}</T>
        </Card>
      ))}
    </ScrollView>
  );
}
