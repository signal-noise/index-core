import {csvParse} from 'd3';
import { expect } from '@jest/globals';
import fs from 'fs';
import indexCore from '../src/index-core.js';

const rootDir = 'data/wateroptimisation';

const waterGroups = csvParse(fs.readFileSync(`${rootDir}/groups.csv`, 'utf-8'));
const waterIndicators = csvParse(fs.readFileSync(`${rootDir}/indicators.csv`, 'utf-8'));
const waterEntities = csvParse(fs.readFileSync(`${rootDir}/entities.csv`, 'utf-8'));

test('create index-core', ()=>{
  const waterOptimisationIndex = indexCore(waterGroups, waterIndicators, waterEntities);
  expect.anything(waterOptimisationIndex);
  console.log(waterOptimisationIndex.indexedData);
  expect(waterOptimisationIndex.indexedData['Naples'].value.toFixed(1)).toBe("76.2");
});

