import { useEffect } from 'react'

const deleteDashlaneNode = () => {
  console.info('deleteDashlaneNode triggered')
  document.getElementById('kw-iframe-dropdown')?.remove()
}

const DisableDashlane = () => {
  const observer = new MutationObserver(deleteDashlaneNode)
  observer.observe(document.body, { childList: true })
  useEffect(() => () => observer.disconnect())
  // eslint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: `
    iframe#kw-iframe-dropdown.kw-iframe, [data-dashlanecreated] {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
    }
  ` }}
  />
}

export default DisableDashlane
