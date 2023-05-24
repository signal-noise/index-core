import * as Types from './types';
import { DSVRowString } from 'd3';

export const validateIndicator = (indicator: DSVRowString<string>, indexMax: number): Types.Indicator => {

  if (!indicator.id) {
    console.warn(`Skipping: Indicator doesn't have an id and is probably invalid: ${JSON.stringify(indicator)}`);
    return;
  }

  if (indicator.id.includes('BG')) {
    // We're not counting background indicators for now
    // TODO: return a separate array of background indicators
    console.warn(`Skipping: Background Indicator: ${JSON.stringify(indicator)}`)
    return;
  }
  
  const getIndicatorType = () => {
    switch (indicator.type) {
      case "calculated":
        return Types.IndicatorType.CALCULATED;
      case "discrete":
        return Types.IndicatorType.DISCRETE;
      case "continuous":
        return Types.IndicatorType.CONTINUOUS;
      default:
        return Types.IndicatorType.CONTINUOUS;
    }
  }

  const coerceBoolean = (prop?: string) => {
    if (prop && prop.toLowerCase() === "true") {
      return true;
    } else {
      return false;
    }
  }

  const getRange = (min: string | undefined, max: string | undefined): Types.IndicatorRangeNumber[] => {
    // If the max is absent we're going to set it to 0 here and then change it again in index-core to whatever the custom max is
    const range = [
      !Number.isNaN(Number(min)) ? Number(min) : 0,
      !Number.isNaN(Number(max)) && Number(max) !== 0 ? Number(max) : indexMax
    ];
    
    return range;
  }

  const result = {
    id: indicator.id,
    diverging: coerceBoolean(indicator.diverging),
    type: getIndicatorType(),
    invert: coerceBoolean(indicator.invert),
    range: getRange(indicator.min, indicator.max),
    weighting: Number(indicator.weighting),
    indicatorName: indicator.indicatorName || '',
    value: 0
  }

  return result;
}

export const validateEntity = (entity: DSVRowString<string>): Types.Entity => {

  const scores: Types.EntityScores = Object.entries(entity).reduce(
    (acc: Types.EntityScores, [key, value]: [string, string]) => {
      if (!Number.isNaN(Number(value))) {
        acc[key] = Number(value);
      }
      return acc;
    },
    {}
  );

  scores[0] = 0;

  const newEntity = {
    name: entity.name || '',
    scores,
    user: {},
    data: {}
  };

  return newEntity;
}