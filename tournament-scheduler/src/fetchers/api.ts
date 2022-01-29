import { StatusCodes } from 'http-status-codes'

type QueryParams = Record<string, boolean | number | string | null>

const firstHttpErrorCode = StatusCodes.BAD_REQUEST
const lastHttpErrorCode = 599

const makeUrl = (location: string, queryParams?: QueryParams) => {
  const targetUrl = `${window.location.origin}/api/${location}`
  const query = new URLSearchParams(queryParams as Record<string, string>).toString()

  return query
    ? `${targetUrl}?${query}`
    : targetUrl
}

const apiFetch = <R>(method: RequestInit['method'], url: string, body?: RequestInit['body']) =>
  fetch(url, {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
    body,
  })
    .then(response => response.status >= firstHttpErrorCode && response.status <= lastHttpErrorCode
      ? Promise.reject(response)
      : response)
    .then<R & { token?: string }>(response => response.json())
    .then(response => {
      // If a token is sent back as part of any response, set it.
      // This could be a first login, or a login session extension.
      if (response.token) {
        localStorage.setItem('jwtToken', response.token)
      }

      return response as R
    })

export const apiGet = <R>(location: string, queryParams?: QueryParams) =>
  apiFetch<R>('GET', makeUrl(location, queryParams))

export const apiPost = <R>(location: string, body: unknown) =>
  apiFetch<R>('POST', makeUrl(location), JSON.stringify(body))

export const apiPut = <R>(location: string, body: unknown) =>
  apiFetch<R>('PUT', makeUrl(location), JSON.stringify(body))

export const apiDelete = <R>(location: string) =>
  apiFetch<R>('DELETE', makeUrl(location))
