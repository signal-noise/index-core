// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from '@jest/globals';

import * as Types from '../src/types';
import {
  calculateWeightedMean,
  clamper,
  normalise,
// eslint-disable-next-line import/no-unresolved
} from '../src/utils';

const testDataA = [{
  value: 50,
  weight: 0.5,
  range: [0, 100],
  id: '1',
  type: Types.IndicatorType.DISCRETE,
  diverging: false,
  invert: false
},
{
  value: 25,
  weight: 0.25,
  range: [0, 50],
  id: '2',
  type: Types.IndicatorType.DISCRETE,
  diverging: false,
  invert: false
},
{
  value: 25,
  weight: 0.25,
  range: [0, 50],
  id: '3',
  type: Types.IndicatorType.DISCRETE,
  diverging: false,
  invert: false
}];

const testDataB = [{
  value: 0,
  weight: 0.5,
  range: [-100, 100],
  id: '1',
  type: Types.IndicatorType.DISCRETE,
  diverging: false,
  invert: false
}, {
  value: 25,
  weight: 0.25,
  range: [0, 50],
  id: '2',
  type: Types.IndicatorType.DISCRETE,
  diverging: false,
  invert: false
}, {
  value: 25,
  weight: 0.25,
  range: [0, 50],
  id: '3',
  type: Types.IndicatorType.DISCRETE,
  diverging: false,
  invert: false
}];

const testDataC = [{
  value: 0,
  weight: 0.5,
  range: [-100, 100],
  id: '1',
  type: Types.IndicatorType.DISCRETE,
  diverging: false,
  invert: false
}, {
  value: 25,
  weight: 0.25,
  invert: true,
  range: [0, 100],
  id: '2',
  type: Types.IndicatorType.DISCRETE,
  diverging: false
}, {
  value: 25,
  weight: 0.25,
  range: [0, 100],
  id: '3',
  type: Types.IndicatorType.DISCRETE,
  diverging: false,
  invert: false
}];

test('simple weighted mean', () => {
  const meanA = calculateWeightedMean(testDataA, 1);
  const meanB = calculateWeightedMean(testDataB, 1);
  const meanC = calculateWeightedMean(testDataC, 1);
  expect(meanA).toBe(0.5);
  expect(meanB).toBe(0.5);
  expect(meanC).toBe(0.5);
});

test('normalise', () => {
  const normA = normalise(32, [0, 64], 100);
  const normB = normalise(100, [0, 64], 100, true);
  const normC = normalise(96, [0, 64], 100);
  expect(normA).toBe(50);
  expect(normB).toBe(100);
  expect(normC).toBe(150);
});

test('clamper', () => {
  expect(clamper([0, 100], 300)).toBe(100);
  expect(clamper([0, 100], -50)).toBe(0);
  expect(clamper([0, 100], 50)).toBe(50);
});
