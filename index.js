import {csvParse} from 'd3';
import fs from 'fs';
import indexCore from './src/index-core.js';

const iiiRoot = 'data/inclusiveinternet/2022';

const iiiIndicators = csvParse(fs.readFileSync(`${iiiRoot}/indicators.csv`, 'utf-8'));
const iiiEntities = csvParse(fs.readFileSync(`${iiiRoot}/entities.csv`, 'utf-8'));

const iii = indexCore(iiiIndicators, iiiEntities, 100 ,true, true);
// const iiiComparison = indexCore(iiiIndicators, iiiEntities, 100, false);

//console.log( simpleIndex.getEntity('Chinatown') )
// console.log( simpleIndex.getEntity('Chinatown').value, 'vs', simpleIndexUnrestricted.getEntity('Chinatown').value );
// console.log( simpleIndex.getEntity('Chinatown')['1'], 'vs', simpleIndexUnrestricted.getEntity('Chinatown')['1'] )
// console.log( simpleIndex.getEntity('Chinatown')['1.4'], 'vs', simpleIndexUnrestricted.getEntity('Chinatown')['1.4'] )

console.log('i', iii.getEntityIndicator('Algeria', '1.1'));
console.log('i', iii.getEntityIndicator('Algeria', '1'));