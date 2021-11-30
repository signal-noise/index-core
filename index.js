import {csvParse} from 'd3';
import fs from 'fs';
import indexCore from './src/index-core.js';

const waterRootDir = 'data/wateroptimisation';

const waterIndicators = csvParse(fs.readFileSync(`${waterRootDir}/indicators.csv`, 'utf-8'));
const waterEntities = csvParse(fs.readFileSync(`${waterRootDir}/entities.csv`, 'utf-8'));

const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);


// console.log(waterOptimisationIndex.indexedData['Abu Dhabi']['1']);
// console.log(waterOptimisationIndex.indexedData['Abu Dhabi'].value);
// console.log(waterOptimisationIndex.indexStructure);
// console.log(waterOptimisationIndex.getIndexMean('1.1'))
// console.log(waterOptimisationIndex.getIndexMean('2.1.1'))
// console.log(waterOptimisationIndex.getIndexMean())
console.log(waterOptimisationIndex.indexedData);

waterOptimisationIndex.filterIndicators(indicator=>{
  return String(indicator.id).indexOf('b')>0;
})
//console.log(waterOptimisationIndex.indexStructure);
console.log(waterOptimisationIndex.indexedData);