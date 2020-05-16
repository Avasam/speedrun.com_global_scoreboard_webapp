export interface ServerConfigs {
  bypassUpdateRestrictions: boolean
  lastUpdatedDays: number[]
}

export default class Configs {
  public static bypassUpdateRestrictions: boolean
  public static lastUpdatedDays: number[]

  public static setConfigs = (configs: ServerConfigs) => {
    Configs.bypassUpdateRestrictions = configs.bypassUpdateRestrictions
    Configs.lastUpdatedDays = configs.lastUpdatedDays
  }
}

