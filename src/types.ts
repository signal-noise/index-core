export enum IndicatorType {
  CALCULATED = "calculated",
  DISCRETE = "discrete",
  CONTINUOUS = "continuous"
}

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
  data: EntityScores
  scores: EntityScores
}

export type EntityScores = {
  [key: IndicatorId]: IndicatorScore
}

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

export type IndicatorId = string

export type IndicatorIdBit = string

export type IndexStructure = {
  id: IndicatorId
  children: IndexStructure[]
}

