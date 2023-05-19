export type Indicator = {
  id: IndicatorId
  min?: number
  max?: number
  type: IndicatorType
  diverging: boolean
  userWeighting?: number
  weighting?: number
  invert: boolean
}

export enum IndicatorType {
  CALCULATED = "calculated",
  DISCRETE = "discrete",
  CONTINUOUS = "continuous"
}

// ???
export interface FormattedIndicator extends Indicator {
  weight: number
  range: number[]
  value: IndicatorScore
}

export type EntityName = string;

export type Entity = {
  [key: IndicatorId]: IndicatorScore
} & {
  name: EntityName
  value?: number
  user: User // THIS SHOULD BE OPTIONAL
  data?: Entity // why?
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

