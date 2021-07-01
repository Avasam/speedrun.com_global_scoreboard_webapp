// Note: Acceptable with clipboard actions as it's for unknown devices that work differently. Likely mobile.
/* eslint-disable no-alert */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
const MAX_SELECTION = 99_999

const oldCopyToClipboard = (text: string) =>
  new Promise<void>((resolve, reject) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'  // Avoid scrolling to bottom
    document.body.append(textArea)
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, MAX_SELECTION) // For mobile devices

    try {
      const successful = document.execCommand('copy')
      if (!successful) throw new Error('execCommand failed')
      console.info('text copied to clipboard successfully using textarea')
      // https://github.com/Microsoft/TypeScript/issues/20024
      // @ts-expect-error TypeScript should allow error type on catch
    } catch (err: Error) {
      alert(`Could not copy text: ${err}`)
      console.error('Could not copy text using textarea:', err)
      reject()
    }

    textArea.remove()
    resolve()
  })

const copyToClipboard = (text: string) => {
  // Note: navigator.clipboard may not exist on some devices
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!navigator.clipboard) {
    return oldCopyToClipboard(text)
  }

  return navigator.clipboard.writeText(text).then(
    () => console.info('text copied to clipboard successfully'),
    err => {
      alert(`Could not copy text: ${err}`)
      console.error('Could not copy text:', err)
    }
  )
}

export default copyToClipboard
