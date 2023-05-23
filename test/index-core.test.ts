import { csvParse } from 'd3';
import * as Types from '../src/types';
// import { expect } from '@jest/globals';
import fs from 'fs';
import indexCore from '../src/index-core';
import { DSVRowArray } from 'd3';

const waterRootDir = 'data/wateroptimisation';

const waterIndicators: DSVRowArray<string> = csvParse(fs.readFileSync(`${waterRootDir}/indicators.csv`, 'utf-8'));
const waterEntities: DSVRowArray<string> = csvParse(fs.readFileSync(`${waterRootDir}/entities.csv`, 'utf-8'));

const simpleRootDir = 'data/simple-index-set';

const simpleIndicators: DSVRowArray<string> = csvParse(fs.readFileSync(`${simpleRootDir}/indicators.csv`, 'utf-8'));
const simpleEntities: DSVRowArray<string> = csvParse(fs.readFileSync(`${simpleRootDir}/entities.csv`, 'utf-8'));

test('create index-core', ()=>{
  const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);
  expect(waterOptimisationIndex).toEqual(expect.anything());
  expect(waterOptimisationIndex.indexedData['Naples'].value.toFixed(1)).toBe('76.2');
});

test('adjust indicator', ()=>{
  const simpleIndex = indexCore(simpleIndicators, simpleEntities);
  const originalValue = simpleIndex.indexedData['Monopoly'].value;
  simpleIndex.adjustValue('Monopoly','1.1',10);
  const adjustedValue = simpleIndex.indexedData['Monopoly'].value;
  simpleIndex.adjustValue('Monopoly', null, null);
  const resetValue = simpleIndex.indexedData['Monopoly'].value;
  expect(originalValue.toFixed(3)).toBe('50.118')
  expect(adjustedValue.toFixed(3)).toBe('53.451')
  expect(originalValue).toBe(resetValue);
})

test('reset individual indicator', ()=>{
  const simpleIndex = indexCore(simpleIndicators, simpleEntities);
  simpleIndex.adjustValue('Monopoly','1.1',10);
  simpleIndex.adjustValue('Monopoly','1.2',1);
  simpleIndex.adjustValue('Monopoly','1.2', null);
  const resetValue = simpleIndex.indexedData['Monopoly'].value;
  expect(resetValue.toFixed(3)).toBe('53.451')
})

test('getIndicatorMean index-core', ()=>{
  const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);
  expect(waterOptimisationIndex.getIndexMean('1').toFixed(1)).toBe('72.2');
  expect(waterOptimisationIndex.getIndexMean('1.2').toFixed(1)).toBe('87.9');
  expect(waterOptimisationIndex.getIndexMean('2.2').toFixed(1)).toBe('74.9');
  expect(waterOptimisationIndex.getIndexMean('2.1.1').toFixed(1)).toBe('89.8');
  expect(waterOptimisationIndex.getIndexMean('3.1.1').toFixed(1)).toBe('38.2');
  expect(waterOptimisationIndex.getIndexMean('2').toFixed(1)).toBe('74.7');
  expect(waterOptimisationIndex.getIndexMean().toFixed(1)).toBe('69.5');
});

test('filterIndicators index-core', ()=>{
  const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);
  const excluder = (indicator: Types.Indicator) => (String(indicator.id).indexOf('b')>0); // if the indicator includes "b" in it's id ignore it
  waterOptimisationIndex.filterIndicators(excluder)
  expect(waterOptimisationIndex.getIndexMean('1').toFixed(1)).toBe('71.2');
  expect(waterOptimisationIndex.getIndexMean('1.2').toFixed(1)).toBe('87.9');
  expect(waterOptimisationIndex.getIndexMean('2.2').toFixed(1)).toBe('74.9');
  expect(waterOptimisationIndex.getIndexMean('2.1.1').toFixed(1)).toBe('89.8');
  expect(waterOptimisationIndex.getIndexMean('3.1.1').toFixed(1)).toBe('25.0');
  expect(waterOptimisationIndex.getIndexMean('2').toFixed(1)).toBe('74.7');
  expect(waterOptimisationIndex.getIndexMean().toFixed(1)).toBe('68.7');
});

test('diverging indicator index-core', ()=>{
  const simpleIndex = indexCore(simpleIndicators, simpleEntities);
  expect(simpleIndex.indexedData['Tigris and Eurphrates'].scores['2.3']).toBe(70);
  expect(simpleIndex.indexedData['Twilight Imperium'].scores['2.3']).toBe(70);
})

test('indicator overide index-core', ()=>{
  const simpleIndexOverwrite = indexCore(simpleIndicators, simpleEntities, undefined, true);
  expect(simpleIndexOverwrite.indexedData['Catan'].scores['1'].toFixed(3)).toBe('52.222');
  expect(simpleIndexOverwrite.indexedData['Twilight Imperium'].scores['2.3']).toBe(70);

  const simpleIndex = indexCore(simpleIndicators, simpleEntities, undefined, false);
  expect(simpleIndex.indexedData['Catan'].scores['1']).toBe(10);
  expect(simpleIndex.indexedData['Twilight Imperium'].scores['2.3']).toBe(70);
})

test('get the user set value for an indicator', ()=>{
  const simpleIndex = indexCore(simpleIndicators, simpleEntities);
  simpleIndex.adjustValue('Monopoly', '1.2', 3.142);
  expect(simpleIndex.getEntityIndicator('Monopoly','1.2')).toBe(3.142);
})

test('check the return value from adjustValue', ()=>{
  const simpleIndex = indexCore(simpleIndicators, simpleEntities);
  const adjustedObject = simpleIndex.adjustValue('Monopoly', '1.2', 3.142);
  expect(adjustedObject.scores['1.2']).toBe(3.142);
  expect(adjustedObject['user']).toEqual({});
  expect(adjustedObject['data']).toBe(undefined);
})

test('test for clamped values', ()=>{
  const clampedIndex = indexCore(simpleIndicators, simpleEntities, 100, true, true);
  const unrestrictedIndex = indexCore(simpleIndicators, simpleEntities);
  expect(clampedIndex.getEntity('Chinatown').scores['1'].toFixed(3)).toBe('62.778');
  expect(unrestrictedIndex.getEntity('Chinatown').scores['1'].toFixed(3)).toBe('79.444');
  
})