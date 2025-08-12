import * as Headless from '@headlessui/react'
import React, { forwardRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'

export const Link = forwardRef(function Link(
  { href, ...props }: { href: string } & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  // Check if it's an external link (starts with http/https/mailto/tel) or hash link
  const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')
  
  if (isExternal) {
    // Use regular anchor tag for external links
    return (
      <Headless.DataInteractive>
        <a href={href} {...props} ref={ref} />
      </Headless.DataInteractive>
    )
  }

  // Use React Router Link for internal navigation
  return (
    <Headless.DataInteractive>
      <RouterLink to={href} {...props} ref={ref} />
    </Headless.DataInteractive>
  )
})
