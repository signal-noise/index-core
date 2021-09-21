import {
  calculateWeightedMean,
  normalise
} from '../src/utils';

import { expect } from '@jest/globals';

const testDataA = [{
  value: 50,
  weight: 0.5,
  range: [0,100]
},{
  value: 25,
  weight: 0.25,
  range: [0, 50]
},{
  value: 25,
  weight: 0.25,
  range: [0,50]
}];

const testDataB = [{
  value: 0,
  weight: 0.5,
  range: [-100,100]
},{
  value: 25,
  weight: 0.25,
  range: [0, 50]
},{
  value: 25,
  weight: 0.25,
  range: [0,50]
}];

const testDataC = [{
  value: 0,
  weight: 0.5,
  range: [-100,100]
},{
  value: 25,
  weight: 0.25,
  invert: true,
  range: [0, 100]
},{
  value: 25,
  weight: 0.25,
  range: [0,100]
}];

test('simple weighted mean', ()=>{
  const meanA = calculateWeightedMean(testDataA, 1);
  const meanB = calculateWeightedMean(testDataB, 1);
  const meanC = calculateWeightedMean(testDataC, 1);
  expect(meanA).toBe(0.5);
  expect(meanB).toBe(0.5);
  expect(meanC).toBe(0.5);
});

test('normalise', ()=>{
  const normA = normalise(32,[0,64],100);
  expect(normA).toBe(50);
});

