type Registration = {
  id: number
  participants: string[]
}

export default Registration

export type RegistrationProxy =
  Registration &
  {
    hasChanged?: boolean
  }
