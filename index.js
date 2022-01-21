import { clone } from './src/utils.js';
import {csvParse} from 'd3';
import fs from 'fs';
import indexCore from './src/index-core.js';

const waterRootDir = 'data/wateroptimisation';

const waterIndicators = csvParse(fs.readFileSync(`${waterRootDir}/indicators.csv`, 'utf-8'));
const waterEntities = csvParse(fs.readFileSync(`${waterRootDir}/entities.csv`, 'utf-8'));

// const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);

const inclusiveIternetRootDir = 'data/inclusiveinternet';

const inclusiveInternetIndicators = csvParse(fs.readFileSync(`${inclusiveIternetRootDir}/indicators.csv`, 'utf-8'));
const inclusiveInternetEntities = csvParse(fs.readFileSync(`${inclusiveIternetRootDir}/entities.csv`, 'utf-8'));

const inclusiveInternetIndex = indexCore(inclusiveInternetIndicators, inclusiveInternetEntities);


const simpleRootDir = 'data/simple-index-set';

const simpleIndicators = csvParse(fs.readFileSync(`${simpleRootDir}/indicators.csv`, 'utf-8'));
const simpleEntities = csvParse(fs.readFileSync(`${simpleRootDir}/entities.csv`, 'utf-8'));

const simpleIndex = indexCore(simpleIndicators, simpleEntities);

console.log(simpleIndex.indexedData)

// console.log(waterOptimisationIndex.indexedData['Abu Dhabi']['1']);
// console.log(waterOptimisationIndex.indexedData['Abu Dhabi'].value);
// console.log(waterOptimisationIndex.indexStructure);
// console.log(waterOptimisationIndex.getIndexMean('1.1'))
// console.log(waterOptimisationIndex.getIndexMean('2.1.1'))
// console.log(waterOptimisationIndex.getIndexMean())

// indicator 3.4.4 in the water index has .a and .b sub indicators 
// for this indicator abu dhabi has different values for a and b
// const before = JSON.stringify(waterOptimisationIndex.getEntity('Abu Dhabi'), null, ' ')
// delete before.data;
// waterOptimisationIndex.filterIndicators(indicator=>{
//   return String(indicator.id).indexOf('b')>0; // if the indicator includes "b" in it's id ignore it
// })
// const after = JSON.stringify(waterOptimisationIndex.getEntity('Abu Dhabi'), null, ' ')
// delete after.data; // just for neater output (note data is the original data for an entity used to calculate the index)

// console.log('BEFORE', before);
// console.log('AFTER', after);