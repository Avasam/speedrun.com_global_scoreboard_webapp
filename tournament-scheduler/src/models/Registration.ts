export default interface Registration {
  id: number
  participants: string[]
}

export interface RegistrationProxy extends Registration {
  hasChanged?: boolean
}
