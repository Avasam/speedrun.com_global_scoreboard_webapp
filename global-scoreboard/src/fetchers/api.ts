import { StatusCodes } from 'http-status-codes'

import { getLocalStorageItem, setLocalStorageItem } from 'src/utils/localStorage'

type QueryParams = Record<string, boolean | number | string | null>

const FIRST_HTTP_CODE = StatusCodes.BAD_REQUEST
const LAST_HTTP_CODE = 599

export const MAX_PAGINATION = 200

const makeUrl = (location: string, queryParams?: QueryParams) => {
  const targetUrl = location.startsWith('http')
    ? location
    : `${window.location.origin}/api/${location}`
  const query = new URLSearchParams(queryParams as Record<string, string>).toString()

  return query
    ? `${targetUrl}?${query}`
    : targetUrl
}

const apiFetch = <R>(method: RequestInit['method'], url: string, body?: RequestInit['body'], customHeaders = true) =>
  fetch(url, {
    method,
    headers: customHeaders
      ? {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer: ${getLocalStorageItem('jwtToken', '')}`,
      }
      : undefined,
    body,
  })
    .then(response => (response.status >= FIRST_HTTP_CODE && response.status <= LAST_HTTP_CODE
      // eslint-disable-next-line etc/throw-error
      ? Promise.reject(response)
      : response))
    .then<R & { token?: string }>(response => response.json())
    .then(response => {
      // If a token is sent back as part of any response, set it.
      // This could be a first login, or a login session extension.
      if (response.token) {
        setLocalStorageItem('jwtToken', response.token)
      }

      return response as R
    })

export const apiGet = <R>(location: string, queryParams?: QueryParams, customHeaders = true) =>
  apiFetch<R>('GET', makeUrl(location, queryParams), undefined, customHeaders)

export const apiPost = <R>(location: string, body?: Record<string, unknown>) =>
  apiFetch<R>('POST', makeUrl(location), JSON.stringify(body))

export const apiPut = <R>(location: string, body?: Record<string, unknown>) =>
  apiFetch<R>('PUT', makeUrl(location), JSON.stringify(body))

export const apiDelete = <R>(location: string) =>
  apiFetch<R>('DELETE', makeUrl(location))
