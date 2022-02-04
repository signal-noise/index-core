import { calculateWeightedMean, clone, normalise } from './utils.js';

const indicatorIdTest = /^([\w]\.)*\w{1}$/;

function indexCore(indicatorsData = [], entitiesData = [], indexMax = 100, allowOverwrite = true) {
  if (indicatorsData.length === 0 || entitiesData.length === 0) return {};
  const indicatorLookup = Object.fromEntries(
    indicatorsData
      .map((indicator) => ([indicator.id, indicator])),
  );
  const indexedData = {};
  let indexStructure = {};
  let excludeIndicator = () => false; // by default no valid indicators are excluded

  function getEntity(entityName) {
    return indexedData[entityName];
  }

  function getEntities() {
    return entitiesData.map((d) => d.name);
  }

  function getIndicator(id) {
    return indicatorLookup[id];
  }

  function getIndicatorLookup(){
    return indicatorLookup;
  }

  function getIndexMean(indicatorID = 'value', normalised = true) {
    // get the mean index value for a given indicator id,
    // if the value of an indicator on an entiry is falsey
    // dont take it into account
    const entityValues = Object.values(indexedData);
    const indicator = indicatorLookup[indicatorID]
      ? indicatorLookup[indicatorID]
      : { min: 0, max: indexMax };
    const indicatorRange = [
      indicator.min ? Number(indicator.min) : 0,
      indicator.max ? Number(indicator.max) : indexMax,
    ];
    let { length } = entityValues;
    const sum = entityValues.reduce((acc, v) => {
      if (Number.isNaN(Number(v[indicatorID]))) {
        length -= 1;
        return acc;
      }
      if (!normalised) {
        return acc + Number(v[indicatorID]);
      }
      return acc + normalise(Number(v[indicatorID]), indicatorRange, indexMax);
    }, 0);
    return sum / length;
  }

  // format an indicator for passing to the weighted mean function
  function formatIndicator(indicator, entity, max) {
    const diverging = !!indicator.diverging;
    let value = entity.user && entity.user[indicator.id]
      ? Number(entity.user[indicator.id])
      : Number(entity[indicator.id]);

    let range = [
      indicator.min ? Number(indicator.min) : 0,
      indicator.max ? Number(indicator.max) : max,
    ];

    if(diverging){
      let centerpoint = 0; // currently no way to set this diffeently included here as a signpost for the future

      if (indicator.max){
        range = [0, indicator.max];
        if(indicator.min){
          range = [0, Math.max(Math.abs(indicator.min),indicator.max)];
        }
      }else{
        range = [0, max];
      }
      value = Math.abs(value - centerpoint);
    }


    return {
      id: indicator.id,
      value,
      weight: indicator.userWeighting
        ? Number(indicator.userWeighting)
        : Number(indicator.weighting),
      invert: !!indicator.invert,
      range
    };
  }

  function indexEntity(entity, calculationList, overwrite = allowOverwrite) {
    const newEntity = clone(entity);
    calculationList.forEach((indicatorID) => {
      if (newEntity[indicatorID] && overwrite === true 
        || !newEntity[indicatorID]) 
      { 
        // get the required component indicators to calculate the parent value
        // this is a bit brittle maybe?
        const componentIndicators = indicatorsData
          .filter((indicator) => (indicator.id.indexOf(indicatorID) === 0
            && indicator.id.length === indicatorID.length + 2))
          .filter((indicator) => !excludeIndicator(indicator))
          .map((indicator) => formatIndicator(indicator, newEntity, indexMax));
        // calculate the weighted mean of the component indicators on the newEntity
        // assign that value to the newEntity
        newEntity[indicatorID] = calculateWeightedMean(componentIndicators, indexMax);
      }else{
        console.log(`retaining existing value for ${newEntity.name} - ${indicatorID} : ${Number(entity[indicatorID])}`)
        newEntity[indicatorID] = Number(entity[indicatorID]);
      }
    });

    const pillarIndicators = indicatorsData
      .filter((indicator) => indicator.id.match(indicatorIdTest) && indicator.id.split('.').length === 1)
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
    //note the re-indexed value for the entity is not stored
    //only the adjustment the re-indexed value is returned to the caller
    return indexEntity(Object.assign(clone(e), e.user));
  }

  function createStructure(indicatorIds) {
    const tree = { id: 'root', children: [] };

    indicatorIds.forEach((id) => {
      const bits = id.split('.');
      let current = tree;
      let builtId = '';
      bits.forEach((bit, i) => {
        builtId = (i === 0)
          ? `${bit}`
          : `${builtId}.${bit}`;

        let next = current.children.find((c) => c.id === builtId);
        if (next === undefined) {
          next = {
            id: builtId,
            children: [],
          };
          current.children.push(next);
        }

        current = next;
      });
    });
    return tree;
  }

  function calculateIndex(overwrite = allowOverwrite) {
    const onlyIdIndicators = indicatorsData
      .filter((i) =>{
        const isIndicator = i.id.match(indicatorIdTest)
        const isExcluded = excludeIndicator(i);
        return isIndicator && !isExcluded;
      });
    // get a list of the values we need to calculate
    // in order of deepest in the heirachy to to shallowist
    const calculationList = onlyIdIndicators
      .filter((i) => (i.type === 'calculated' && !excludeIndicator(i)))
      .map((i) => i.id)
      .sort((i1, i2) => (i2.split('.').length - i1.split('.').length));

    indexStructure = createStructure(onlyIdIndicators.map((i) => i.id));

    entitiesData.forEach((entity) => {
      const indexedEntity = indexEntity(entity, calculationList, overwrite);
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

  function filterIndicators(exclude = ()=>false, overwrite=allowOverwrite){
    excludeIndicator = exclude;
    calculateIndex(overwrite);  
  }

  calculateIndex(allowOverwrite);

  return {
    adjustValue,
    adjustWeight,
    filterIndicators,
    getEntity,
    getEntities,
    getIndexMean,
    getIndicator,
    getIndicatorLookup,
    indexedData,
    indexStructure,
  };
}

export default indexCore;
