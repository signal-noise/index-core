export function uniqBy(list, keyFunction){
  const dict = {};
  list.forEach(d=>{
    dict[keyFunction(d)] = d;
  })
  return Object.values(dict);
}

export function groupBy(list, keyFunction){
  const dict = {};
  list.forEach(d=>{
    if(!dict[keyFunction(d)]){
      dict[keyFunction(d)] = [];
    }
    dict[keyFunction(d)].push(d);
  });
  return dict;
}

export function normalise(value, range=[0,100], normaliseTo=100){
  return ((value - range[0]) / (range[1]-range[0]))* normaliseTo;
}

// example input array...
/*
[
  { value: 0, weight: 0.25, invert: false, range: [ 0, 1 ] },
  { value: 1, weight: 0.25, invert: false, range: [ 0, 1 ] },
  { value: 0, weight: 0.25, invert: false, range: [ 0, 1 ] },
  { value: 0, weight: 0.25, invert: false, range: [ 0, 1 ] }
]

or

[
  { value: 1, weight: 0.6, invert: false, range: [ 0, 2 ] },
  { value: 48.9, weight: 0.4, invert: true, range: [ 0, 100 ] }
]
*/



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

  return weightedSum/ cumulativeWeight;
}