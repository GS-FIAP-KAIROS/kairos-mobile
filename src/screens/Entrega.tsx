import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useKairos } from '../store';
import { Banner, Btn, Card, Chip, Ring, T, tap } from '../ui';
import { catGlyph, Plano } from '../api';
import { palette } from '../theme';

const VEICULOS = [
  { nome: 'Fiorino', kg: 650 },
  { nome: 'Master', kg: 1500 },
  { nome: 'Caminhão', kg: 5000 },
];

export default function Entrega() {
  const k = useKairos();
  const { t } = k;
  const ins = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const [cap, setCap] = useState(650);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const calcular = async () => {
    setCarregando(true); setEnviado(false);
    try { setPlano(await k.simular(cap)); } finally { setCarregando(false); }
  };
  const confirmar = async () => {
    if (!plano) return;
    await k.confirmar(cap, plano);
    tap('success'); setEnviado(true);
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingTop: ins.top + 12, paddingBottom: 130 }}>
      <T v="hero">Entrega</T>
      <T c={t.inkSoft} style={{ marginTop: 6, marginBottom: 18 }}>
        Escolha o veículo. O KAIROS monta a carga que atende mais gente, por ordem de prioridade, sem passar do peso.
      </T>
      <Banner />

      <Card style={{ marginBottom: 12 }}>
        <T v="label" style={{ marginBottom: 10 }}>Veículo disponível</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {VEICULOS.map(v => <Chip key={v.nome} label={`${v.nome} · ${v.kg} kg`} on={cap === v.kg} onPress={() => { setCap(v.kg); setPlano(null); }} />)}
        </View>
        <Btn label="Calcular a melhor carga" loading={carregando} onPress={calcular} style={{ marginTop: 8 }} />
      </Card>

      {plano ? (
        <>
          <Card tone="ink" style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <Ring value={plano.pesoUtilizadoKg / plano.capacidadeKg} size={76} stroke={8}>
              <T w="bold" c={t.pillInk} style={{ fontSize: 14 }}>{Math.round((plano.pesoUtilizadoKg / plano.capacidadeKg) * 100)}%</T>
            </Ring>
            <View style={{ flex: 1 }}>
              <T v="h2" c={t.pillInk}>{plano.distribuicoes.length} paradas · {Math.round(plano.pesoUtilizadoKg)} kg</T>
              <T v="small" c={t.dark ? '#5a5a62' : '#B9B9C0'} style={{ marginTop: 2 }}>
                Impacto {plano.impactoTotal.toFixed(0)} pontos de prioridade atendidos
              </T>
            </View>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <T v="label" style={{ marginBottom: 6 }}>Ordem das paradas</T>
            {plano.distribuicoes.length === 0 ? <T v="small">Nada cabe nesse veículo agora. Tente um maior.</T> : null}
            {plano.distribuicoes.map((d, i) => {
              const s = k.solicitacao(d.solicitacaoId);
              const c = s ? k.comunidade(s.comunidadeId) : undefined;
              const r = k.recurso(d.recursoId);
              const ultimo = i === plano.distribuicoes.length - 1;
              return (
                <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i === 0 ? palette.sol : t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                      <T w="bold" c="#16161A" style={{ fontSize: 13, color: i === 0 ? '#16161A' : t.ink }}>{i + 1}</T>
                    </View>
                    {!ultimo ? <View style={{ width: 2, flex: 1, backgroundColor: t.line, marginVertical: 2 }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: ultimo ? 0 : 16 }}>
                    <T w="med">{c?.nome ?? 'Comunidade'}</T>
                    <T v="small">{r ? catGlyph(r.categoria) : ''} {d.quantidade} × {r?.nome} · prioridade {d.prioridade.toFixed(0)}</T>
                  </View>
                </View>
              );
            })}
          </Card>

          {enviado ? (
            <Card tone="sol">
              <T v="h2" c="#16161A">Carga despachada</T>
              <T c="#16161A" style={{ marginTop: 4, marginBottom: 14 }}>Acompanhe cada parada até a confirmação na comunidade.</T>
              <Btn label="Acompanhar entregas" onPress={() => nav.navigate('Pedidos')} />
            </Card>
          ) : plano.distribuicoes.length ? (
            <Btn kind="sol" label="Confirmar e despachar" onPress={confirmar} />
          ) : null}
        </>
      ) : (
        <Card>
          <T v="h2">Como o KAIROS decide</T>
          <T v="small" style={{ marginTop: 6 }}>
            Cada pedido vale pontos de prioridade e pesa quilos. O algoritmo testa as combinações (programação dinâmica, problema da mochila)
            e escolhe a carga com mais impacto que cabe no veículo.
          </T>
        </Card>
      )}
    </ScrollView>
  );
}
