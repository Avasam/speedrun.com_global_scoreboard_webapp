import { forwardRef, useCallback } from 'react'
import type { MaskedInputProps } from 'react-text-mask'
import MaskedInput from 'react-text-mask'

type NonZeroNumberInputProps = MaskedInputProps & { inputComponent: unknown }

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
      ref={setRef}
      mask={[/[1-9]/, /\d/]}
      guide={false}
    />
  )
})
NonZeroNumberInput.displayName = 'NonZeroNumberInput'

export default NonZeroNumberInput
