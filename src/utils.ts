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

  const res =  ((x - range[0]) / (range[1] - range[0])) * normaliseTo;

  return res;
}

export function calculateWeightedMean(weightedValues: Types.Indicator[], normaliseTo = 100, clamp = false): number {
  let weightedSum = 0;
  let cumulativeWeight = 0;

  weightedValues.forEach(indicator => {
    const { value, range, invert, weighting } = indicator;
    const normalisedValue = normalise(value, range, normaliseTo, clamp);
    const weightedValue = invert ? ((normaliseTo - normalisedValue) * weighting) : (normalisedValue * weighting);

    weightedSum += weightedValue;
    cumulativeWeight += weighting;
  });

  return weightedSum / cumulativeWeight;
}
