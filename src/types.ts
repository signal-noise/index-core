import { DSVRowArray } from "d3";

export type Index = any;

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
  DISCRETE = "discrete"
}

export interface IndicatorInterface extends DSVRowArray<keyof Indicator> {

}

// ???
export interface FormattedIndicator extends Indicator {
  value: IndicatorScore
  weight: number
  range: number[]
}

export type EntityName = string;

export type Entity = {
  name: EntityName
  value: number
  user: User
  data: Entity
}

// User-generated scores
export type User = {
  [key: IndicatorId]: IndicatorScore
}

export interface EntityInterface extends DSVRowArray<keyof Entity> {

}

export type IndicatorLookup = {
  [key: IndicatorId]: Indicator
}

export type IndexedData = {
  [key: string]: Entity
}

export type IndicatorScore = number | string

// how can we be strict about the n.n.n format? perhaps using indicatorIdTest?
export type IndicatorId = string

// there's a purpose to this i guarantee it
export type IndicatorIdBit = string

export type IndexStructure = {
  id: IndicatorId
  children: IndexStructure[]
}

