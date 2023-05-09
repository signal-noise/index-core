import { calculateWeightedMean, clone, normalise } from './utils.js';
import * as Types from './types';

const indicatorIdTest = /^([\w]\.)*\w{1}$/;

// TODO: the last 3 args, (indexMax, allowOverwrite, clamp) should proabbly be an options object
const index: Types.Index = function indexCore(
  indicatorsData: Types.Indicator[] = [],
  entitiesData: Types.Entity[] = [],
  indexMax: number = 100,
  allowOverwrite: boolean = true,
  clamp: boolean = false,
) {
  if (indicatorsData.length === 0 || entitiesData.length === 0) return {};
  const indicatorLookup: Types.IndicatorLookup = Object.fromEntries(
    indicatorsData
      .map((indicator: Types.Indicator) => ([indicator.id, indicator])),
  );

  const indexedData: Types.IndexedData = {};
  let indexStructureChildren: Types.IndexStructure[] = [];

  let indexStructure: Types.IndexStructure = {
    id: '',
    children: indexStructureChildren
  };

  let excludeIndicator = (indicator?: Types.Indicator) => false; // by default no valid indicators are excluded

  function getEntity(entityName: string): Types.Entity {
    return indexedData[entityName];
  }

  function getEntityIndicator(entityName: string, indicatorID: Types.IndicatorId): Types.IndicatorScore {
    // If user has changed the value of the indicator, return that changed value instead of the original
    if (indexedData[entityName].user && indexedData[entityName].user[indicatorID]) {
      return indexedData[entityName].user[indicatorID];
    }
    return indexedData[entityName][indicatorID];
  }

  // return the NAMES of the entities
  function getEntities(): string[] {
    return entitiesData.map((d: { name: string }) => d.name);
  }

  function getIndicator(id: Types.IndicatorId): Types.Indicator {
    return indicatorLookup[id];
  }

  function getIndicatorLookup(): Types.IndicatorLookup {
    return indicatorLookup;
  }

  function getIndexMean(indicatorID: Types.IndicatorId = 'value', normalised: boolean = true): number {
    // get the mean index value for a given indicator id,
    // if the value of an indicator on an entiry is falsey
    // dont take it into account
    const entityValues: Types.Entity[] = Object.values(indexedData);
    const indicator: Types.Indicator = indicatorLookup[indicatorID]
      ? indicatorLookup[indicatorID]
      : { 
        min: 0,
        max: indexMax,
        id: '',
        value: null,
        type: Types.IndicatorType.CONTINUOUS,
        diverging: false,
        invert: false
      };
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
      return acc + normalise(Number(v[indicatorID]), indicatorRange, indexMax, clamp);
    }, 0);
    return sum / length;
  }

  // format an indicator for passing to the weighted mean function
  function formatIndicator(indicator: Types.Indicator, entity: Types.Entity, max: number): Types.FormattedIndicator {
    const diverging = (indicator.diverging === true || String(indicator.diverging).toLocaleLowerCase() === 'true');
    let value = entity.user && entity.user[indicator.id]
      ? Number(entity.user[indicator.id])
      : Number(entity[indicator.id]);

    let range = [
      indicator.min ? Number(indicator.min) : 0,
      indicator.max ? Number(indicator.max) : max,
    ];

    if (diverging) {
      // currently no way to set this diffeently included here as a signpost for the future
      const centerpoint = 0;

      if (indicator.max) {
        range = [0, indicator.max];
        if (indicator.min) {
          range = [0, Math.max(Math.abs(indicator.min), Math.abs(indicator.max))];
        }
      } else {
        range = [0, max];
      }
      value = Math.abs(value - centerpoint);
    }

    return {
      id: indicator.id,
      value,
      type: indicator.type,
      diverging,
      weight: indicator.userWeighting
        ? Number(indicator.userWeighting)
        : Number(indicator.weighting),
      // invert: indicator.invert === true || indicator.invert.toLowerCase() === 'true',
      invert: indicator.invert === true,
      range,
    };
  }

  function indexEntity(entity: Types.Entity, calculationList: Types.IndicatorId[], overwrite = allowOverwrite): Types.Entity {
    const newEntity = clone(entity);
    calculationList.forEach((parentIndicatorID: Types.IndicatorId) => {
      if ((newEntity[parentIndicatorID] && overwrite === true) || !newEntity[parentIndicatorID]) {
        // get the required component indicators to calculate the parent value
        // this is a bit brittle maybe?

        const componentIndicators: Types.FormattedIndicator[] = indicatorsData
          .filter((indicator: Types.Indicator) => (
            indicator.id.indexOf(parentIndicatorID) === 0 // the
            && indicator.id.split('.').length === parentIndicatorID.split('.').length + 1))
          .filter((indicator) => excludeIndicator(indicator) === false)
          .map((indicator) => formatIndicator(indicator, newEntity, indexMax));
        // calculate the weighted mean of the component indicators on the newEntity
        // assign that value to the newEntity
        newEntity[parentIndicatorID] = calculateWeightedMean(componentIndicators, indexMax, clamp);
      } else {
        console.warn(`retaining existing value for ${newEntity.name} - ${parentIndicatorID} : ${Number(entity[parentIndicatorID])}`);
        newEntity[parentIndicatorID] = Number(entity[parentIndicatorID]);
      }
    });

    const pillarIndicators = indicatorsData
      .filter((indicator) => String(indicator.id).match(indicatorIdTest) && indicator.id.split('.').length === 1)
      .map((indicator) => formatIndicator(indicator, newEntity, indexMax));

    newEntity.value = calculateWeightedMean(pillarIndicators, indexMax, clamp);
    if (!newEntity.user) {
      newEntity.user = {};
    }
    return newEntity;
  }

  function getIndexableIndicators(): Types.Indicator[] {
    return indicatorsData
      .filter((i: Types.Indicator) => {
        const isIndicator = String(i.id).match(indicatorIdTest);
        const isExcluded = excludeIndicator(i);
        return isIndicator && !isExcluded;
      });
  }

  function getCalculationList(indicators: Types.Indicator[]) {
    return indicators
      .filter((i) => (i.type === Types.IndicatorType.CALCULATED && !excludeIndicator(i)))
      .map((i) => i.id)
      .sort((i1, i2) => (i2.split('.').length - i1.split('.').length));
  }

  function adjustValue(entityName: Types.EntityName, indicatorID: Types.IndicatorId, value: Types.IndicatorScore): Types.Entity {
    const e: Types.Entity = getEntity(entityName);

    if ((!indicatorID && !value) || !e.user) {
      const newUser: Types.User = {};
      e.user = newUser; // no value or indicator specified, reset
    } else if (!value && e.user) {
      delete e.user[indicatorID]; // no value specified, reset the indicator
    }

    if (indicatorLookup[indicatorID] && indicatorLookup[indicatorID].type === Types.IndicatorType.CALCULATED) {
      console.warn(`${indicatorID} is a calculated value and can not be adjusted directly, perhaps you meant to adjust the weighting?`);
      return clone(e);
    }
    if (indicatorID !== undefined && value !== undefined) {
      e.user[indicatorID] = value;
    }

    const onlyIdIndicators = getIndexableIndicators();
    const calculationList = getCalculationList(onlyIdIndicators);

    indexedData[e.name] = indexEntity(e, calculationList, true);
    // console.log(indexedData[e.name])
    const adjustedEntity = Object.assign(clone(indexedData[e.name]), indexedData[e.name].user);
    delete adjustedEntity.user;
    delete adjustedEntity.data;
    return adjustedEntity;
  }

  function createStructure(indicatorIds: Types.IndicatorId[]): Types.IndexStructure {
    const tree: Types.IndexStructure = { id: 'root', children: [] };

    indicatorIds.forEach((id: Types.IndicatorId) => {
      const bits: Types.IndicatorIdBit[] = id.split('.');
      let current: Types.IndexStructure = tree;
      let builtId: Types.IndicatorId = '';
      bits.forEach((bit: Types.IndicatorIdBit, i) => {
        builtId = (i === 0)
          ? `${bit}`
          : `${builtId}.${bit}`;

        let next: Types.IndexStructure | undefined = current.children.find((c: Types.IndexStructure) => c.id === builtId);
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

  function calculateIndex(overwrite: boolean = allowOverwrite): void {
    // get a list of the values we need to calculate
    // in order of deepest in the heirachy to the shallowist
    const onlyIdIndicators: Types.Indicator[] = getIndexableIndicators();
    const calculationList = getCalculationList(onlyIdIndicators);

    indexStructure = createStructure(onlyIdIndicators.map((i: Types.Indicator) => i.id));

    entitiesData.forEach((entity: Types.Entity) => {
      const indexedEntity = indexEntity(entity, calculationList, overwrite);
      indexedEntity.data = entity;
      indexedData[entity.name] = indexedEntity;
    });
  }

  function adjustWeight(indicatorID: Types.IndicatorId, weight: number): void {
    // TODO: make the index recalculating take into account what
    //    has changed in the data rather than doing the whole shebang
    indicatorLookup[indicatorID].userWeighting = weight;
    calculateIndex(true);
  }

  function filterIndicators(exclude = () => false, overwrite: boolean = allowOverwrite): void {
    excludeIndicator = exclude;
    calculateIndex(overwrite);
  }

  calculateIndex(allowOverwrite);

  return {
    adjustValue,
    adjustWeight,
    filterIndicators,
    getEntities,
    getEntity,
    getEntityIndicator,
    getIndexMean,
    getIndicator,
    getIndicatorLookup,
    indexedData,
    indexStructure,
    debug: indexStructure
  };
}

export default index;
