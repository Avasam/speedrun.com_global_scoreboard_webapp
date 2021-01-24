export type ServerConfigs = {
  bypassUpdateRestrictions: boolean
  lastUpdatedDays: number[]
}

const Configs: (ServerConfigs & { setConfigs: (configs: ServerConfigs) => void }) = {
  bypassUpdateRestrictions: false,
  lastUpdatedDays: [],

  setConfigs: configs => {
    Configs.bypassUpdateRestrictions = configs.bypassUpdateRestrictions
    Configs.lastUpdatedDays = configs.lastUpdatedDays
  },
}


export default Configs
