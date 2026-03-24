import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

// Morningstar-style super-sector grouping
const SUPER_SECTORS: Record<string, string[]> = {
  Cyclical: ['Basic Materials', 'Consumer Cyclical', 'Financial Services', 'Real Estate'],
  Defensive: ['Consumer Defensive', 'Healthcare', 'Utilities'],
  Sensitive: ['Communication Services', 'Energy', 'Industrials', 'Technology'],
};

const getSuperSector = (sector: string): string => {
  for (const [superSector, sectors] of Object.entries(SUPER_SECTORS)) {
    if (sectors.includes(sector)) return superSector;
  }
  return 'Other';
};

const SUPER_SECTOR_ORDER = ['Cyclical', 'Defensive', 'Sensitive', 'Other'];

interface SectorIndustryFilterProps {
  sectorIndustryMap: Map<string, string[]>;
  selectedIndustries: Set<string>;
  onSelectionChange: (industries: Set<string>) => void;
}

export function SectorIndustryFilter({
  sectorIndustryMap,
  selectedIndustries,
  onSelectionChange,
}: SectorIndustryFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const allIndustries = useMemo(() => {
    const set = new Set<string>();
    sectorIndustryMap.forEach((industries) => industries.forEach((i) => set.add(i)));
    return set;
  }, [sectorIndustryMap]);

  const filteredMap = useMemo(() => {
    if (!search.trim()) return sectorIndustryMap;
    const q = search.toLowerCase();
    const result = new Map<string, string[]>();
    sectorIndustryMap.forEach((industries, sector) => {
      if (sector.toLowerCase().includes(q)) {
        result.set(sector, industries);
      } else {
        const filtered = industries.filter((i) => i.toLowerCase().includes(q));
        if (filtered.length > 0) result.set(sector, filtered);
      }
    });
    return result;
  }, [sectorIndustryMap, search]);

  // Group sectors by super-sector
  const groupedBySuperSector = useMemo(() => {
    const groups = new Map<string, Map<string, string[]>>();
    filteredMap.forEach((industries, sector) => {
      const ss = getSuperSector(sector);
      if (!groups.has(ss)) groups.set(ss, new Map());
      groups.get(ss)!.set(sector, industries);
    });
    return groups;
  }, [filteredMap]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleSectorExpand = (sector: string) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      next.has(sector) ? next.delete(sector) : next.add(sector);
      return next;
    });
  };

  const toggleIndustry = (industry: string) => {
    const next = new Set(selectedIndustries);
    next.has(industry) ? next.delete(industry) : next.add(industry);
    onSelectionChange(next);
  };

  const toggleSector = (sector: string) => {
    const industries = sectorIndustryMap.get(sector) || [];
    const allSelected = industries.every((i) => selectedIndustries.has(i));
    const next = new Set(selectedIndustries);
    if (allSelected) {
      industries.forEach((i) => next.delete(i));
    } else {
      industries.forEach((i) => next.add(i));
    }
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (selectedIndustries.size === allIndustries.size) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allIndustries));
    }
  };

  const clearSelection = () => onSelectionChange(new Set());

  const toggleSuperSector = (superSector: string) => {
    const sectors = SUPER_SECTORS[superSector] || [];
    const allInds: string[] = [];
    sectors.forEach((s) => (sectorIndustryMap.get(s) || []).forEach((i) => allInds.push(i)));
    const allSelected = allInds.length > 0 && allInds.every((i) => selectedIndustries.has(i));
    const next = new Set(selectedIndustries);
    if (allSelected) {
      allInds.forEach((i) => next.delete(i));
    } else {
      allInds.forEach((i) => next.add(i));
    }
    onSelectionChange(next);
  };

  const getSuperSectorState = (superSector: string): 'all' | 'some' | 'none' => {
    const sectors = SUPER_SECTORS[superSector] || [];
    const allInds: string[] = [];
    sectors.forEach((s) => (sectorIndustryMap.get(s) || []).forEach((i) => allInds.push(i)));
    if (allInds.length === 0) return 'none';
    const count = allInds.filter((i) => selectedIndustries.has(i)).length;
    if (count === 0) return 'none';
    if (count === allInds.length) return 'all';
    return 'some';
  };

  const getSectorState = (sector: string): 'all' | 'some' | 'none' => {
    const industries = sectorIndustryMap.get(sector) || [];
    if (industries.length === 0) return 'none';
    const count = industries.filter((i) => selectedIndustries.has(i)).length;
    if (count === 0) return 'none';
    if (count === industries.length) return 'all';
    return 'some';
  };

  const summaryText = () => {
    if (selectedIndustries.size === 0) {
      return language === 'de' ? 'Alle' : 'All';
    }
    if (selectedIndustries.size === allIndustries.size) {
      return language === 'de' ? 'Alle' : 'All';
    }
    return `${selectedIndustries.size} ${language === 'de' ? 'ausgewählt' : 'selected'}`;
  };

  return (
    <div ref={ref} className="relative col-span-1 md:col-span-2 lg:col-span-3">
      <label className="text-sm font-medium leading-none mb-2 block">
        {language === 'de' ? 'Sektor / Industrie' : 'Sector / Industry'}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
      >
        <span className="truncate">{summaryText()}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-[400px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs">
            <button
              type="button"
              onClick={toggleAll}
              className="text-primary hover:underline"
            >
              {selectedIndustries.size === allIndustries.size
                ? (language === 'de' ? 'Alle abwählen' : 'Deselect all')
                : (language === 'de' ? 'Alle auswählen' : 'Select all')}
            </button>
            <div className="flex items-center gap-2">
              {selectedIndustries.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  {language === 'de' ? 'Auswahl löschen' : 'Clear'}
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'de' ? 'Suchen...' : 'Search...'}
                className="w-full h-8 pl-7 pr-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Tree grouped by super-sector */}
          <div className="overflow-y-auto flex-1 py-1">
            {/* All checkbox */}
            <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/50 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={selectedIndustries.size === allIndustries.size && allIndustries.size > 0}
                ref={(el) => {
                  if (el) el.indeterminate = selectedIndustries.size > 0 && selectedIndustries.size < allIndustries.size;
                }}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span>{language === 'de' ? 'Alle' : 'All'}</span>
            </label>

            {SUPER_SECTOR_ORDER
              .filter((ss) => groupedBySuperSector.has(ss))
              .map((superSector) => {
                const sectorsInGroup = groupedBySuperSector.get(superSector)!;
                const ssExpanded = expandedSectors.has(`ss:${superSector}`) || search.trim().length > 0;
                const ssState = getSuperSectorState(superSector);

                return (
                  <div key={superSector}>
                    {/* Super-sector row */}
                    <div className="flex items-center gap-1 px-3 py-1.5 hover:bg-accent/50 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => toggleSectorExpand(`ss:${superSector}`)}
                        className="shrink-0 p-0.5"
                      >
                        {ssExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <label className="flex items-center gap-2 flex-1 cursor-pointer text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={ssState === 'all'}
                          ref={(el) => {
                            if (el) el.indeterminate = ssState === 'some';
                          }}
                          onChange={() => toggleSuperSector(superSector)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span>{superSector}</span>
                      </label>
                    </div>

                    {ssExpanded &&
                      Array.from(sectorsInGroup.entries())
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([sector, industries]) => {
                          const sectorExpanded = expandedSectors.has(sector) || search.trim().length > 0;
                          const state = getSectorState(sector);

                          return (
                            <div key={sector}>
                              {/* Sector row */}
                              <div className="flex items-center gap-1 px-3 pl-7 py-1.5 hover:bg-accent/50 cursor-pointer">
                                <button
                                  type="button"
                                  onClick={() => toggleSectorExpand(sector)}
                                  className="shrink-0 p-0.5"
                                >
                                  {sectorExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </button>
                                <label className="flex items-center gap-2 flex-1 cursor-pointer text-sm font-medium">
                                  <input
                                    type="checkbox"
                                    checked={state === 'all'}
                                    ref={(el) => {
                                      if (el) el.indeterminate = state === 'some';
                                    }}
                                    onChange={() => toggleSector(sector)}
                                    className="h-4 w-4 rounded border-input accent-primary"
                                  />
                                  <span className="truncate">{sector}</span>
                                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                    ({industries.length})
                                  </span>
                                </label>
                              </div>

                              {/* Industries */}
                              {sectorExpanded &&
                                industries
                                  .sort((a, b) => a.localeCompare(b))
                                  .map((industry) => (
                                    <label
                                      key={industry}
                                      className="flex items-center gap-2 px-3 pl-14 py-1 hover:bg-accent/50 cursor-pointer text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedIndustries.has(industry)}
                                        onChange={() => toggleIndustry(industry)}
                                        className="h-4 w-4 rounded border-input accent-primary"
                                      />
                                      <span className="truncate">{industry}</span>
                                    </label>
                                  ))}
                            </div>
                          );
                        })}
                  </div>
                );
              })}

            {groupedBySuperSector.size === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === 'de' ? 'Keine Ergebnisse' : 'No results'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
