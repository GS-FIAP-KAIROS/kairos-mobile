import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useKairos } from '../store';
import { Btn, Card, Chip, Icon, Stepper, T, tap } from '../ui';
import { Categoria, CATEGORIAS, catLabel } from '../api';
import { corUrgencia, font, palette, radius } from '../theme';

function Shell({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { t } = useKairos();
  const nav = useNavigation<any>();
  const ins = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: ins.top + 12, paddingBottom: ins.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <T v="h1">{titulo}</T>
          <Pressable accessibilityLabel="Fechar" onPress={() => nav.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={18} />
          </Pressable>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({ label, value, onChange, placeholder, keyboard }: { label: string; value: string; onChange: (s: string) => void; placeholder: string; keyboard?: 'numeric' | 'default' }) {
  const { t } = useKairos();
  return (
    <View style={{ marginBottom: 16 }}>
      <T v="label" style={{ marginBottom: 8 }}>{label}</T>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={t.inkMute} keyboardType={keyboard}
        style={{ height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, paddingHorizontal: 16, fontSize: 16, color: t.ink, fontFamily: font.body }} />
    </View>
  );
}

function Categorias({ value, onChange }: { value: Categoria; onChange: (c: Categoria) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <T v="label" style={{ marginBottom: 8 }}>Categoria</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {CATEGORIAS.map(c => <Chip key={c.key} label={`${c.glyph} ${c.label}`} on={value === c.key} onPress={() => onChange(c.key)} />)}
      </View>
    </View>
  );
}

function Sucesso({ titulo, texto, onOk }: { titulo: string; texto: string; onOk: () => void }) {
  return (
    <Card tone="sol" style={{ alignItems: 'center', paddingVertical: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#16161A', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon name="check" size={30} color={palette.sol} stroke={2.6} />
      </View>
      <T v="h1" c="#16161A" style={{ textAlign: 'center' }}>{titulo}</T>
      <T c="#16161A" style={{ textAlign: 'center', marginTop: 6, marginBottom: 20 }}>{texto}</T>
      <Btn label="Voltar ao início" onPress={onOk} style={{ alignSelf: 'stretch' }} />
    </Card>
  );
}

export function Doar() {
  const k = useKairos();
  const nav = useNavigation<any>();
  const [nome, setNome] = useState('');
  const [cat, setCat] = useState<Categoria>('ALIMENTO');
  const [qtd, setQtd] = useState(10);
  const [peso, setPeso] = useState('');
  const [validade, setValidade] = useState('');
  const [doador, setDoador] = useState(k.usuario?.nome ?? '');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const pesoN = Number(peso.replace(',', '.'));
  const valido = nome.trim() && doador.trim() && pesoN > 0 && (!validade || /^\d{4}-\d{2}-\d{2}$/.test(validade));
  // quantas solicitacoes abertas dessa categoria esse recurso pode ajudar
  const ajuda = k.solicitacoes.filter(s => s.categoria === cat && s.status === 'ABERTA');

  const salvar = async () => {
    setErro('');
    try {
      await k.doar({ nome: nome.trim(), categoria: cat, quantidadeDisponivel: qtd, pesoKg: pesoN, validade: validade || null, doador: doador.trim() });
      tap('success'); setOk(true);
    } catch (e: any) { setErro(e.message ?? 'Não foi possível registrar. Confira os campos.'); }
  };

  if (ok) return <Shell titulo="Doar"><Sucesso titulo="Doação registrada" texto={`${qtd} × ${nome} já entram no próximo plano de entrega.`} onOk={() => nav.goBack()} /></Shell>;
  return (
    <Shell titulo="Doar um recurso">
      <Campo label="O que você vai doar" value={nome} onChange={setNome} placeholder="Ex.: cesta básica 12 kg" />
      <Categorias value={cat} onChange={setCat} />
      <T v="label" style={{ marginBottom: 8 }}>Quantidade</T>
      <Stepper value={qtd} onChange={setQtd} step={5} />
      <View style={{ height: 16 }} />
      <Campo label="Peso de cada unidade (kg)" value={peso} onChange={setPeso} placeholder="Ex.: 12" keyboard="numeric" />
      <Campo label="Validade (opcional, AAAA-MM-DD)" value={validade} onChange={setValidade} placeholder="2027-03-01" />
      <Campo label="Doador" value={doador} onChange={setDoador} placeholder="Seu nome ou da empresa" />
      {ajuda.length ? (
        <Card style={{ marginBottom: 16 }}>
          <T v="small">Hoje {ajuda.length} pedido{ajuda.length > 1 ? 's' : ''} de {catLabel(cat).toLowerCase()} {ajuda.length > 1 ? 'esperam' : 'espera'} por uma doação como essa.</T>
        </Card>
      ) : null}
      {erro ? <T c={palette.urgente} style={{ marginBottom: 12 }}>{erro}</T> : null}
      <Btn label="Registrar doação" disabled={!valido} onPress={salvar} />
    </Shell>
  );
}

export function Pedir() {
  const k = useKairos();
  const { t } = k;
  const nav = useNavigation<any>();
  const [com, setCom] = useState(k.comunidades[0]?.id ?? 1);
  const [cat, setCat] = useState<Categoria>('ALIMENTO');
  const [qtd, setQtd] = useState(20);
  const [urg, setUrg] = useState(3);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const c = k.comunidade(com);
  const prio = c ? k.prio({ id: 0, comunidadeId: com, categoria: cat, quantidade: qtd, urgencia: urg, status: 'ABERTA' }) : 0;
  const posicao = 1 + k.solicitacoes.filter(s => (s.status === 'ABERTA') && k.prio(s) > prio).length;

  const salvar = async () => {
    setErro('');
    try { await k.pedir({ comunidadeId: com, categoria: cat, quantidade: qtd, urgencia: urg }); tap('success'); setOk(true); }
    catch (e: any) { setErro(e.message ?? 'Não foi possível registrar o pedido.'); }
  };

  if (ok) return <Shell titulo="Pedir ajuda"><Sucesso titulo="Pedido registrado" texto={`${c?.nome} entrou na fila na posição ${posicao}. Avisaremos quando a entrega sair.`} onOk={() => nav.goBack()} /></Shell>;
  return (
    <Shell titulo="Pedir ajuda">
      <T v="label" style={{ marginBottom: 8 }}>Comunidade</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {k.comunidades.map(x => <Chip key={x.id} label={x.nome} on={com === x.id} onPress={() => setCom(x.id)} />)}
      </View>
      <Categorias value={cat} onChange={setCat} />
      <T v="label" style={{ marginBottom: 8 }}>Quantidade</T>
      <Stepper value={qtd} onChange={setQtd} step={5} />
      <T v="label" style={{ marginTop: 18, marginBottom: 8 }}>Urgência</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable key={n} onPress={() => { tap(); setUrg(n); }}
            style={{ flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: n <= urg ? corUrgencia(urg) : t.surfaceAlt }}>
            <T w="bold" c={n <= urg ? '#FFFFFF' : t.inkMute}>{n}</T>
          </Pressable>
        ))}
      </View>
      <T v="small" style={{ marginTop: 6 }}>1 = pode esperar · 5 = precisa hoje</T>

      <Card tone="ink" style={{ marginTop: 18, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <T v="small" c={t.dark ? '#5a5a62' : '#B9B9C0'}>Prioridade calculada</T>
          <T c={t.pillInk} style={{ marginTop: 2 }}>Entra em {posicao}º na fila de atendimento</T>
        </View>
        <T v="num" c={palette.sol}>{prio.toFixed(0)}</T>
      </Card>
      {erro ? <T c={palette.urgente} style={{ marginBottom: 12 }}>{erro}</T> : null}
      <Btn label="Enviar pedido" onPress={salvar} />
    </Shell>
  );
}
