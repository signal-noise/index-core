import { calculateWeightedMean, clone } from './utils.js'

function indexer(indicatorsData=[], entities=[], indexMax = 100){
  if(indicatorsData.length==0||entities.length==0) return {};
  const indicatorLookup = Object.fromEntries( // a look up for indicators
    indicatorsData
      .map(indicator=>([indicator.id, indicator]))
  ); 
  const indexedData = {};

  calculateIndex();

  function getEntity(name){
    return entities.find(d=>d.name==name);
  }

  function adjustValue(name, indicatorID, value){
    let e = getEntity(name);
    if(indicatorLookup[indicatorID].type=='calculated'){
      console.warn(`${indicatorID} is a calculated value and can not be adjusted directly, perhaps you meant to adjust the weighting?`);
      return clone(e);
    }
    if (!e.user) e.user = {};
    e.user[indicatorID] = value;
    return indexEntity(Object.assign(clone(e), e.user));
  }

  function adjustWeight(indicatorID, weight){
    // TODO: allow group (,subgroup etc.) weighting adjustment
    // TODO: make the index recalculating take into account what 
    //    has changed in the data rather than doing the whole shebang
    indicatorLookup[indicatorID].userWeighting = weight;
    calculateIndex();
  }

  function indexEntity(entity){
    // indicators are all the properties that start with a digit
    // make a lookup for the entities values
    const indexScore = {};
    //get a list of the values we need to calculate 
    // in order of deepest in the heirachy to to shallowist
    // TODO: extract this so it only happens once
    const toCalculate = indicatorsData
      .filter(i=>i.id.match(/^\d/) && i.type=='calculated')
      .map(i=>i.id)
      .sort((i1, i2)=>{
        return (i2.length - i1.length);
      });

    toCalculate.forEach(i=>{
      if(entity[i]){ console.log('overwriting', i) }
      const componentIndicators = indicatorsData
        .filter(j => (j.id.indexOf(i) === 0 && j.id.length === i.length+2))
      console.log(`${i} -> ${componentIndicators.map(k=>k.id)}`);
      // console.log(componentIndicators);
    })
    //console.log(entity);
    // put the indicators into groups
    // indicatorList.forEach(indicator=>{
    //   let idParts = indicator.split('.');
    //   let key = idParts.slice(0,-1).join('.');
    //   if(!groupScores[key]){
    //     groupScores[key] = [];
    //   }
    //   groupScores[key].push({
    //     id: indicator,
    //     value: Number(entity[indicator]),
    //     weight: indicators[indicator].userWeighting ? Number(indicators[indicator].userWeighting) : Number(indicators[indicator].weighting),
    //     invert: indicators[indicator].invert ? true : false,
    //     range: [
    //       indicators[indicator].min ? Number(indicators[indicator].min) : 0 , 
    //       indicators[indicator].max ? Number(indicators[indicator].max) : 100
    //     ]
    //   });
    // });

    // const groupList = Object.keys(groupScores);

    // // calculate the index value of those groups and
    // // put them into pillars
    // groupList.forEach((group)=>{
    //   let idParts = group.split('.');
    //   let key = idParts.slice(0,-1).join('.');
    //   if(!pillarScores[key]){
    //     pillarScores[key] = [];
    //   }
    //   pillarScores[key].push({
    //     id: group,
    //     value: calculateWeightedMean(groupScores[group], indexMax),
    //     weight: Number(groupsLookup[group].weighting),
    //     components: groupScores[group]
    //   })
    // });

    // const pillarList = Object.keys(pillarScores);

    // // calculate the index value of those pillars and put them into the top level index
    // pillarList.forEach((pillar)=>{
    //   if(!indexScore.components){
    //     indexScore.id = 0;
    //     indexScore.weight=1;
    //     indexScore.components = [];
    //   }
    //   indexScore.components.push({
    //     id: pillar,
    //     value: calculateWeightedMean(pillarScores[pillar], indexMax),
    //     weight: Number(groupsLookup[pillar].weighting),
    //     components: pillarScores[pillar]
    //   });
    // });
    // indexScore.value = calculateWeightedMean(indexScore.components, indexMax)

    return indexScore;
  }

  function calculateIndex(){
    entities.forEach(entity => {
      const indexedEntity = indexEntity(entity);
      indexedEntity.data = entity;
      indexedData[entity.name] = indexedEntity;
    });
  }

  return {
    getEntity,
    adjustWeight,
    adjustValue,
    indexedData
  };
}

export default indexer;