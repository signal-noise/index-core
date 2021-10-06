import {csvParse} from 'd3';
import { expect } from '@jest/globals';
import fs from 'fs';
import indexCore from '../src/index-core.js';

const rootDir = 'data/wateroptimisation';

const waterIndicators = csvParse(fs.readFileSync(`${rootDir}/indicators.csv`, 'utf-8'));
const waterEntities = csvParse(fs.readFileSync(`${rootDir}/entities.csv`, 'utf-8'));

test('create index-core', ()=>{
  const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);
  expect.anything(waterOptimisationIndex);
  expect(waterOptimisationIndex.indexedData['Naples'].value.toFixed(1)).toBe('76.2');
});

test('getIndicatorMean index-core', ()=>{
  const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);
  expect(waterOptimisationIndex.getIndexMean('1').toFixed(1)).toBe('74.7');
  expect(waterOptimisationIndex.getIndexMean('1.2').toFixed(1)).toBe('87.9');
  expect(waterOptimisationIndex.getIndexMean('2.2').toFixed(1)).toBe('74.9');
  expect(waterOptimisationIndex.getIndexMean('2.1.1').toFixed(1)).toBe('89.8');
  expect(waterOptimisationIndex.getIndexMean('2').toFixed(1)).toBe('74.7');
  expect(waterOptimisationIndex.getIndexMean().toFixed(1)).toBe('74.7');
  
});