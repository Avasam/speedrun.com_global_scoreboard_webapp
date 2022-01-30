export type SpeedruncomGame = {
  data: {
    id: string
    names: {
      international: string
    }
  }
}

export type SpeedruncomCategory = {
  data: {
    id: string
    name: string
  }
}

export type EmbeddedSpeedruncomRun = {
  data: {
    game: SpeedruncomGame
    category: SpeedruncomCategory
    times: {
      primary_t: number
    }
    values: Record<string, string>
  }
}

export type SpeedruncomRun = {
  data: {
    game: string
    category: string
    times: {
      primary_t: number
    }
    values: Record<string, string>
  }
}

export type SpeedruncomLeaderboard = {
  data: {
    runs: {
      run: SpeedruncomRun['data']
    }[]
  }
}

export type SpeedruncomVariable = {
  data: {
    id: string
    'is-subcategory': boolean
  }
}

export type DataArray<T extends { data: unknown }> = {
  data: T['data'][]
}
