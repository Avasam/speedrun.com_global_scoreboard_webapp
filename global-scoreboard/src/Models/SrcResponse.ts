export type SrcGame = {
  data: {
    id: string
    names: {
      international: string
    }
  }
}

export type SrcCategory = {
  data: {
    id: string
    name: string
  }
}

export type EmbeddedSrcRun = {
  data: {
    game: SrcGame
    category: SrcCategory
    times: {
      primary_t: number
    }
    values: Record<string, string>
  }
}

export type SrcRun = {
  data: {
    game: string
    category: string
    times: {
      primary_t: number
    }
    values: Record<string, string>
  }
}

export type SrcLeaderboard = {
  data: {
    runs: {
      run: SrcRun['data']
    }[]
  }
}

export type SrcVariable = {
  data: {
    id: string
    'is-subcategory': boolean
  }
}

export type DataArray<T extends { data: unknown }> = {
  data: T['data'][]
}
