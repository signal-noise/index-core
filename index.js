import { clone } from './src/utils.js';
import {csvParse} from 'd3';
import fs from 'fs';
import indexCore from './src/index-core.js';

const waterRootDir = 'data/wateroptimisation';

const waterIndicators = csvParse(fs.readFileSync(`${waterRootDir}/indicators.csv`, 'utf-8'));
const waterEntities = csvParse(fs.readFileSync(`${waterRootDir}/entities.csv`, 'utf-8'));

// const waterOptimisationIndex = indexCore(waterIndicators, waterEntities);

const inclusiveIternetRootDir = 'data/inclusiveinternet/2021';

const inclusiveInternetIndicators = csvParse(fs.readFileSync(`${inclusiveIternetRootDir}/indicators.csv`, 'utf-8'));
const inclusiveInternetEntities = csvParse(fs.readFileSync(`${inclusiveIternetRootDir}/entities.csv`, 'utf-8'));
const inclusiveInternetIndex = indexCore(inclusiveInternetIndicators, inclusiveInternetEntities);


console.log('value', inclusiveInternetIndex.indexedData['Singapore']['value'])
console.log('1', inclusiveInternetIndex.indexedData['Singapore']['1'])
console.log('1.2', inclusiveInternetIndex.indexedData['Singapore']['1.2'])
console.log('1.2.1', inclusiveInternetIndex.getEntityIndicator('Singapore','1.2.1'))

inclusiveInternetIndex.adjustValue('Singapore','1.2.1',50);

console.log('adjusted')
console.log('value', inclusiveInternetIndex.indexedData['Singapore']['value'])
console.log('1', inclusiveInternetIndex.indexedData['Singapore']['1'])
console.log('1.2', inclusiveInternetIndex.indexedData['Singapore']['1.2'])
console.log('1.2.1', inclusiveInternetIndex.getEntityIndicator('Singapore','1.2.1'))

// const simpleRootDir = 'data/simple-index-set';

// const simpleIndicators = csvParse(fs.readFileSync(`${simpleRootDir}/indicators.csv`, 'utf-8'));
// const simpleEntities = csvParse(fs.readFileSync(`${simpleRootDir}/entities.csv`, 'utf-8'));

// const simpleIndex = indexCore(simpleIndicators, simpleEntities);
// console.log(simpleIndex.indexedData['Monopoly'].value)
// console.log(simpleIndex.indexedData['Monopoly']['1'])
// console.log(simpleIndex.indexedData['Monopoly']['1.1'])
// simpleIndex.adjustValue('Monopoly','1.1',10);
// console.log('---');
// console.log(simpleIndex.indexedData['Monopoly'].value)
// console.log(simpleIndex.indexedData['Monopoly']['1'])
// console.log(simpleIndex.indexedData['Monopoly']['1.1'])
