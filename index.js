import {csvParse} from 'd3';
import fs from 'fs';
import indexCore from './src/index-core.js';

const simpleRootDir = 'data/simple-index-set';

const simpleIndicators = csvParse(fs.readFileSync(`${simpleRootDir}/indicators.csv`, 'utf-8'));
const simpleEntities = csvParse(fs.readFileSync(`${simpleRootDir}/entities.csv`, 'utf-8'));

const simpleIndex = indexCore(simpleIndicators, simpleEntities, 100 ,true, true);
const simpleIndexUnrestricted = indexCore(simpleIndicators, simpleEntities);

//console.log( simpleIndex.getEntity('Chinatown') )
console.log( simpleIndex.getEntity('Chinatown').value, 'vs', simpleIndexUnrestricted.getEntity('Chinatown').value );
console.log( simpleIndex.getEntity('Chinatown')['1'], 'vs', simpleIndexUnrestricted.getEntity('Chinatown')['1'] )
console.log( simpleIndex.getEntity('Chinatown')['1.4'], 'vs', simpleIndexUnrestricted.getEntity('Chinatown')['1.4'] )

