import * as Types from './types';

export function clone(o: Object) {
  return JSON.parse(JSON.stringify(o));
}

export function clamper(range: number[], value: Types.IndicatorScore) { // restrict a value to between the vales of a tuple
  return Math.min(Math.max(Number(value), range[0]), range[1]);
}

export function normalise(value: Types.IndicatorScore, range: number[] = [0, 100], normaliseTo: number = 100, clamp: boolean = false) {
  let x = Number(value);
  if (clamp) {
    x = clamper(range, value);
  }
  return ((x - range[0]) / (range[1] - range[0])) * normaliseTo;
}

export function calculateWeightedMean(weightedValues: Types.FormattedIndicator[], normaliseTo: number = 100, clamp: boolean = false) {
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
