import * as Types from './types';

export function clone(o: object) {
  return JSON.parse(JSON.stringify(o));
}

export function clamper(range: number[], value: Types.IndicatorScore): number { // restrict a value to between the vales of a tuple
  return Math.min(Math.max(value, range[0]), range[1]);
}

export function normalise(value: number, range = [0, 100], normaliseTo = 100, clamp = false): number {
  let x = Number(value);
  if (clamp) {
    x = clamper(range, value);
  }
  return ((x - range[0]) / (range[1] - range[0])) * normaliseTo;
}

export function calculateWeightedMean(weightedValues: Types.FormattedIndicator[], normaliseTo = 100, clamp = false): number {
  let weightedSum = 0;
  let cumulativeWeight = 0;
  for (let i = 0; i < weightedValues.length; i += 1) {
    const indicator = weightedValues[i];
    const normalisedValue = normalise(indicator.value, indicator.range, normaliseTo, clamp);
    const weightedValue = indicator.invert
      ? ((normaliseTo - normalisedValue) * indicator.weight)
      : (normalisedValue * indicator.weight);
    weightedSum += weightedValue;
    cumulativeWeight += indicator.weight;
  }

  return weightedSum / cumulativeWeight;
}
