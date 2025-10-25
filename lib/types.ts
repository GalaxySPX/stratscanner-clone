export type Timeframe = 'M'|'W'|'D'|'60'|'30'|'15'|'5';
export type StratPattern =
  '1'|'2U'|'2D'|'3'|'2-2U'|'2-2D'|'3-2U'|'3-2D'|'2-1-2U'|'2-1-2D'|'1-2U-2U'|'1-2D-2D';

export interface ScanFilters {
  timeframes: Timeframe[];
  minPrice?: number; maxPrice?: number; minVol?: number;
  sector?: string; includeWicks?: boolean;
  pattern?: StratPattern | 'any';
}

export interface ScanRow {
  symbol: string; sector: string; tf: Timeframe; pattern: StratPattern;
  open: number; high: number; low: number; close: number; atr: number; vol: number;
}

export interface ScanResponse { rows: ScanRow[]; asOf: string; }
