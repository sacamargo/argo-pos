/** Line used to compute sale/day profitability from historical snapshots. */
export type ProfitLineInput = {
  unitPriceCentsSnapshot: number;
  unitCostCentsSnapshot: number | null;
  quantity: number;
};

export type ProfitSummary = {
  /** Sum of (price − cost) × qty for lines with known cost. */
  profitCents: number;
  /** Lines where cost snapshot is null. */
  missingCostLines: number;
  /** True when every line has a cost snapshot. */
  isComplete: boolean;
};

export function lineProfitCents(line: ProfitLineInput): number | null {
  if (line.unitCostCentsSnapshot === null) {
    return null;
  }
  return (line.unitPriceCentsSnapshot - line.unitCostCentsSnapshot) * line.quantity;
}

export function summarizeProfit(lines: readonly ProfitLineInput[]): ProfitSummary {
  let profitCents = 0;
  let missingCostLines = 0;

  for (const line of lines) {
    const profit = lineProfitCents(line);
    if (profit === null) {
      missingCostLines += 1;
      continue;
    }
    profitCents += profit;
  }

  return {
    profitCents,
    missingCostLines,
    isComplete: missingCostLines === 0 && lines.length > 0,
  };
}
