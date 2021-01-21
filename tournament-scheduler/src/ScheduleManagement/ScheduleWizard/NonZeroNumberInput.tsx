import MaskedInput from 'react-text-mask'

type NonZeroNumberInputProps = {
  value: number | string
  inputRef: (ref: HTMLElement | null) => void
}

const NonZeroNumberInput = (props: NonZeroNumberInputProps) => {
  const { inputRef, ...other } = props

  return (
    <MaskedInput
      {...other}
      ref={ref => {
        inputRef(ref ? ref.inputElement : null)
      }}
      mask={[/[1-9]/, /\d/,]}
      guide={false}
    />
  )
}

export default NonZeroNumberInput
