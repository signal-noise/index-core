
export function clone(o){
  return JSON.parse(JSON.stringify(o));
}

export function normalise(value, range=[0,100], normaliseTo=100){
  return ((value - range[0]) / (range[1]-range[0]))* normaliseTo;
}

export function calculateWeightedMean(weightedValues, normaliseTo = 100){
  let weightedSum = 0;
  let cumulativeWeight = 0;
  for(let i = 0; i<weightedValues.length; i++){
    const normalisedValue = normalise(weightedValues[i].value, weightedValues[i].range, normaliseTo);
    const weightedValue = weightedValues[i].invert 
      ? ((normaliseTo - normalisedValue) * weightedValues[i].weight)
      : (normalisedValue * weightedValues[i].weight);

    weightedSum = weightedSum + weightedValue;
    cumulativeWeight = cumulativeWeight + weightedValues[i].weight
  }

  return weightedSum / cumulativeWeight;
}