import {csvParse} from 'd3';
import fs from 'fs';
import indexCore from './src/index-core.js';

const rootDir = 'data/wateroptimisation'

const waterIndicators = csvParse(fs.readFileSync(`${rootDir}/indicators.csv`, 'utf-8'));
const waterEntities = csvParse(fs.readFileSync(`${rootDir}/entities.csv`, 'utf-8'));

const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);

console.log(waterOptimisationIndex.indexedData['Abu Dhabi']['1']);
console.log(waterOptimisationIndex.indexedData['Abu Dhabi'].value);
