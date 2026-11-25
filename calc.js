// Regras de taxa da Shopee e cálculos compartilhados pelas calculadoras Precifica.
// Fontes e data de referência: ver rodapé das páginas. Atualize TIERS quando a Shopee mudar.
// CALC-START
const TIERS = [
  {lo: 0,   com: 0.50, fix: 0},
  {lo: 8,   com: 0.20, fix: 4.5},
  {lo: 80,  com: 0.14, fix: 16},
  {lo: 100, com: 0.14, fix: 20},
  {lo: 200, com: 0.14, fix: 26},
];
const DAS_MEI = 82.05, CPF_EXTRA = 3;

function tierIdx(p){ let i = 0; TIERS.forEach((t, k) => { if (p >= t.lo) i = k; }); return i; }

// s = {custo, emb, reg, cpf450, vendas, aliq, ads, dev, camp}
function fixedPerSale(s){
  const das = s.reg === 'mei' ? DAS_MEI / Math.max(1, s.vendas || 1) : 0;
  const extra = (s.reg === 'cpf' && s.cpf450) ? CPF_EXTRA : 0;
  return {das, extra};
}
function pctTax(s){ return s.reg === 'sn' ? (s.aliq || 0) : 0; }

function breakdown(p, s){
  const t = TIERS[tierIdx(p)], {das, extra} = fixedPerSale(s), imp = pctTax(s);
  const it = {
    comissao: p * t.com, fixa: t.fix, extra, imposto: p * imp,
    ads: p * s.ads, dev: p * s.dev, camp: p * s.camp, custo: s.custo, emb: s.emb, das,
  };
  const lucro = p - Object.values(it).reduce((a, b) => a + b, 0);
  return {tier: t, it, lucro, margem: p > 0 ? lucro / p : 0};
}

function priceFor(m, s){
  const {das, extra} = fixedPerSale(s);
  const varPct = pctTax(s) + s.ads + s.dev + s.camp;
  let best = null;
  TIERS.forEach((t, i) => {
    const den = 1 - t.com - varPct - m;
    if (den <= 0) return;
    const hi = i < TIERS.length - 1 ? TIERS[i + 1].lo : Infinity;
    const cand = Math.max((s.custo + s.emb + das + extra + t.fix) / den, t.lo);
    if (cand < hi && (best === null || cand < best)) best = cand;
  });
  return best;
}

// Se baixar o preço para logo abaixo da faixa atual der mais lucro, devolve a dica
function stepTip(p, s){
  const i = tierIdx(p);
  if (i < 2) return null;
  const below = Math.round((TIERS[i].lo - 0.01) * 100) / 100;
  const now = breakdown(p, s).lucro, alt = breakdown(below, s).lucro;
  return alt > now ? {below, ganho: alt - now} : null;
}
// ROAS (faturamento ÷ gasto em anúncios) necessário para sobrar a margem m, sem contar o anúncio atual
function roasFor(p, s, m){
  const base = breakdown(p, {...s, ads: 0}).lucro - m * p;
  return base > 0 ? p / base : null;
}
// CALC-END
