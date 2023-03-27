import { DSVRowArray } from "d3";

export type Index = any;

export type Indicator = {
  id: IndicatorId
  min: number
  max: number
  type: "calculated" | "discrete"
  diverging: boolean
  userWeighting: number
  weighting: number
  invert: boolean
}

export interface IndicatorInterface extends DSVRowArray<keyof Indicator> {

}

// ???
export type FormattedIndicator = {
  id: IndicatorId
  value: IndicatorScore
  weight: number
  range: number[]
  invert: boolean
}

export type Entity = {
  name: string
  user: Record<string, any> // User-generated scores
}

export interface EntityInterface extends DSVRowArray<keyof Entity> {
  
}

export type IndicatorLookup = {

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

