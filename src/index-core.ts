import { calculateWeightedMean, clone, normalise } from './utils.js';
import * as Types from './types';
import { validateIndicator, validateEntity } from './formatters';
import { DSVRowString } from 'd3';

const indicatorIdTest = /^([\w]\.)*\w{1}$/;

const index = function indexCore(
  rawIndicatorsData: DSVRowString<string>[] = [],
  rawEntitiesData: DSVRowString<string>[] = [],
  indexMax = 100,
  allowOverwrite = true,
  clamp = false,
) {
  if (rawIndicatorsData.length === 0 || rawEntitiesData.length === 0) return {};

  const indicatorsData: Types.Indicator[] = rawIndicatorsData.map((i: DSVRowString<string>) => validateIndicator(i, indexMax)).filter(i => i !== undefined);
  const entitiesData:  Types.Entity[] = rawEntitiesData.map((e: DSVRowString<string>) => validateEntity(e)).filter(i => i !== undefined);

  const indicatorLookup: Types.IndicatorLookup = Object.fromEntries(
    indicatorsData
      .map((indicator: Types.Indicator) => ([indicator.id, indicator])),
  );

  const indexedData: Types.IndexedData = {};
  const indexStructureChildren: Types.IndexStructure[] = [];

  let indexStructure: Types.IndexStructure = {
    id: '',
    children: indexStructureChildren
  };

  /* eslint-disable  @typescript-eslint/no-unused-vars */
  let excludeIndicator = (indicator: Types.Indicator) => false;

  function getEntity(entityName: string): Types.Entity {
    return indexedData[entityName];
  }

  function getEntityIndicator(entityName: string, indicatorID: Types.IndicatorId): Types.IndicatorScore {
    if (indexedData[entityName].user && indexedData[entityName].user?.[indicatorID]) {
      return indexedData[entityName].user[indicatorID];
    }
    return indexedData[entityName].scores[indicatorID];
  }

  function getEntities(): string[] {
    return entitiesData.map((d: { name: string }) => d.name);
  }

  function getIndicator(id: Types.IndicatorId): Types.Indicator {
    return indicatorLookup[id];
  }

  function getIndicatorLookup(): Types.IndicatorLookup {
    return indicatorLookup;
  }

  function getIndexMean(indicatorID: Types.IndicatorId = '0', normalised = true): number {
    const entityValues: Types.Entity[] = Object.values(indexedData);

    const indicator: Types.Indicator = indicatorLookup[indicatorID]
      ? indicatorLookup[indicatorID] : {
        id: indicatorID,
        type: Types.IndicatorType.CONTINUOUS,
        range: [0, indexMax],
        diverging: false,
        invert: false,
        weighting: 0,
        indicatorName: '',
        value: 0
      }

    let { length } = entityValues;

    const sum = entityValues.reduce((acc, v) => {
      if (Number.isNaN(Number(v.scores[indicatorID]))) {
        length -= 1;
        return acc;
      }

      if (!normalised) {
        return acc + Number(v.scores[indicatorID]);
      }

      return acc + normalise(Number(v.scores[indicatorID]), indicator.range, indexMax, clamp);
    }, 0);

    return sum / length;
  }

  function formatIndicator(indicator: Types.Indicator, entity: Types.Entity, max: number): Types.Indicator {
    let value = entity.user[indicator.id]
      ? Number(entity.user[indicator.id])
      : Number(entity.scores[indicator.id]);

    let range = [...indicator.range];

    if (indicator.diverging) {
      const centerpoint = 0;

      if (indicator.range[1]) {
        if (indicator.range[0]) {
          range = [0, Math.max(Math.abs(indicator.range[0]), Math.abs(indicator.range[1]))]
        } else {
          range = [0, max];
        }
      }
      value = Math.abs(value - centerpoint);
    }

    const result = {
      id: indicator.id,
      value,
      type: indicator.type,
      diverging: indicator.diverging,
      weighting: indicator.userWeighting
        ? Number(indicator.userWeighting)
        : Number(indicator.weighting),
      invert: indicator.invert,
      range,
      indicatorName: indicator.indicatorName
    };

    return result;
  }

  function indexEntity(entity: Types.Entity, calculationList: Types.IndicatorId[], overwrite = allowOverwrite): Types.Entity {

    const newEntityScores: Types.EntityScores = clone(entity.scores);

    const newEntity: Types.Entity = {
      name: entity.name,
      scores: newEntityScores,
      data: {},
      user: entity.user ? entity.user : {}
    }
    
    calculationList.forEach((parentIndicatorID: Types.IndicatorId) => {
      if ((newEntityScores[parentIndicatorID] && overwrite === true) || !newEntityScores[parentIndicatorID]) {
        const componentIndicators: Types.Indicator[] = indicatorsData
          .filter((indicator: Types.Indicator) => (
            indicator.id.indexOf(parentIndicatorID) === 0
            && indicator.id.split('.').length === parentIndicatorID.split('.').length + 1))
          .filter((indicator) => excludeIndicator(indicator) === false)
          .map((indicator) => formatIndicator(indicator, newEntity, indexMax));

        newEntityScores[parentIndicatorID] = calculateWeightedMean(componentIndicators, indexMax, clamp);
      } else {
        console.warn(`retaining existing value for ${entity.name} - ${parentIndicatorID} : ${Number(entity.scores[parentIndicatorID])}`);
        newEntityScores[parentIndicatorID] = Number(entity.scores[parentIndicatorID]);
      }
    });

    const pillarIndicators = indicatorsData
      .filter((indicator) => String(indicator.id).match(indicatorIdTest) && indicator.id.split('.').length === 1)
      .map((indicator) => formatIndicator(indicator, newEntity, indexMax));

    newEntity.scores[0] = calculateWeightedMean(pillarIndicators, indexMax, clamp);
  
    return newEntity;
  }

  function getIndexableIndicators(indicatorsData: Types.Indicator[]): Types.Indicator[] {
    return indicatorsData
      .filter((i: Types.Indicator) => {
        if (!i.id) {
          console.warn(`Missing id: ${JSON.stringify(i)}`);
        }

        const isIndicator = String(i.id).match(indicatorIdTest);
        const isExcluded = excludeIndicator(i);

        return isIndicator && !isExcluded;
      });
  }

  function getCalculationList(indicators: Types.Indicator[]): Types.IndicatorId[] {
    return indicators
      .filter((i) => (i.type === Types.IndicatorType.CALCULATED && !excludeIndicator(i)))
      .map((i) => i.id)
      .sort((i1, i2) => (i2.split('.').length - i1.split('.').length));
  }

  function adjustValue(entityName: Types.EntityName, indicatorID: Types.IndicatorId, value: Types.IndicatorScore): Types.Entity {
    const e: Types.Entity = getEntity(entityName);
    const isEmpty = (obj: Types.User) => Object.keys(obj).length === 0;

    if ((!indicatorID && !value) || !e.user) {
      const newUser: Types.User = {};
      e.user = newUser;
    } else if (!value && !isEmpty(e.user)) {
      delete e.user[indicatorID];
    }

    if (indicatorLookup[indicatorID] && indicatorLookup[indicatorID].type === Types.IndicatorType.CALCULATED) {
      console.warn(`${indicatorID} is a calculated value and can not be adjusted directly, perhaps you meant to adjust the weighting?`);
      return clone(e);
    }
    if (indicatorID !== undefined && value !== undefined) {
      e.user[indicatorID] = value;
    }

    const onlyIdIndicators = getIndexableIndicators(indicatorsData);
    const calculationList = getCalculationList(onlyIdIndicators);

    indexedData[e.name] = indexEntity(e, calculationList, true);

    const adjustedEntityScores: Types.EntityScores = Object.assign(clone(indexedData[e.name].scores), indexedData[e.name].user);

    const adjustedEntity: Types.Entity = {
      ...indexedData[e.name],
      scores: adjustedEntityScores
    }

    adjustedEntity.user = {};
    adjustedEntity.data = {};

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
    const onlyIdIndicators: Types.Indicator[] = getIndexableIndicators(indicatorsData);
    const calculationList = getCalculationList(onlyIdIndicators);

    indexStructure = createStructure(onlyIdIndicators.map((i: Types.Indicator) => i.id));

    entitiesData.forEach((entity: Types.Entity) => {
      const indexedEntity = indexEntity(entity, calculationList, overwrite);
      indexedEntity.data = entity.scores;
      indexedData[entity.name] = indexedEntity;
    });
  }

  function adjustWeight(indicatorID: Types.IndicatorId, weight: number): void {
    indicatorLookup[indicatorID].userWeighting = weight;
    calculateIndex(true);
  }

  function filterIndicators(exclude = (indicator: Types.Indicator) => false, overwrite: boolean = allowOverwrite): void {
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
    indexStructure
  };
}

export default index;
