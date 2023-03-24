import { calculateWeightedMean, clone, normalise } from './utils.js';

type Indicator = {
  id: IndicatorId
  min: number
  max: number
  type: "calculated" | "discrete"
  diverging: boolean
  userWeighting: number
  weighting: number
  invert: boolean
}

// ???
type FormattedIndicator = {
  id: IndicatorId
  value: IndicatorScore
  weight: number
  range: number[]
  invert: boolean
}

type Entity = {
  name: string
  user: Record<string, any> // User-generated scores

}

type IndicatorLookup = {

}

type IndexedData = {
  [key: string]: Entity
}

type IndicatorScore = number | string

// how can we be strict about the n.n.n format? perhaps using indicatorIdTest?
type IndicatorId = string
// there's a purpose to this i guarantee it
type IndicatorIdBit = string

type IndexStructure = {
  id: IndicatorId
  children: IndexStructure[]
}

const indicatorIdTest = /^([\w]\.)*\w{1}$/;

// TODO: the last 3 args, (indexMax, allowOverwrite, clamp) should proabbly be an options object
function indexCore(
  indicatorsData: Indicator[] = [],
  entitiesData: Entity[] = [],
  indexMax: number = 100,
  allowOverwrite: boolean = true,
  clamp: boolean = false,
) {
  if (indicatorsData.length === 0 || entitiesData.length === 0) return {};
  const indicatorLookup: IndicatorLookup = Object.fromEntries(
    indicatorsData
      .map((indicator: Indicator) => ([indicator.id, indicator])),
  );

  const indexedData: IndexedData = {};
  let indexStructure: IndexStructure = {
    id: '',
    children: []
  };
  let excludeIndicator = (indicator: Indicator) => false; // by default no valid indicators are excluded

  function getEntity(entityName): Entity {
    return indexedData[entityName];
  }

  function getEntityIndicator(entityName: string, indicatorID: string) {
    if (indexedData[entityName].user && indexedData[entityName].user[indicatorID]) {
      return indexedData[entityName].user[indicatorID];
    }
    return indexedData[entityName][indicatorID];
  }

  function getEntities() {
    return entitiesData.map((d: { name: string }) => d.name);
  }

  function getIndicator(id): Indicator {
    return indicatorLookup[id];
  }

  function getIndicatorLookup(): IndicatorLookup {
    return indicatorLookup;
  }

  function getIndexMean(indicatorID: IndicatorId = 'value', normalised: boolean = true) {
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
      return acc + normalise(Number(v[indicatorID]), indicatorRange, indexMax, clamp);
    }, 0);
    return sum / length;
  }

  // format an indicator for passing to the weighted mean function
  function formatIndicator(indicator: Indicator, entity: Entity, max: number): FormattedIndicator {
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
      weight: indicator.userWeighting
        ? Number(indicator.userWeighting)
        : Number(indicator.weighting),
      // invert: indicator.invert === true || indicator.invert.toLowerCase() === 'true',
      invert: indicator.invert === true,
      range,
    };
  }

  function indexEntity(entity: Entity, calculationList, overwrite = allowOverwrite) {
    const newEntity = clone(entity);
    calculationList.forEach((parentIndicatorID) => {
      if ((newEntity[parentIndicatorID] && overwrite === true) || !newEntity[parentIndicatorID]) {
        // get the required component indicators to calculate the parent value
        // this is a bit brittle maybe?

        const componentIndicators: FormattedIndicator[] = indicatorsData
          .filter((indicator: Indicator) => (
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

  function getIndexableIndicators(): Indicator[] {
    return indicatorsData
      .filter((i) => {
        const isIndicator = String(i.id).match(indicatorIdTest);
        const isExcluded = excludeIndicator(i);
        return isIndicator && !isExcluded;
      });
  }

  function getCalculationList(indicators: Indicator[]) {
    return indicators
      .filter((i) => (i.type === 'calculated' && !excludeIndicator(i)))
      .map((i) => i.id)
      .sort((i1, i2) => (i2.split('.').length - i1.split('.').length));
  }

  function adjustValue(entityName, indicatorID, value) {
    const e = getEntity(entityName);

    if ((!indicatorID && !value) || !e.user) {
      e.user = {}; // no value or indicator specified, reset
    } else if (!value && e.user) {
      delete e.user[indicatorID]; // no value specified, reset the indicator
    }

    if (indicatorLookup[indicatorID] && indicatorLookup[indicatorID].type === 'calculated') {
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

  function createStructure(indicatorIds: IndicatorId[]): IndexStructure {
    const tree: IndexStructure = { id: 'root', children: [] };

    indicatorIds.forEach((id: IndicatorId) => {
      const bits: IndicatorIdBit[] = id.split('.');
      let current: IndexStructure = tree;
      let builtId: IndicatorId = '';
      bits.forEach((bit: IndicatorIdBit, i) => {
        builtId = (i === 0)
          ? `${bit}`
          : `${builtId}.${bit}`;

        let next: IndexStructure | undefined = current.children.find((c: IndexStructure) => c.id === builtId);
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

  function calculateIndex(overwrite: boolean = allowOverwrite) {
    // get a list of the values we need to calculate
    // in order of deepest in the heirachy to the shallowist
    const onlyIdIndicators: Indicator[] = getIndexableIndicators();
    const calculationList = getCalculationList(onlyIdIndicators);

    indexStructure = createStructure(onlyIdIndicators.map((i: Indicator) => i.id));

    entitiesData.forEach((entity) => {
      const indexedEntity = indexEntity(entity, calculationList, overwrite);
      indexedEntity.data = entity;
      indexedData[entity.name] = indexedEntity;
    });
  }

  function adjustWeight(indicatorID: IndicatorId, weight): void {
    // TODO: make the index recalculating take into account what
    //    has changed in the data rather than doing the whole shebang
    indicatorLookup[indicatorID].userWeighting = weight;
    calculateIndex(true);
  }

  function filterIndicators(exclude = () => false, overwrite: boolean = allowOverwrite) {
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

export default indexCore;
