import { strict as assert } from 'node:assert';
import {
  calculateDistance,
  generateCircleThroughPoint,
  offsetToDisplayRadius,
} from '../lib/lineGenerator';

type OffsetSample = {
  offset: number;
  maxDistance: number;
};

const origin: [number, number] = [127, 37];
const bearing = 90;
const offsets = [-1, -0.5, 0, 0.5, 1];

const samples: OffsetSample[] = offsets.map((offset) => {
  const result = generateCircleThroughPoint(origin, bearing, offset, 360);
  const coords = result.geometry.coordinates as [number, number][];

  assert.deepEqual(
    coords[0],
    origin,
    `offset ${offset} should start at the origin coordinate`
  );
  assert.deepEqual(
    coords[coords.length - 1],
    origin,
    `offset ${offset} should end at the origin coordinate`
  );
  assert(coords.length >= 2, `offset ${offset} must contain at least two coordinates`);

  // The curve is closed so the max distance from origin should shrink as |offset| grows.
  const maxDistance = coords.reduce(
    (max, coordinate) => Math.max(max, calculateDistance(origin, coordinate)),
    0
  );

  return { offset, maxDistance };
});

// Monotonic shrinkage check
const ordered = [...samples].sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));
for (let i = 1; i < ordered.length; i++) {
  const prev = ordered[i - 1];
  const current = ordered[i];

  assert(
    prev.maxDistance + 1e-3 >= current.maxDistance,
    `|offset|=${Math.abs(current.offset)} should not produce a larger max distance than |offset|=${Math.abs(
      prev.offset
    )}`
  );
}

// Symmetry check between +/- offsets
const positiveHalf = samples.find((sample) => sample.offset === 0.5)?.maxDistance ?? 0;
const negativeHalf = samples.find((sample) => sample.offset === -0.5)?.maxDistance ?? 0;
assert(
  Math.abs(positiveHalf - negativeHalf) < 1e-2,
  'Positive and negative offsets with the same magnitude should produce identical radii'
);

// Display radius mapping sanity checks
const greatCircleRadius = offsetToDisplayRadius(0);
assert(
  Math.abs(greatCircleRadius - Math.PI * 6371) < 1e-6,
  'offset=0 should report the half circumference of the Earth'
);
const collapsedRadius = offsetToDisplayRadius(1);
assert(
  collapsedRadius < 5,
  `offset=±1 should numerically collapse to a point (received ≈ ${collapsedRadius.toFixed(4)} km)`
);
assert(
  Math.abs(offsetToDisplayRadius(0.5) - offsetToDisplayRadius(-0.5)) < 1e-6,
  'Display radius must be symmetric with respect to the slider sign'
);

console.log('✅ lineGenerator geometric checks passed');

