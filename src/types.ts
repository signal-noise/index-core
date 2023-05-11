import { DSVRowArray } from "d3";

export type Indicator = {
  id: IndicatorId
  min?: number
  max?: number
  type: IndicatorType
  diverging: boolean
  value: IndicatorScore | null
  userWeighting?: number
  weighting?: number
  // invert: boolean
  invert: boolean | string
}

export enum IndicatorType {
  CALCULATED = "calculated",
  DISCRETE = "discrete",
  CONTINUOUS = "continuous"
}

/* eslint-disable  @typescript-eslint/no-empty-interface */
export interface IndicatorInterface extends DSVRowArray<keyof Indicator> {

}

// ???
export interface FormattedIndicator extends Indicator {
  weight: number
  range: number[]
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

/* eslint-disable  @typescript-eslint/no-empty-interface */
export interface EntityInterface extends DSVRowArray<IndicatorId> {

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

