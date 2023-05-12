import { csvParse } from 'd3';
import * as Types from '../src/types';
// import { expect } from '@jest/globals';
import fs from 'fs';
import indexCore from '../src/index-core.js';

const waterRootDir = 'data/wateroptimisation';

// TODO refactor this into a validator
const formatIndicator = (indicator: any): Types.Indicator => {
  const getIndicatorType = () => {
    switch (indicator.type) {
      case "calculated":
        return Types.IndicatorType.CALCULATED;
      case "discrete":
        return Types.IndicatorType.DISCRETE;
      case "continuous":
        return Types.IndicatorType.CONTINUOUS;
      default:
        return Types.IndicatorType.CONTINUOUS;
    }
  }


  const coerceBoolean = (prop: any) => {
    if (prop === "true") {
      return true;
    } else {
      return false;
    }
  }

  const result = {
    id: indicator.id,
    diverging: coerceBoolean(indicator.diverging),
    type: getIndicatorType(),
    value: !!indicator.value ? indicator.value : null,
    invert: coerceBoolean(indicator.invert),
    min: indicator.min,
    max: indicator.max,
    weighting: indicator.weighting,
    indicatorName: indicator.indicatorName
  }

  console.log("indicator: ", indicator);
  console.log(result);

  return result;
}

const formatEntity = (entity: any): Types.Entity => {
  return {...entity};
}

const waterIndicators: Types.Indicator[] = csvParse(fs.readFileSync(`${waterRootDir}/indicators.csv`, 'utf-8')).map((indicator) => formatIndicator(indicator));
const waterEntities: Types.Entity[] = csvParse(fs.readFileSync(`${waterRootDir}/entities.csv`, 'utf-8')).map((entity) => formatEntity(entity));

const simpleRootDir = 'data/simple-index-set';

const simpleIndicators: Types.Indicator[] = csvParse(fs.readFileSync(`${simpleRootDir}/indicators.csv`, 'utf-8')).map((indicator) => formatIndicator(indicator));
const simpleEntities: Types.Entity[] = csvParse(fs.readFileSync(`${simpleRootDir}/entities.csv`, 'utf-8')).map((entity) => formatEntity(entity));

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
  expect(simpleIndex.indexedData['Tigris and Eurphrates']['2.3']).toBe(70);
  expect(simpleIndex.indexedData['Twilight Imperium']['2.3']).toBe(70);
})

test('indicator overide index-core', ()=>{
  const simpleIndexOverwrite = indexCore(simpleIndicators, simpleEntities, undefined, true);
  expect(simpleIndexOverwrite.indexedData['Catan']['1'].toFixed(3)).toBe('52.222');
  expect(simpleIndexOverwrite.indexedData['Twilight Imperium']['2.3']).toBe(70);

  const simpleIndex = indexCore(simpleIndicators, simpleEntities, undefined, false);
  expect(simpleIndex.indexedData['Catan']['1']).toBe(10);
  expect(simpleIndex.indexedData['Twilight Imperium']['2.3']).toBe(70);
})

test('get the user set value for an indicator', ()=>{
  const simpleIndex = indexCore(simpleIndicators, simpleEntities);
  simpleIndex.adjustValue('Monopoly', '1.2', 3.142);
  expect(simpleIndex.getEntityIndicator('Monopoly','1.2')).toBe(3.142);
})

test('check the return value from adjustValue', ()=>{
  const simpleIndex = indexCore(simpleIndicators, simpleEntities);
  const adjustedObject = simpleIndex.adjustValue('Monopoly', '1.2', 3.142);
  expect(adjustedObject['1.2']).toBe(3.142);
  expect(adjustedObject['user']).toBe(undefined);
  expect(adjustedObject['data']).toBe(undefined);
})

test('test for clamped values', ()=>{
  const clampedIndex = indexCore(simpleIndicators, simpleEntities, 100, true, true);
  const unrestrictedIndex = indexCore(simpleIndicators, simpleEntities);
  expect(clampedIndex.getEntity('Chinatown')['1'].toFixed(3)).toBe('62.778');
  expect(unrestrictedIndex.getEntity('Chinatown')['1'].toFixed(3)).toBe('79.444');
  
})