// Camada de dados: fala com a API KAIROS (Spring Boot + Oracle no Render).
// Se a API estiver "dormindo" ou sem rede, o app segue funcionando com dados locais
// e o mesmo algoritmo de otimizacao (mochila 0/1) rodando no aparelho.

export const API_URL = 'https://kairos-api-mwgk.onrender.com';

export type Categoria = 'ALIMENTO' | 'AGUA' | 'MEDICAMENTO' | 'VESTUARIO' | 'HIGIENE' | 'ABRIGO' | 'OUTROS';
export type StatusSolicitacao = 'ABERTA' | 'EM_ATENDIMENTO' | 'ATENDIDA' | 'CANCELADA';
export type StatusDistribuicao = 'PLANEJADA' | 'EM_ROTA' | 'ENTREGUE';

export type Comunidade = {
  id: number; nome: string; cidade: string; uf: string; populacao: number;
  indiceVulnerabilidade: number; latitude?: number; longitude?: number;
};
export type Recurso = {
  id: number; nome: string; categoria: Categoria; quantidadeDisponivel: number;
  pesoKg: number; validade?: string | null; doador: string;
};
export type Solicitacao = {
  id: number; comunidadeId: number; categoria: Categoria; quantidade: number;
  urgencia: number; status: StatusSolicitacao; dataSolicitacao?: string;
};
export type Distribuicao = {
  id: number | null; recursoId: number; solicitacaoId: number; quantidade: number;
  prioridade: number; status: StatusDistribuicao; data?: string;
};
export type Plano = {
  capacidadeKg: number; pesoUtilizadoKg: number; impactoTotal: number; distribuicoes: Distribuicao[];
};

export const CATEGORIAS: { key: Categoria; label: string; glyph: string }[] = [
  { key: 'ALIMENTO', label: 'Alimento', glyph: '🥫' },
  { key: 'AGUA', label: 'Água', glyph: '💧' },
  { key: 'MEDICAMENTO', label: 'Remédio', glyph: '💊' },
  { key: 'HIGIENE', label: 'Higiene', glyph: '🧼' },
  { key: 'ABRIGO', label: 'Abrigo', glyph: '🛏️' },
  { key: 'VESTUARIO', label: 'Roupas', glyph: '👕' },
  { key: 'OUTROS', label: 'Outros', glyph: '📦' },
];
export const catLabel = (c: Categoria) => CATEGORIAS.find(x => x.key === c)?.label ?? c;
export const catGlyph = (c: Categoria) => CATEGORIAS.find(x => x.key === c)?.glyph ?? '📦';

// Mesma regra da API (DistribuicaoBO): urgencia x vulnerabilidade x log10(populacao)
export function pesoSocial(c: Comunidade) {
  return c.indiceVulnerabilidade * Math.log10(Math.max(c.populacao, 10));
}
export function prioridade(s: Solicitacao, c?: Comunidade) {
  if (!c) return 0;
  return Math.round(s.urgencia * pesoSocial(c) * 100) / 100;
}

// ---------------------------------------------------------------- HTTP
async function http<T>(path: string, init?: RequestInit, timeoutMs = 9000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API_URL + path, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.mensagem || body?.message || `Erro ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : await res.json();
  } finally {
    clearTimeout(t);
  }
}

export const api = {
  ping: () => http<{ status: string }>('/', undefined, 60000),
  comunidades: () => http<Comunidade[]>('/api/comunidades'),
  recursos: () => http<Recurso[]>('/api/recursos'),
  solicitacoes: () => http<Solicitacao[]>('/api/solicitacoes'),
  distribuicoes: () => http<Distribuicao[]>('/api/distribuicoes'),
  novoRecurso: (r: Omit<Recurso, 'id'>) => http<Recurso>('/api/recursos', { method: 'POST', body: JSON.stringify(r) }),
  novaSolicitacao: (s: Omit<Solicitacao, 'id' | 'status'>) =>
    http<Solicitacao>('/api/solicitacoes', { method: 'POST', body: JSON.stringify(s) }),
  otimizar: (capacidadeKg: number, confirmar: boolean) =>
    http<Plano>(`/api/distribuicoes/otimizar?capacidadeKg=${capacidadeKg}&confirmar=${confirmar}`, { method: 'POST' }),
  atualizarDistribuicao: (id: number, status: StatusDistribuicao) =>
    http<Distribuicao>(`/api/distribuicoes/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ---------------------------------------------------------------- otimizacao local (mesmo algoritmo da API)
export function otimizarLocal(
  capacidadeKg: number, recursos: Recurso[], solicitacoes: Solicitacao[], comunidades: Comunidade[],
): Plano {
  const hoje = new Date().toISOString().slice(0, 10);
  const disp = recursos.filter(r => (!r.validade || r.validade >= hoje) && r.quantidadeDisponivel > 0);
  type Item = { s: Solicitacao; r: Recurso; qtd: number; peso: number; valor: number };
  const itens: Item[] = [];
  for (const s of solicitacoes.filter(x => x.status === 'ABERTA')) {
    const r = disp.filter(x => x.categoria === s.categoria)
      .sort((a, b) => b.quantidadeDisponivel - a.quantidadeDisponivel)[0];
    if (!r) continue;
    const q = Math.min(s.quantidade, r.quantidadeDisponivel);
    const c = comunidades.find(x => x.id === s.comunidadeId);
    itens.push({ s, r, qtd: q, peso: Math.ceil(q * r.pesoKg), valor: (prioridade(s, c) * q) / s.quantidade });
  }
  const W = Math.floor(capacidadeKg), n = itens.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const it = itens[i - 1];
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w];
      if (it.peso <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - it.peso] + it.valor);
    }
  }
  const plano: Distribuicao[] = [];
  let w = W, peso = 0;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      const it = itens[i - 1];
      w -= it.peso; peso += it.peso;
      plano.push({ id: null, recursoId: it.r.id, solicitacaoId: it.s.id, quantidade: it.qtd,
        prioridade: Math.round(it.valor * 100) / 100, status: 'PLANEJADA', data: hoje });
    }
  }
  plano.sort((a, b) => b.prioridade - a.prioridade);
  return { capacidadeKg, pesoUtilizadoKg: peso, impactoTotal: Math.round(dp[n][W] * 100) / 100, distribuicoes: plano };
}

