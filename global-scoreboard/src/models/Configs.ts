export interface ServerConfigs {
  bypassUpdateRestrictions: boolean
  lastUpdatedDays: number[]
}

export default class Configs {
  static bypassUpdateRestrictions: boolean
  static lastUpdatedDays: number[]

  static setConfigs = (configs: ServerConfigs) => {
    Configs.bypassUpdateRestrictions = configs.bypassUpdateRestrictions
    Configs.lastUpdatedDays = configs.lastUpdatedDays
  }
}

