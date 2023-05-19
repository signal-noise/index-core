import * as Types from './types';

// TODO rewrite this into a validator of some kind and/or merge with formatIndicator in indexcore
export const validateIndicator = (indicator: any): Types.Indicator => {
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

  const coerceBoolean = (prop: string) => {
    if (prop && prop.toLowerCase() === "true") {
      return true;
    } else {
      return false;
    }
  }

  const result = {
    id: indicator.id,
    diverging: coerceBoolean(indicator.diverging),
    type: getIndicatorType(),
    // we start off with no indicator values because they are not set in the indicators csv, they are set later from the entities list
    invert: coerceBoolean(indicator.invert),
    min: indicator.min,
    max: indicator.max,
    weighting: indicator.weighting,
    indicatorName: indicator.indicatorName
  }

  return result;
}

export const validateEntity = (entity: any): Types.Entity => {
  return {...entity};
}