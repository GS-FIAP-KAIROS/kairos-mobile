import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  api, seed, otimizarLocal, prioridade,
  Comunidade, Recurso, Solicitacao, Distribuicao, Plano, StatusDistribuicao,
} from './api';
import { dark, light, Theme } from './theme';

export type Papel = 'doador' | 'comunidade' | 'equipe';
export type Usuario = { nome: string; papel: Papel };
type Fonte = 'conectando' | 'api' | 'local';

type Ctx = {
  t: Theme; escuro: boolean; alternarTema: () => void;
  usuario: Usuario | null; entrar: (u: Usuario) => void; sair: () => void;
  fonte: Fonte; recarregar: () => Promise<void>;
  comunidades: Comunidade[]; recursos: Recurso[]; solicitacoes: Solicitacao[]; distribuicoes: Distribuicao[];
  comunidade: (id: number) => Comunidade | undefined;
  recurso: (id: number) => Recurso | undefined;
  solicitacao: (id: number) => Solicitacao | undefined;
  prio: (s: Solicitacao) => number;
  doar: (r: Omit<Recurso, 'id'>) => Promise<void>;
  pedir: (s: Omit<Solicitacao, 'id' | 'status'>) => Promise<void>;
  simular: (capacidadeKg: number) => Promise<Plano>;
  confirmar: (capacidadeKg: number, plano: Plano) => Promise<void>;
  avancar: (d: Distribuicao) => Promise<void>;
  impacto: { kg: number; atendidas: number; abertas: number; familias: number; sequencia: number };
};

const C = createContext<Ctx>(null as unknown as Ctx);
export const useKairos = () => useContext(C);

const proximo: Record<StatusDistribuicao, StatusDistribuicao> = { PLANEJADA: 'EM_ROTA', EM_ROTA: 'ENTREGUE', ENTREGUE: 'ENTREGUE' };

export function KairosProvider({ children }: { children: React.ReactNode }) {
  const [escuro, setEscuro] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fonte, setFonte] = useState<Fonte>('conectando');
  const [comunidades, setCom] = useState<Comunidade[]>(seed.comunidades);
  const [recursos, setRec] = useState<Recurso[]>(seed.recursos);
  const [solicitacoes, setSol] = useState<Solicitacao[]>(seed.solicitacoes);
  const [distribuicoes, setDis] = useState<Distribuicao[]>(seed.distribuicoes);

  useEffect(() => {
    AsyncStorage.multiGet(['kairos.usuario', 'kairos.escuro']).then(([[, u], [, e]]) => {
      if (u) setUsuario(JSON.parse(u));
      if (e) setEscuro(e === '1');
    }).catch(() => {});
  }, []);

  const recarregar = useCallback(async () => {
    setFonte('conectando');
    try {
      await api.ping(); // acorda a instancia gratuita do Render
      const [c, r, s, d] = await Promise.all([api.comunidades(), api.recursos(), api.solicitacoes(), api.distribuicoes()]);
      if (!c.length) throw new Error('API sem dados');
      setCom(c); setRec(r); setSol(s); setDis(d); setFonte('api');
    } catch {
      setFonte('local');
    }
  }, []);
  useEffect(() => { recarregar(); }, [recarregar]);

  const comunidade = useCallback((id: number) => comunidades.find(c => c.id === id), [comunidades]);
  const recurso = useCallback((id: number) => recursos.find(r => r.id === id), [recursos]);
  const solicitacao = useCallback((id: number) => solicitacoes.find(s => s.id === id), [solicitacoes]);
  const prio = useCallback((s: Solicitacao) => prioridade(s, comunidade(s.comunidadeId)), [comunidade]);
  const nextId = (arr: { id: number | null }[]) => Math.max(0, ...arr.map(x => x.id ?? 0)) + 1;

  const doar: Ctx['doar'] = async (r) => {
    if (fonte === 'api') { const n = await api.novoRecurso(r); setRec(x => [n, ...x]); return; }
    setRec(x => [{ ...r, id: nextId(x) }, ...x]);
  };
  const pedir: Ctx['pedir'] = async (s) => {
    if (fonte === 'api') { const n = await api.novaSolicitacao(s); setSol(x => [n, ...x]); return; }
    setSol(x => [{ ...s, id: nextId(x), status: 'ABERTA', dataSolicitacao: new Date().toISOString().slice(0, 10) }, ...x]);
  };
  const simular: Ctx['simular'] = async (cap) => {
    if (fonte === 'api') {
      try { return await api.otimizar(cap, false); } catch { /* usa o calculo local */ }
    }
    return otimizarLocal(cap, recursos, solicitacoes, comunidades);
  };
  const confirmar: Ctx['confirmar'] = async (cap, plano) => {
    if (fonte === 'api') {
      try { await api.otimizar(cap, true); await recarregar(); return; } catch { /* segue local */ }
    }
    let id = nextId(distribuicoes);
    const novas = plano.distribuicoes.map(d => ({ ...d, id: id++ }));
    setDis(x => [...novas, ...x]);
    setSol(x => x.map(s => (novas.some(d => d.solicitacaoId === s.id) ? { ...s, status: 'EM_ATENDIMENTO' } : s)));
    setRec(x => x.map(r => {
      const usado = novas.filter(d => d.recursoId === r.id).reduce((a, d) => a + d.quantidade, 0);
      return usado ? { ...r, quantidadeDisponivel: r.quantidadeDisponivel - usado } : r;
    }));
  };
  const avancar: Ctx['avancar'] = async (d) => {
    const st = proximo[d.status];
    if (fonte === 'api' && d.id) { try { await api.atualizarDistribuicao(d.id, st); } catch { /* local */ } }
    setDis(x => x.map(y => (y.id === d.id ? { ...y, status: st } : y)));
    if (st === 'ENTREGUE') setSol(x => x.map(s => (s.id === d.solicitacaoId ? { ...s, status: 'ATENDIDA' } : s)));
  };

  const impacto = useMemo(() => {
    const entregues = distribuicoes.filter(d => d.status === 'ENTREGUE');
    const kg = entregues.reduce((a, d) => a + d.quantidade * (recursos.find(r => r.id === d.recursoId)?.pesoKg ?? 0), 0);
    const atendidas = solicitacoes.filter(s => s.status === 'ATENDIDA').length;
    const abertas = solicitacoes.filter(s => s.status === 'ABERTA' || s.status === 'EM_ATENDIMENTO').length;
    const familias = Math.round(kg / 12); // ~1 cesta (12 kg) por familia
    const dias = new Set(entregues.map(d => d.data)).size;
    return { kg: Math.round(kg), atendidas, abertas, familias, sequencia: Math.max(dias, 1) };
  }, [distribuicoes, recursos, solicitacoes]);

  const value: Ctx = {
    t: escuro ? dark : light, escuro,
    alternarTema: () => setEscuro(v => { AsyncStorage.setItem('kairos.escuro', v ? '0' : '1').catch(() => {}); return !v; }),
    usuario,
    entrar: (u) => { setUsuario(u); AsyncStorage.setItem('kairos.usuario', JSON.stringify(u)).catch(() => {}); },
    sair: () => { setUsuario(null); AsyncStorage.removeItem('kairos.usuario').catch(() => {}); },
    fonte, recarregar, comunidades, recursos, solicitacoes, distribuicoes,
    comunidade, recurso, solicitacao, prio, doar, pedir, simular, confirmar, avancar, impacto,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
