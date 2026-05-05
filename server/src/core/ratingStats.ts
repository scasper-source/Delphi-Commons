/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

export const RATING_IQR_METHOD = "linear_percentile_interpolation";
export const RATING_IQR_METHOD_DESCRIPTION =
  "Q1 and Q3 are calculated as the 25th and 75th percentiles of sorted numeric ratings using linear percentile interpolation; IQR = Q3 - Q1.";

export type RatingStats = {
  sorted: number[];
  responseCount: number;
  min: number | null;
  max: number | null;
  median: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  distribution: Record<string, number>;
  iqrMethod: typeof RATING_IQR_METHOD;
};

type DistributionOptions = {
  includeScaleValues?: boolean;
  scaleMin?: number;
  scaleMax?: number;
};

function roundStatistic(value: number): number {
  return Number(value.toFixed(2));
}

export function sortNumericRatings(values: number[]): number[] {
  return values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
}

export function medianRating(values: number[]): number | null {
  const sorted = sortNumericRatings(values);
  if (sorted.length === 0) return null;

  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;

  const left = sorted[mid - 1];
  const right = sorted[mid];
  return left === undefined || right === undefined ? null : roundStatistic((left + right) / 2);
}

export function percentileLinearFromSorted(sortedValues: number[], percentile: number): number | null {
  const sorted = sortNumericRatings(sortedValues);
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0] ?? null;

  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const lowerValue = sorted[lower];
  const upperValue = sorted[upper];

  if (lowerValue === undefined || upperValue === undefined) return null;
  if (lower === upper) return lowerValue;

  return roundStatistic(lowerValue + (upperValue - lowerValue) * (position - lower));
}

export function interquartileRange(values: number[]): number | null {
  const sorted = sortNumericRatings(values);
  const q1 = percentileLinearFromSorted(sorted, 0.25);
  const q3 = percentileLinearFromSorted(sorted, 0.75);
  return q1 === null || q3 === null ? null : roundStatistic(q3 - q1);
}

export function buildRatingDistribution(values: number[], options: DistributionOptions = {}): Record<string, number> {
  const distribution: Record<string, number> = {};

  if (options.includeScaleValues) {
    const min = options.scaleMin ?? 1;
    const max = options.scaleMax ?? 9;
    for (let value = min; value <= max; value += 1) {
      distribution[String(value)] = 0;
    }
  }

  for (const value of sortNumericRatings(values)) {
    const key = String(value);
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  return distribution;
}

export function summarizeRatings(values: number[], options: DistributionOptions = {}): RatingStats {
  const sorted = sortNumericRatings(values);
  const q1 = percentileLinearFromSorted(sorted, 0.25);
  const q3 = percentileLinearFromSorted(sorted, 0.75);

  return {
    sorted,
    responseCount: sorted.length,
    min: sorted.length > 0 ? sorted[0] ?? null : null,
    max: sorted.length > 0 ? sorted[sorted.length - 1] ?? null : null,
    median: medianRating(sorted),
    q1,
    q3,
    iqr: q1 === null || q3 === null ? null : roundStatistic(q3 - q1),
    distribution: buildRatingDistribution(sorted, options),
    iqrMethod: RATING_IQR_METHOD,
  };
}
