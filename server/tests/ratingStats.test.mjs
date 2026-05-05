/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import test from "node:test";
import assert from "node:assert/strict";

async function loadStats() {
  return import("../dist/core/ratingStats.js");
}

test("rating stats use documented linear percentile interpolation for IQR", async () => {
  const {
    RATING_IQR_METHOD,
    RATING_IQR_METHOD_DESCRIPTION,
    interquartileRange,
    medianRating,
    summarizeRatings,
  } = await loadStats();

  assert.equal(RATING_IQR_METHOD, "linear_percentile_interpolation");
  assert.match(RATING_IQR_METHOD_DESCRIPTION, /linear percentile interpolation/);

  const threeRatings = summarizeRatings([6, 8, 8]);
  assert.deepEqual(threeRatings.sorted, [6, 8, 8]);
  assert.equal(threeRatings.responseCount, 3);
  assert.equal(threeRatings.median, 8);
  assert.equal(threeRatings.q1, 7);
  assert.equal(threeRatings.q3, 8);
  assert.equal(threeRatings.iqr, 1);
  assert.equal(threeRatings.iqrMethod, "linear_percentile_interpolation");

  const fourRatings = summarizeRatings([1, 3, 5, 7]);
  assert.equal(fourRatings.median, 4);
  assert.equal(fourRatings.q1, 2.5);
  assert.equal(fourRatings.q3, 5.5);
  assert.equal(fourRatings.iqr, 3);

  assert.equal(medianRating([]), null);
  assert.equal(interquartileRange([]), null);
  assert.equal(summarizeRatings([]).q1, null);
  assert.equal(summarizeRatings([]).q3, null);
  assert.equal(summarizeRatings([]).iqr, null);
});

test("rating distribution can include an explicit 1-9 rating scale", async () => {
  const { summarizeRatings } = await loadStats();
  const stats = summarizeRatings([6, 8, 8], { includeScaleValues: true, scaleMin: 1, scaleMax: 9 });

  assert.equal(stats.distribution["1"], 0);
  assert.equal(stats.distribution["6"], 1);
  assert.equal(stats.distribution["8"], 2);
  assert.equal(stats.distribution["9"], 0);
});
