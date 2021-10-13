import {csvParse} from 'd3';
import fs from 'fs';
import indexCore from './src/index-core.js';

const waterRootDir = 'data/wateroptimisation';
const educationRootDir = 'data/education';

const waterIndicators = csvParse(fs.readFileSync(`${waterRootDir}/indicators.csv`, 'utf-8'));
const waterEntities = csvParse(fs.readFileSync(`${waterRootDir}/entities.csv`, 'utf-8'));

const educationIndicators = csvParse(fs.readFileSync(`${educationRootDir}/indicators.csv`, 'utf-8'));
const educationEntities = csvParse(fs.readFileSync(`${educationRootDir}/entities.csv`, 'utf-8'));

const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);

const educationIndex = indexCore(educationIndicators, educationEntities);

// console.log(waterOptimisationIndex.indexedData['Abu Dhabi']['1']);
// console.log(waterOptimisationIndex.indexedData['Abu Dhabi'].value);
// console.log(waterOptimisationIndex.indexStructure);
// console.log(waterOptimisationIndex.getIndexMean('1.1'))
// console.log(waterOptimisationIndex.getIndexMean('2.1.1'))
// console.log(waterOptimisationIndex.getIndexMean())

console.log(educationIndex.indexStructure);
console.log(educationIndex.indexedData);