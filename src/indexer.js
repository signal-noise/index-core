import { calculateWeightedMean } from './utils.js'

function indexer(groupsData, indicatorsData, entities){
  const groupsLookup = Object.fromEntries(groupsData.map(g=>[g.id,g]))
  const indicatorEntries = indicatorsData.map(indicator=>([indicator.id, indicator]));
  const indexMax = 100;
  
  const index = {};
  const data = {
    groups: groupsData,
    indicators: Object.fromEntries(indicatorEntries)
  };

  calculateIndex();

  function getEntity(name){
    return entities.find(d=>d.name==name);
  }

  function adjustEntity(name, indicatorID, value){
    let e = getEntity(name);
    if (!e.user) e.user = {};
    e.user[indicatorID] = value;
  }

  function adjustWeight(indicatorID, weight){
    data.indicators[indicatorID].userWeight = weight;
  }

  function indexEntity(entity, index){
    const indicatorList = Object.keys(entity).filter(k=>k.match(/^\d/)); // indicators are all the properties that start with a digit
    const groupScores = {};
    const pillarScores = {};
    const indexScore = {};
    
    // put the indicators into groups
    indicatorList.forEach(indicator=>{
      let idParts = indicator.split('.');
      let key = idParts.slice(0,-1).join('.');
      if(!groupScores[key]){
        groupScores[key] = [];
      }
      groupScores[key].push({
        id: indicator,
        value: Number(entity[indicator]),
        weight: Number(index[indicator].weighting),
        invert: index[indicator].invert ? true : false,
        range: [
          index[indicator].min ? Number(index[indicator].min) : 0 , 
          index[indicator].max ? Number(index[indicator].max) : 100
        ]
      });
    });

    const groupList = Object.keys(groupScores);

    // calculate the index value of those groups and
    // put them into pillars
    groupList.forEach((group)=>{
      let idParts = group.split('.');
      let key = idParts.slice(0,-1).join('.');
      if(!pillarScores[key]){
        pillarScores[key] = [];
      }
      pillarScores[key].push({
        id: group,
        value: calculateWeightedMean(groupScores[group], indexMax),
        weight: Number(groupsLookup[group].weighting),
        components: groupScores[group]
      })
    });

    const pillarList = Object.keys(pillarScores);

    // calculate the index value of those pillars and put them into the top level index
    pillarList.forEach((pillar)=>{
      if(!indexScore.components){
        indexScore.components = [];
      }
      indexScore.components.push({
        id: pillar,
        value: calculateWeightedMean(pillarScores[pillar], indexMax),
        weight: Number(groupsLookup[pillar].weighting),
        components: pillarScores[pillar]
      });
    });
    indexScore.value = calculateWeightedMean(indexScore.components, indexMax)
  }

  function calculateIndex(){
    entities.forEach(entity => {
      indexEntity(entity, data.indicators);
    });
  }

  index.getEntity = getEntity;
  index.adjustWeight = adjustWeight;
  index.adjustEntity = adjustEntity;
  index.calculateIndex = calculateIndex;
  
  return index;
}

export default indexer;