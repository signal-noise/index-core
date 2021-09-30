import { calculateWeightedMean, clone } from './utils.js';

function indexer(indicatorsData = [], entities = [], indexMax = 100) {
  if (indicatorsData.length === 0 || entities.length === 0) return {};
  const indicatorLookup = Object.fromEntries( // a look up for indicators
    indicatorsData
      .map((indicator) => ([indicator.id, indicator])),
  );
  const indexedData = {};

  function getEntity(name) {
    return entities.find((d) => d.name === name);
  }

  function indexEntity(entity, calculationList) {
    const newEntity = clone(entity);
    // indicators are all the properties that start with a digit
    // make a lookup for the entities values
    const indexScore = {};
    // get a list of the values we need to calculate
    // in order of deepest in the heirachy to to shallowist
    calculationList.forEach((i) => {
      if (newEntity[i]) { console.log('overwriting', i); }
      const componentIndicators = indicatorsData
        .filter((j) => (j.id.indexOf(i) === 0 && j.id.length === i.length + 2))
        .map((indicator) => ({
          id: indicator.id,
          value: Number(newEntity[indicator.id]),
          weight: indicator.userWeighting
            ? Number(indicator.userWeighting)
            : Number(indicator.weighting),
          invert: !!indicator.invert,
          range: [
            indicator.min ? Number(indicator.min) : 0,
            indicator.max ? Number(indicator.max) : indexMax,
          ],
        }));
      // calculate the weighted mean of the component indicators on the newEntity
      // assign that value to the newEntity
      newEntity[i] = calculateWeightedMean(componentIndicators, indexMax);
      return newEntity;
    });
    return indexScore;
  }

  function adjustValue(name, indicatorID, value) {
    const e = getEntity(name);
    if (indicatorLookup[indicatorID].type === 'calculated') {
      console.warn(`${indicatorID} is a calculated value and can not be adjusted directly, perhaps you meant to adjust the weighting?`);
      return clone(e);
    }
    if (!e.user) e.user = {};
    e.user[indicatorID] = value;
    return indexEntity(Object.assign(clone(e), e.user));
  }

  function calculateIndex(exclude = ()=>false) {
    const calculationList = indicatorsData
      .filter((i) => i.id.match(/^\d/) && i.type === 'calculated' && !exclude(i))
      .map((i) => i.id)
      .sort((i1, i2) => (i2.length - i1.length));

    entities.forEach((entity) => {
      const indexedEntity = indexEntity(entity, calculationList);
      indexedEntity.data = entity;
      indexedData[entity.name] = indexedEntity;
    });
  }

  function adjustWeight(indicatorID, weight) {
    // TODO: allow group (,subgroup etc.) weighting adjustment
    // TODO: make the index recalculating take into account what
    //    has changed in the data rather than doing the whole shebang
    indicatorLookup[indicatorID].userWeighting = weight;
    calculateIndex();
  }

  calculateIndex();

  return {
    getEntity,
    adjustWeight,
    adjustValue,
    indexedData,
  };
}

export default indexer;
