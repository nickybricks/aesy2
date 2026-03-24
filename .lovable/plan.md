

## Plan: Hierarchical Sector/Industry Multi-Select Filter

### What changes

Replace the two separate "Sektor" and "Industrie" single-select dropdowns with one combined hierarchical multi-select dropdown component, matching the reference screenshots.

### 1. Create `SectorIndustryFilter` component

New file: `src/components/ui/sector-industry-filter.tsx`

A dropdown component with:
- **Trigger button** showing "Sektor / Industrie" label and a summary (e.g. "3 ausgewählt" or "Alle")
- **Dropdown panel** (absolute positioned, z-50) containing:
  - **Header row**: "Auswahl anzeigen" | "Auswahl löschen" links + close X button
  - **Search input**: filters the tree by sector/industry name
  - **Checkbox tree**: Sectors as parent nodes (collapsible with ▶/▼), Industries as children
    - Checking a sector checks all its industries
    - Unchecking all industries in a sector unchecks the sector
    - Partial selection shows indeterminate state
  - "Alle" checkbox at top to select/deselect all

**Sector-to-Industry mapping**: Built dynamically from `cachedStocks` data by grouping each stock's `industry` under its `sector`. This avoids hardcoding and works with whatever data is in the cache.

Props:
```typescript
interface SectorIndustryFilterProps {
  sectorIndustryMap: Map<string, string[]>; // sector → industries
  selectedIndustries: Set<string>;
  onSelectionChange: (industries: Set<string>) => void;
}
```

### 2. Update `ScreenerMode.tsx` filter state

- Remove `sector: 'all'` and `industry: 'all'` from filter state
- Add `selectedIndustries: Set<string>` (empty = all selected / no filter)
- Build `sectorIndustryMap` via `useMemo` grouping `cachedStocks` by sector→industry
- Replace the two separate `<Select>` blocks (Sektor + Industrie) with single `<SectorIndustryFilter>`
- Update filter logic: if `selectedIndustries` is non-empty, only show stocks whose `industry` is in the set

### 3. Filter logic update

```typescript
// Replace sector + industry filter lines with:
if (selectedIndustries.size > 0 && !selectedIndustries.has(stock.industry)) return false;
```

### Files affected
- **New**: `src/components/ui/sector-industry-filter.tsx`
- **Edit**: `src/components/ScreenerMode.tsx` (remove 2 selects, add new component, update state + filter logic)