// ---------------------------------------------------------------- dados de demonstracao (espelham o banco)
export const seed = {
  comunidades: [
    { id: 1, nome: 'Jardim Ângela', cidade: 'São Paulo', uf: 'SP', populacao: 4200, indiceVulnerabilidade: 9 },
    { id: 2, nome: 'Paraisópolis', cidade: 'São Paulo', uf: 'SP', populacao: 6100, indiceVulnerabilidade: 8 },
    { id: 3, nome: 'Vila Nova Paraíso', cidade: 'Guarulhos', uf: 'SP', populacao: 2800, indiceVulnerabilidade: 7 },
    { id: 4, nome: 'Morro do Sol', cidade: 'Osasco', uf: 'SP', populacao: 1500, indiceVulnerabilidade: 5 },
    { id: 5, nome: 'Jardim Inamar', cidade: 'Diadema', uf: 'SP', populacao: 2300, indiceVulnerabilidade: 6 },
  ] as Comunidade[],
  recursos: [
    { id: 1, nome: 'Cesta básica 12 kg', categoria: 'ALIMENTO', quantidadeDisponivel: 300, pesoKg: 12, validade: '2027-03-01', doador: 'Banco de Alimentos SP' },
    { id: 2, nome: 'Galão de água 5 L', categoria: 'AGUA', quantidadeDisponivel: 500, pesoKg: 5, validade: '2027-06-01', doador: 'Mercado União' },
    { id: 3, nome: 'Kit higiene', categoria: 'HIGIENE', quantidadeDisponivel: 200, pesoKg: 1.5, validade: null, doador: 'ONG Mãos Dadas' },
    { id: 4, nome: 'Cobertor casal', categoria: 'ABRIGO', quantidadeDisponivel: 150, pesoKg: 2, validade: null, doador: 'Campanha do Agasalho' },
    { id: 5, nome: 'Kit primeiros socorros', categoria: 'MEDICAMENTO', quantidadeDisponivel: 80, pesoKg: 0.8, validade: '2028-01-15', doador: 'Farmácia Vida' },
  ] as Recurso[],
  solicitacoes: [
    { id: 1, comunidadeId: 1, categoria: 'ALIMENTO', quantidade: 40, urgencia: 5, status: 'ABERTA', dataSolicitacao: '2026-11-15' },
    { id: 2, comunidadeId: 1, categoria: 'AGUA', quantidade: 60, urgencia: 4, status: 'ABERTA', dataSolicitacao: '2026-11-15' },
    { id: 3, comunidadeId: 2, categoria: 'MEDICAMENTO', quantidade: 30, urgencia: 5, status: 'ABERTA', dataSolicitacao: '2026-11-16' },
    { id: 4, comunidadeId: 3, categoria: 'ABRIGO', quantidade: 80, urgencia: 3, status: 'ABERTA', dataSolicitacao: '2026-11-16' },
    { id: 5, comunidadeId: 4, categoria: 'HIGIENE', quantidade: 60, urgencia: 2, status: 'ABERTA', dataSolicitacao: '2026-11-17' },
    { id: 6, comunidadeId: 5, categoria: 'ALIMENTO', quantidade: 25, urgencia: 4, status: 'ATENDIDA', dataSolicitacao: '2026-11-12' },
    { id: 7, comunidadeId: 2, categoria: 'AGUA', quantidade: 40, urgencia: 3, status: 'ATENDIDA', dataSolicitacao: '2026-11-13' },
  ] as Solicitacao[],
  distribuicoes: [
    { id: 1, recursoId: 1, solicitacaoId: 6, quantidade: 25, prioridade: 18.8, status: 'ENTREGUE', data: '2026-11-13' },
    { id: 2, recursoId: 2, solicitacaoId: 7, quantidade: 40, prioridade: 22.7, status: 'ENTREGUE', data: '2026-11-14' },
  ] as Distribuicao[],
};
