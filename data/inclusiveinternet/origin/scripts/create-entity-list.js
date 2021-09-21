import {csvFormat, csvParse}  from 'd3-dsv';

import fs from 'fs';

const data = csvParse(fs.readFileSync('../DataFlat-Table 1.csv', 'utf-8'));
const idLookupEntries = csvParse(fs.readFileSync('../Framework-Table 1.csv', 'utf-8'))
  .map(d=>[d.SeriesCode, d.IndexNumber]);
const countries = csvParse(fs.readFileSync('../CountryISO-Table 1.csv', 'utf-8'));

const idLookup = Object.fromEntries(idLookupEntries);

const entityData = countries.map((country)=>{
  const scores = getByScoresCountry(country.CODE);
  const row = { name: country.name };
  
  scores.forEach((score=>{
    const id = idLookup[ score.CODE.split('_')[1] ]
    if(id.match(/\d.\d.\d/)){
      row[id] = score['Score (unrounded)']
    }
  }));
  
  return row;
})

fs.writeFileSync('../../entities.csv',csvFormat(entityData));
//console.log(getByScoresCountry('AT'));

function getByScoresCountry(countryID){
  return data.filter((d)=>(d.CODE.split('_')[0] == countryID))
}

// console.log(idLookup);