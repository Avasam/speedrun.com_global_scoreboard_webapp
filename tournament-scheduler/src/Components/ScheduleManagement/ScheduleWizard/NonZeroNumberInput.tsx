import { forwardRef, useCallback } from 'react'
import type { MaskedInputProps } from 'react-text-mask'
import MaskedInput from 'react-text-mask'

type NonZeroNumberInputProps = MaskedInputProps & { inputComponent: never }

const NonZeroNumberInput = forwardRef<HTMLElement, NonZeroNumberInputProps>(({ inputComponent, ...props }, ref) => {
  const setRef = useCallback(
    (maskedInputRef: { inputElement: HTMLElement } | null) => {
      const value = maskedInputRef ? maskedInputRef.inputElement : null

      if (typeof ref === 'function') {
        ref(value)
      } else if (ref) {
        ref.current = value
      }
    },
    [ref],
  )

  return (
    <MaskedInput
      {...props}
      guide={false}
      mask={[/[1-9]/, /\d/]}
      ref={setRef}
    />
  )
})
NonZeroNumberInput.displayName = 'NonZeroNumberInput'

export default NonZeroNumberInput
