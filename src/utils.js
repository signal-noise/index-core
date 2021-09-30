export function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export function normalise(value, range = [0, 100], normaliseTo = 100) {
  return ((value - range[0]) / (range[1] - range[0])) * normaliseTo;
}

export function calculateWeightedMean(weightedValues, normaliseTo = 100) {
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
