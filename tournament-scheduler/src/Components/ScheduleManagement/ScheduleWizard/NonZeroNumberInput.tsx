/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InputBaseComponentProps } from '@material-ui/core'
import type { FC } from 'react'
import { forwardRef, useCallback } from 'react'
import MaskedInput from 'react-text-mask'

// Note: False positive
// eslint-disable-next-line react/display-name
const NonZeroNumberInput = forwardRef<HTMLElement>(({ inputProps, ...props }: any, ref) => {
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
}) as FC<InputBaseComponentProps>
NonZeroNumberInput.displayName = 'NonZeroNumberInput'

export default NonZeroNumberInput
