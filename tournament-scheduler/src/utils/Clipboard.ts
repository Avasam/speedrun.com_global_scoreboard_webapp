const oldCopyToClipboard = (text: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'  // Avoid scrolling to bottom
  document.body.append(textArea)
  textArea.focus()
  textArea.select()
  textArea.setSelectionRange(0, 99_999) // For mobile devices

  try {
    const successful = document.execCommand('copy')
    if (!successful) throw new Error('execCommand failed')
    console.info('text copied to clipboard successfully using textarea')
  } catch (err: unknown) {
    // Note: Acceptable with clipboard actions as it's for unknown devices that work differently. Likely mobile.
    // eslint-disable-next-line no-alert
    alert(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Could not copy text: ${err}`
    )
    console.error('Could not copy text using textarea:', err)
  }

  textArea.remove()
}

const copyToClipboard = (text: string) => {
  // Note: navigator.clipboard may not exist on some devices
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!navigator.clipboard) {
    oldCopyToClipboard(text)
    return
  }

  navigator.clipboard.writeText(text).then(
    () => console.info('text copied to clipboard successfully'),
    err => {
      // Note: Acceptable with clipboard actions as it's for unknown devices that work differently. Likely mobile.
      // eslint-disable-next-line no-alert
      alert(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Could not copy text: ${err}`
      )
      console.error('Could not copy text:', err)
    }
  )
}

export default copyToClipboard
