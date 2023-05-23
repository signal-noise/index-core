export enum IndicatorType {
  CALCULATED = "calculated",
  DISCRETE = "discrete",
  CONTINUOUS = "continuous"
}

// Pre-calculated, formatted indicator
export type Indicator = {
  id: IndicatorId
  type: IndicatorType
  range: IndicatorRangeNumber[]
  invert: boolean
  diverging: boolean
  weighting: number
  userWeighting?: number
  indicatorName: string
  value: IndicatorScore
}

export type BackgroundIndicator = {
  id: BackgroundIndicatorId
  description: string
  unit: string
}

export type BackgroundIndicatorId = string;

export type IndicatorRangeNumber = number;

export type EntityName = string;

export type Entity = {
  name: EntityName
  user: User
  data?: Entity // why?
  scores: EntityScores
}

export type EntityScores = {
  [key: IndicatorId]: IndicatorScore
}

// User-generated scores
export type User = {
  [key: IndicatorId]: IndicatorScore
}

export type IndicatorLookup = {
  [key: IndicatorId]: Indicator
}

export type IndexedData = {
  [key: string]: Entity
}

export type IndicatorScore = number

// how can we be strict about the n.n.n format? perhaps using indicatorIdTest?
export type IndicatorId = string

// there's a purpose to this i guarantee it
export type IndicatorIdBit = string

export type IndexStructure = {
  id: IndicatorId
  children: IndexStructure[]
}

