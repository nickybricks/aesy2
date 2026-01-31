
## Plan: Preis-Update Funktion reparieren

### Problemanalyse

Nach ausführlicher Untersuchung habe ich folgende Probleme identifiziert:

1. **Doppelter API-Call im Test-Modus:** Der Test holt zuerst Quotes von FMP (für Logging), dann ruft `performBatchPriceUpdate` die API **erneut** auf. Wenn das FMP API-Limit erreicht ist, gibt der zweite Call ein Fehler-Objekt zurück und die `Array.isArray(quotes)` Prüfung schlägt fehl - das Update wird komplett übersprungen.

2. **Fehlendes Logging in `performBatchPriceUpdate`:** Es gibt keine Logs für:
   - Was die FMP API tatsächlich zurückgibt
   - Ob `existing` gefunden wurde
   - Ob das Update erfolgreich war oder fehlgeschlagen ist
   - Eventueller `updateError`

3. **API-Limit Problem:** Bei den Batch-Jobs sehe ich in den Logs immer wieder "Self-invoke failed" und "Http: connection closed" - das deutet auf API-Limits oder Timeouts hin.

### Lösung

#### Schritt 1: Besseres Logging hinzufügen

In `performBatchPriceUpdate` muss Logging hinzugefügt werden:

```typescript
async function performBatchPriceUpdate(...) {
  console.log(`[Price Update] Fetching quotes for ${symbols.length} symbols`);
  
  const quotes = await quoteResponse.json();
  
  // Log what FMP returned
  if (!Array.isArray(quotes)) {
    console.error(`[Price Update] FMP returned non-array:`, JSON.stringify(quotes));
    return 0;
  }
  
  console.log(`[Price Update] Got ${quotes.length} quotes from FMP`);
  
  for (const quote of quotes) {
    // ... existing code ...
    
    if (!existing?.analysis_result) {
      console.warn(`[Price Update] No cache entry found for ${quote.symbol} in ${marketId}`);
      continue;
    }
    
    // ... update code ...
    
    if (updateError) {
      console.error(`[Price Update] Update failed for ${quote.symbol}:`, updateError);
    } else {
      console.log(`[Price Update] Updated ${quote.symbol}: $${quote.price}`);
      updated++;
    }
  }
  
  return updated;
}
```

#### Schritt 2: Test-Modus Quote-Daten wiederverwenden

Im Test-Modus die bereits geholten Quotes an `performBatchPriceUpdate` übergeben oder die Quote-Daten direkt inline verarbeiten:

```typescript
// Option A: Quote direkt nutzen (schneller, kein doppelter API-Call)
if (body.testSymbol) {
  // ... fetch quote ...
  
  // Direkt updaten ohne performBatchPriceUpdate aufzurufen
  const result = await updateSingleStockPrice(symbol, fmpQuote[0], supabaseClient);
}
```

#### Schritt 3: API-Limit-Fehler erkennen und handhaben

```typescript
const quotes = await quoteResponse.json();

// Check for FMP error response
if (quotes && typeof quotes === 'object' && 'Error Message' in quotes) {
  console.error(`[Price Update] FMP API error:`, quotes['Error Message']);
  return 0;
}
```

#### Schritt 4: Update-Statement korrigieren

Das Update sollte auch `market_id` verwenden für eindeutige Identifizierung:

```typescript
.eq('symbol', quote.symbol)
.eq('market_id', actualMarketId)  // HINZUFÜGEN
```

### Dateien die geändert werden

| Datei | Änderungen |
|-------|------------|
| `supabase/functions/scheduled-quant-update/index.ts` | Logging, API-Error-Handling, Update-Statement Fix |

### Erwartetes Ergebnis

Nach der Implementierung:
1. Logs zeigen genau warum Updates fehlschlagen
2. Test-Modus macht nur 1 API-Call statt 2
3. API-Limit-Fehler werden erkannt und protokolliert
4. Updates werden mit korrektem `market_id` Constraint ausgeführt
5. Preise werden zuverlässig aktualisiert bei jedem Cron-Job

