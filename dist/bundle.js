(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.indexCore = factory());
})(this, (function () { 'use strict';

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function normalise(value, range = [0, 100], normaliseTo = 100) {
    return ((value - range[0]) / (range[1] - range[0])) * normaliseTo;
  }

  function calculateWeightedMean(weightedValues, normaliseTo = 100) {
    let weightedSum = 0;
    let cumulativeWeight = 0;
    for (let i = 0; i < weightedValues.length; i += 1) {
      const indicator = weightedValues[i];
      const normalisedValue = normalise(indicator.value, indicator.range, normaliseTo);
      const weightedValue = indicator.invert
        ? ((normaliseTo - normalisedValue) * indicator.weight)
        : (normalisedValue * indicator.weight);

      weightedSum += weightedValue;
      cumulativeWeight += indicator.weight;
    }

    return weightedSum / cumulativeWeight;
  }

  const indicatorIdTest = /^([\w]\.)*\w{1}$/;

  function indexCore(indicatorsData = [], entitiesData = [], indexMax = 100) {
    if (indicatorsData.length === 0 || entitiesData.length === 0) return {};
    const indicatorLookup = Object.fromEntries(
      indicatorsData
        .map((indicator) => ([indicator.id, indicator])),
    );
    const indexedData = {};
    let indexStructure = {};

    function getEntity(entityName) {
      return indexedData[entityName];
      //   return entitiesData.find((d) => d.name === entityName);
    }

    function getEntities() {
      return entitiesData.map((d) => d.name);
    }

    function getIndicator(id) {
      return indicatorLookup[id];
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

    function calculateIndex(exclude = () => false) {
      const onlyIdIndicators = indicatorsData.filter((i) => i.id.match(indicatorIdTest));
      // get a list of the values we need to calculate
      // in order of deepest in the heirachy to to shallowist
      const calculationList = onlyIdIndicators
        .filter((i) => i.type === 'calculated' && !exclude(i))
        .map((i) => i.id)
        .sort((i1, i2) => (i2.split('.').length - i1.split('.').length));

      indexStructure = createStructure(onlyIdIndicators.map((i) => i.id));

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
      adjustValue,
      adjustWeight,
      indexedData,
      indexStructure,
      getIndexMean,
      getEntity,
      getIndicator,
      getEntities,
    };
  }

  return indexCore;

}));
