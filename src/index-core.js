import { calculateWeightedMean, clone } from './utils.js';

function indexCore(indicatorsData = [], entitiesData = [], indexMax = 100) {
  if (indicatorsData.length === 0 || entitiesData.length === 0) return {};
  const indicatorLookup = Object.fromEntries(
    indicatorsData
      .map((indicator) => ([indicator.id, indicator])),
  );
  const indexedData = {};
  let indexStructure = {};

  function getEntity(entityName) {
    return entitiesData.find((d) => d.name === entityName);
  }

  // format an indicator for passing to the weighted mean function
  function formatIndicator(indicator, entity, max) {
    return {
      id: indicator.id,
      value: entity.user && entity.user[indicator.id]
        ? Number(entity.user[indicator.id])
        : Number(entity[indicator.id]),
      weight: indicator.userWeighting
        ? Number(indicator.userWeighting)
        : Number(indicator.weighting),
      invert: !!indicator.invert,
      range: [
        indicator.min ? Number(indicator.min) : 0,
        indicator.max ? Number(indicator.max) : max,
      ],
    };
  }

  function indexEntity(entity, calculationList) {
    const newEntity = clone(entity);

    calculationList.forEach((indicatorID) => {
      if (newEntity[indicatorID]) { console.log('overwriting', indicatorID); }
      // get the required component indicators tocalculate the parent value
      const componentIndicators = indicatorsData
        .filter((indicator) => (indicator.id.indexOf(indicatorID) === 0
          && indicator.id.length === indicatorID.length + 2))
        .map((indicator) => formatIndicator(indicator, newEntity, indexMax));
      // calculate the weighted mean of the component indicators on the newEntity
      // assign that value to the newEntity
      newEntity[indicatorID] = calculateWeightedMean(componentIndicators, indexMax);
    });

    const pillarIndicators = indicatorsData
      .filter((indicator) => indicator.id.match(/^\d/) && indicator.id.split('.').length === 1)
      .map((indicator) => formatIndicator(indicator, newEntity, indexMax));

    newEntity.value = calculateWeightedMean(pillarIndicators, indexMax);
    return newEntity;
  }

  function adjustValue(entityName, indicatorID, value) {
    const e = getEntity(entityName);
    if (indicatorLookup[indicatorID].type === 'calculated') {
      console.warn(`${indicatorID} is a calculated value and can not be adjusted directly, perhaps you meant to adjust the weighting?`);
      return clone(e);
    }
    if (!e.user) e.user = {};
    e.user[indicatorID] = value;
    return indexEntity(Object.assign(clone(e), e.user));
  }

  function createStructure(indicators) {
    const tree = {};
    indicators.filter((d) => d).forEach((id) => {
      const parts = id.split('.');
      let location = tree;
      while (parts.length > 0) {
        const i = parts.shift();

        if (!location[i]) location[i] = {};
        location = location[i];
      }
      location.id = id;
    });
    return tree;
  }

  function calculateIndex(exclude = () => false) {
    // get a list of the values we need to calculate
    // in order of deepest in the heirachy to to shallowist
    const calculationList = indicatorsData
      .filter((i) => i.id.match(/^\d/) && i.type === 'calculated' && !exclude(i))
      .map((i) => i.id)
      .sort((i1, i2) => (i2.split('.').length - i1.split('.').length));

    indexStructure = createStructure(indicatorsData.map((i) => i.id));

    entitiesData.forEach((entity) => {
      const indexedEntity = indexEntity(entity, calculationList);
      indexedEntity.data = entity;
      indexedData[entity.name] = indexedEntity;
    });
  }

  function adjustWeight(indicatorID, weight) {
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
    indexStructure,
  };
}

export default indexCore;
