import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import { QuantAnalysisResult } from '@/api/quantAnalyzerApi';
import { Filter, ChevronDown } from 'lucide-react';
import { RangeFilterDropdown } from '@/components/ui/range-filter-dropdown';
import { SectorIndustryFilter } from '@/components/ui/sector-industry-filter';

interface ScreenerModeProps {
  cachedStocks: QuantAnalysisResult[];
}

export const ScreenerMode = ({ cachedStocks }: ScreenerModeProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    minAesyScore: '',
    maxAesyScore: '',
    minYearsProfit: '',
    maxYearsProfit: '',
    minPE: '',
    maxPE: '',
    minROIC: '',
    maxROIC: '',
    minROE: '',
    maxROE: '',
    minDividendYield: '',
    maxDividendYield: '',
    minEpsGrowth3y: '',
    maxEpsGrowth3y: '',
    minEpsGrowth: '',
    maxEpsGrowth: '',
    minEpsGrowth10y: '',
    maxEpsGrowth10y: '',
    minRevenueGrowth3y: '',
    maxRevenueGrowth3y: '',
    minRevenueGrowth: '',
    maxRevenueGrowth: '',
    minRevenueGrowth10y: '',
    maxRevenueGrowth10y: '',
    minNetDebtToEbitda: '',
    maxNetDebtToEbitda: '',
    minNetMargin: '',
    maxNetMargin: '',
    minFcfMargin: '',
    maxFcfMargin: '',
    exchange: 'all',
    searchQuery: ''
  });

  const sectorIndustryMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const stock of cachedStocks) {
      const sector = stock.sector?.trim();
      const industry = stock.industry?.trim();
      if (!sector || !industry) continue;
      if (!map.has(sector)) map.set(sector, new Set());
      map.get(sector)!.add(industry);
    }
    const result = new Map<string, string[]>();
    map.forEach((industries, sector) => result.set(sector, Array.from(industries)));
    return result;
  }, [cachedStocks]);

  const filteredStocks = useMemo(() => {
    const uniqueStocksMap = new Map<string, typeof cachedStocks[0]>();
    for (const stock of cachedStocks) {
      if (!stock?.symbol) continue;
      if (!uniqueStocksMap.has(stock.symbol)) {
        uniqueStocksMap.set(stock.symbol, stock);
      }
    }
    const uniqueStocks = Array.from(uniqueStocksMap.values());
    
    return uniqueStocks.filter(stock => {
      if (!stock?.criteria) return false;
      
      if (filters.minAesyScore !== '' && stock.buffettScore < parseFloat(filters.minAesyScore)) return false;
      if (filters.maxAesyScore !== '' && stock.buffettScore > parseFloat(filters.maxAesyScore)) return false;
      if (filters.minYearsProfit !== '' && stock.criteria.yearsOfProfitability?.value != null && stock.criteria.yearsOfProfitability.value < parseFloat(filters.minYearsProfit)) return false;
      if (filters.maxYearsProfit !== '' && stock.criteria.yearsOfProfitability?.value != null && stock.criteria.yearsOfProfitability.value > parseFloat(filters.maxYearsProfit)) return false;
      if (filters.minPE !== '' && stock.criteria.pe?.value != null && stock.criteria.pe.value < parseFloat(filters.minPE)) return false;
      if (filters.maxPE !== '' && stock.criteria.pe?.value != null && stock.criteria.pe.value > parseFloat(filters.maxPE)) return false;
      if (filters.minROIC !== '' && stock.criteria.roic?.value != null && stock.criteria.roic.value < parseFloat(filters.minROIC)) return false;
      if (filters.maxROIC !== '' && stock.criteria.roic?.value != null && stock.criteria.roic.value > parseFloat(filters.maxROIC)) return false;
      if (filters.minROE !== '' && stock.criteria.roe?.value != null && stock.criteria.roe.value < parseFloat(filters.minROE)) return false;
      if (filters.maxROE !== '' && stock.criteria.roe?.value != null && stock.criteria.roe.value > parseFloat(filters.maxROE)) return false;
      if (filters.minDividendYield !== '' && stock.criteria.dividendYield?.value != null && stock.criteria.dividendYield.value < parseFloat(filters.minDividendYield)) return false;
      if (filters.maxDividendYield !== '' && stock.criteria.dividendYield?.value != null && stock.criteria.dividendYield.value > parseFloat(filters.maxDividendYield)) return false;
      if (filters.minEpsGrowth3y !== '' && stock.criteria.epsGrowth?.cagr3y != null && stock.criteria.epsGrowth.cagr3y < parseFloat(filters.minEpsGrowth3y)) return false;
      if (filters.maxEpsGrowth3y !== '' && stock.criteria.epsGrowth?.cagr3y != null && stock.criteria.epsGrowth.cagr3y > parseFloat(filters.maxEpsGrowth3y)) return false;
      if (filters.minEpsGrowth !== '' && stock.criteria.epsGrowth?.value != null && stock.criteria.epsGrowth.value < parseFloat(filters.minEpsGrowth)) return false;
      if (filters.maxEpsGrowth !== '' && stock.criteria.epsGrowth?.value != null && stock.criteria.epsGrowth.value > parseFloat(filters.maxEpsGrowth)) return false;
      if (filters.minEpsGrowth10y !== '' && stock.criteria.epsGrowth?.cagr10y != null && stock.criteria.epsGrowth.cagr10y < parseFloat(filters.minEpsGrowth10y)) return false;
      if (filters.maxEpsGrowth10y !== '' && stock.criteria.epsGrowth?.cagr10y != null && stock.criteria.epsGrowth.cagr10y > parseFloat(filters.maxEpsGrowth10y)) return false;
      if (filters.minRevenueGrowth3y !== '' && stock.criteria.revenueGrowth?.cagr3y != null && stock.criteria.revenueGrowth.cagr3y < parseFloat(filters.minRevenueGrowth3y)) return false;
      if (filters.maxRevenueGrowth3y !== '' && stock.criteria.revenueGrowth?.cagr3y != null && stock.criteria.revenueGrowth.cagr3y > parseFloat(filters.maxRevenueGrowth3y)) return false;
      if (filters.minRevenueGrowth !== '' && stock.criteria.revenueGrowth?.value != null && stock.criteria.revenueGrowth.value < parseFloat(filters.minRevenueGrowth)) return false;
      if (filters.maxRevenueGrowth !== '' && stock.criteria.revenueGrowth?.value != null && stock.criteria.revenueGrowth.value > parseFloat(filters.maxRevenueGrowth)) return false;
      if (filters.minRevenueGrowth10y !== '' && stock.criteria.revenueGrowth?.cagr10y != null && stock.criteria.revenueGrowth.cagr10y < parseFloat(filters.minRevenueGrowth10y)) return false;
      if (filters.maxRevenueGrowth10y !== '' && stock.criteria.revenueGrowth?.cagr10y != null && stock.criteria.revenueGrowth.cagr10y > parseFloat(filters.maxRevenueGrowth10y)) return false;
      if (filters.minNetDebtToEbitda !== '' && stock.criteria.netDebtToEbitda?.value != null && stock.criteria.netDebtToEbitda.value < parseFloat(filters.minNetDebtToEbitda)) return false;
      if (filters.maxNetDebtToEbitda !== '' && stock.criteria.netDebtToEbitda?.value != null && stock.criteria.netDebtToEbitda.value > parseFloat(filters.maxNetDebtToEbitda)) return false;
      if (filters.minNetMargin !== '' && stock.criteria.netMargin?.value != null && stock.criteria.netMargin.value < parseFloat(filters.minNetMargin)) return false;
      if (filters.maxNetMargin !== '' && stock.criteria.netMargin?.value != null && stock.criteria.netMargin.value > parseFloat(filters.maxNetMargin)) return false;
      if (filters.minFcfMargin !== '' && stock.criteria.fcfMargin?.value != null && stock.criteria.fcfMargin.value < parseFloat(filters.minFcfMargin)) return false;
      if (filters.maxFcfMargin !== '' && stock.criteria.fcfMargin?.value != null && stock.criteria.fcfMargin.value > parseFloat(filters.maxFcfMargin)) return false;
      
      // Sector/Industry multi-select filter
      if (selectedIndustries.size > 0 && !selectedIndustries.has(stock.industry)) return false;
      
      if (filters.exchange !== 'all' && stock.exchange !== filters.exchange) return false;
      
      if (filters.searchQuery && !stock.symbol?.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
          !stock.name?.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      
      return true;
    });
  }, [cachedStocks, filters, selectedIndustries]);

  const exchanges = useMemo(() => {
    const uniqueExchanges = new Set(cachedStocks.map(s => s.exchange).filter(e => e && e.trim() !== ''));
    return Array.from(uniqueExchanges).sort();
  }, [cachedStocks]);

  return (
    <div className="space-y-6">
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Card className="p-6">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Filter</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Sector / Industry combined filter */}
              <SectorIndustryFilter
                sectorIndustryMap={sectorIndustryMap}
                selectedIndustries={selectedIndustries}
                onSelectionChange={setSelectedIndustries}
              />

              {/* Exchange */}
              <div className="space-y-2">
                <Label>Börse</Label>
                <Select value={filters.exchange} onValueChange={(value) => setFilters({ ...filters, exchange: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Börsen</SelectItem>
                    {exchanges.map(exchange => (
                      <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aesy Score */}
              <RangeFilterDropdown
                label="Aesy Score (0-14)"
                minValue={filters.minAesyScore}
                maxValue={filters.maxAesyScore}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minAesyScore: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxAesyScore: value })), [])}
              />

              <RangeFilterDropdown
                label="KGV"
                minValue={filters.minPE}
                maxValue={filters.maxPE}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minPE: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxPE: value })), [])}
              />

              <RangeFilterDropdown
                label="ROIC (%)"
                minValue={filters.minROIC}
                maxValue={filters.maxROIC}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minROIC: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxROIC: value })), [])}
              />

              <RangeFilterDropdown
                label="ROE (%)"
                minValue={filters.minROE}
                maxValue={filters.maxROE}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minROE: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxROE: value })), [])}
              />

              <RangeFilterDropdown
                label="Dividende (%)"
                minValue={filters.minDividendYield}
                maxValue={filters.maxDividendYield}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minDividendYield: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxDividendYield: value })), [])}
              />

              <RangeFilterDropdown
                label="Umsatz-Wachstum (%)"
                minValue={filters.minRevenueGrowth}
                maxValue={filters.maxRevenueGrowth}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minRevenueGrowth: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxRevenueGrowth: value })), [])}
              />

              <RangeFilterDropdown
                label="Jahre profitabel"
                minValue={filters.minYearsProfit}
                maxValue={filters.maxYearsProfit}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minYearsProfit: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxYearsProfit: value })), [])}
              />

              <RangeFilterDropdown
                label="EPS-Wachstum 3J (%)"
                minValue={filters.minEpsGrowth3y}
                maxValue={filters.maxEpsGrowth3y}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minEpsGrowth3y: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxEpsGrowth3y: value })), [])}
              />

              <RangeFilterDropdown
                label="EPS-Wachstum 5J (%)"
                minValue={filters.minEpsGrowth}
                maxValue={filters.maxEpsGrowth}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minEpsGrowth: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxEpsGrowth: value })), [])}
              />

              <RangeFilterDropdown
                label="EPS-Wachstum 10J (%)"
                minValue={filters.minEpsGrowth10y}
                maxValue={filters.maxEpsGrowth10y}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minEpsGrowth10y: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxEpsGrowth10y: value })), [])}
              />

              <RangeFilterDropdown
                label="Umsatz-Wachstum 3J (%)"
                minValue={filters.minRevenueGrowth3y}
                maxValue={filters.maxRevenueGrowth3y}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minRevenueGrowth3y: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxRevenueGrowth3y: value })), [])}
              />

              <RangeFilterDropdown
                label="Umsatz-Wachstum 10J (%)"
                minValue={filters.minRevenueGrowth10y}
                maxValue={filters.maxRevenueGrowth10y}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minRevenueGrowth10y: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxRevenueGrowth10y: value })), [])}
              />

              <RangeFilterDropdown
                label="Verschuldung (NetDebt/EBITDA)"
                minValue={filters.minNetDebtToEbitda}
                maxValue={filters.maxNetDebtToEbitda}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minNetDebtToEbitda: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxNetDebtToEbitda: value })), [])}
              />

              <RangeFilterDropdown
                label="Nettomarge (%)"
                minValue={filters.minNetMargin}
                maxValue={filters.maxNetMargin}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minNetMargin: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxNetMargin: value })), [])}
              />

              <RangeFilterDropdown
                label="FCF-Marge (%)"
                minValue={filters.minFcfMargin}
                maxValue={filters.maxFcfMargin}
                onMinChange={useCallback((value: string) => setFilters(prev => ({ ...prev, minFcfMargin: value })), [])}
                onMaxChange={useCallback((value: string) => setFilters(prev => ({ ...prev, maxFcfMargin: value })), [])}
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{filteredStocks.length} Aktien</h2>
        <Input
          placeholder="Suche (Symbol/Name)"
          value={filters.searchQuery}
          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
          className="max-w-md"
        />
      </div>

      {filteredStocks.length > 0 ? (
        <QuantAnalysisTable 
          results={filteredStocks} 
          isLoading={false}
        />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Keine Aktien gefunden, die den Filter-Kriterien entsprechen.
          </p>
        </Card>
      )}
    </div>
  );
};
