
## Plan: Preisupdates und Score-Konsistenz korrigieren

### 1. Bug-Fix: `allStocks.filter is not a function`

**Problem:** Die FMP API gibt manchmal ein Fehler-Objekt statt einem Array zurück

**Lösung in `scheduled-quant-update/index.ts` (Zeile 477-481):**

```typescript
const stocksResponse = await fetch(
  `https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`
);
const allStocksRaw = await stocksResponse.json();

// SAFETY CHECK: Ensure we have an array
if (!Array.isArray(allStocksRaw)) {
  console.error(`[${jobName}] FMP stock list API returned non-array:`, allStocksRaw);
  throw new Error(`FMP API error: ${allStocksRaw?.message || 'Invalid response'}`);
}

const allStocks = allStocksRaw;
```

---

### 2. Neue Update-Strategie: Montags Full-Analysis, sonst nur Preis

**Aktuelle Logik:** Full-Analysis wenn Daten > 7 Tage alt  
**Neue Logik:** 
- **Montags (morning):** Immer Full-Analysis für alle Aktien
- **Sonst (morning/noon/evening):** Nur Preis-Updates

**Änderung in `getAndCategorizeStocks()`:**

```typescript
// Bestimme ob heute Montag ist UND ob es der Morning-Job ist
const today = new Date();
const isMonday = today.getUTCDay() === 1;
const isMorningJob = trigger === 'morning';
const doFullAnalysisDay = isMonday && isMorningJob;

for (const stock of marketStocks) {
  if (doFullAnalysisDay) {
    // Montag morgens: Alles Full-Analysis
    fullAnalysis.push(stock.symbol);
  } else {
    // Alle anderen Jobs: Nur Preis-Update (wenn im Cache)
    const inCache = cacheMap.has(stock.symbol);
    if (inCache) {
      priceUpdate.push(stock.symbol);
    } else {
      // Neue Aktie, noch nicht im Cache -> Full-Analysis
      fullAnalysis.push(stock.symbol);
    }
  }
}
```

---

### 3. Buffett Score auf 14-Punkte-Skala umstellen

**Problem:** `calculateBuffettScore()` gibt 0-100 zurück, aber UI erwartet 0-14

**Lösung:** Die Funktion `calculateBuffettScore()` komplett ersetzen mit einer, die die 14 Kriterien zählt (basierend auf `buildCriteria`):

```typescript
function calculateBuffettScore(criteria: any): number {
  let score = 0;
  
  // 10 Basis-Kriterien
  if (criteria.yearsOfProfitability?.pass) score++;
  if (criteria.pe?.pass) score++;
  if (criteria.roic?.pass) score++;
  if (criteria.roe?.pass) score++;
  if (criteria.dividendYield?.pass) score++;
  if (criteria.netDebtToEbitda?.pass) score++;
  if (criteria.netMargin?.pass) score++;
  if (criteria.fcfMargin?.pass) score++;
  
  // EPS Growth: 3y, 5y (epsGrowth.pass), 10y
  if (criteria.epsGrowth?.cagr3y !== null && criteria.epsGrowth?.cagr3y >= 5) score++;
  if (criteria.epsGrowth?.pass) score++;  // 5y
  if (criteria.epsGrowth?.cagr10y !== null && criteria.epsGrowth?.cagr10y >= 5) score++;
  
  // Revenue Growth: 3y, 5y (revenueGrowth.pass), 10y
  if (criteria.revenueGrowth?.cagr3y !== null && criteria.revenueGrowth?.cagr3y >= 5) score++;
  if (criteria.revenueGrowth?.pass) score++;  // 5y
  if (criteria.revenueGrowth?.cagr10y !== null && criteria.revenueGrowth?.cagr10y >= 5) score++;
  
  return score; // 0-14
}
```

**In `performFullAnalysis()` ändern:**
```typescript
// Build criteria first
const criteria = buildCriteria(ratiosData, keyMetricsData, growthData, incomeStatements, cashFlow);

// Calculate score FROM criteria (not separately)
const buffettScore = calculateBuffettScore(criteria);

// Store with consistent score
await supabaseClient.from('stock_analysis_cache').upsert({
  ...
  buffett_score: buffettScore,  // 0-14
  analysis_result: {
    ...
    buffettScore: buffettScore,  // 0-14
    criteria
  }
});
```

---

### 4. Preis-Update auch KGV neu berechnen

**Problem:** Bei Preis-Updates wird nur der Preis aktualisiert, aber das KGV nicht

**Lösung in `performBatchPriceUpdate()`:**

```typescript
// Nach dem Preis-Update: KGV aus bestehenden Daten neu berechnen
const existingEps = existing.analysis_result?.eps || 
  (existing.analysis_result?.criteria?.pe?.value && existing.analysis_result.price 
    ? existing.analysis_result.price / existing.analysis_result.criteria.pe.value 
    : null);

const newPE = quote.price && existingEps && existingEps > 0 
  ? quote.price / existingEps 
  : existing.analysis_result?.criteria?.pe?.value;

// Update criteria.pe mit neuem KGV
const updatedCriteria = {
  ...existing.analysis_result.criteria,
  pe: {
    ...existing.analysis_result.criteria?.pe,
    value: newPE,
    pass: newPE != null && newPE > 0 && newPE < 20
  }
};

// Recalculate score
const newBuffettScore = calculateBuffettScore(updatedCriteria);

await supabaseClient.from('stock_analysis_cache').update({
  buffett_score: newBuffettScore,
  analysis_result: {
    ...existing.analysis_result,
    price: quote.price,
    buffettScore: newBuffettScore,
    criteria: updatedCriteria,
    ...
  },
  last_updated: new Date().toISOString()
});
```

---

### 5. Trigger-Parameter durchreichen

**Problem:** Die Funktion `getAndCategorizeStocks()` weiß nicht welcher Trigger-Typ es ist

**Lösung:** Den `trigger`-Parameter an die Funktion übergeben:

```typescript
async function getAndCategorizeStocks(
  marketId: string,
  jobName: string,
  trigger: string,  // NEU
  supabaseClient: any,
  FMP_API_KEY: string
)
```

---

### Zusammenfassung der Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/functions/scheduled-quant-update/index.ts` | Array-Check, Montags-Logik, Score 0-14, KGV-Update bei Preis |

### Erwartetes Ergebnis

1. **Morgen-/Mittag-/Abend-Jobs:** Nur Preis + KGV Updates (schnell, 1 API-Call pro 100 Aktien)
2. **Montag-Morgen:** Full-Analysis für alle Aktien (komplette Neubewertung)
3. **Buffett Score:** Konsistent 0-14 in DB und UI
4. **Keine Abstürze:** Array-Check verhindert `allStocks.filter is not a function`
