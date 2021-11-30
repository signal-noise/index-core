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
// indicator 3.4.4 in the water index has .a and .b sub indicators 
// for this indicator abu dhabi has different values for a and b
console.log(JSON.stringify(waterOptimisationIndex.getEntity('Abu Dhabi'),null, ' '));

waterOptimisationIndex.filterIndicators(indicator=>{
  return String(indicator.id).indexOf('b')>0; // if the indicator includes "b" in it's id ignore it
})
//console.log(waterOptimisationIndex.indexStructure);
console.log(JSON.stringify(waterOptimisationIndex.getEntity('Buenos Aires'),null, ' '));