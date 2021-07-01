import { StatusCodes } from 'http-status-codes'

type QueryParams = Record<string, boolean | number | string | null>

const FIRST_HTTP_CODE = StatusCodes.BAD_REQUEST
const LAST_HTTP_CODE = 599
export const MAX_PAGINATION = 200

const makeUrl = (location: string, queryParams?: QueryParams) => {
  const targetUrl = location.startsWith('http')
    ? location
    : `${window.process.env.REACT_APP_BASE_URL}/api/${location}`
  const query = new URLSearchParams(queryParams as Record<string, string>).toString()

  return query
    ? `${targetUrl}?${query}`
    : targetUrl
}

const apiFetch = (method: RequestInit['method'], url: string, body?: RequestInit['body'], customHeaders = true) =>
  fetch(url, {
    method,
    headers: customHeaders
      ? {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
      }
      : undefined,
    body,
  })
    .then(res => res.status >= FIRST_HTTP_CODE && res.status <= LAST_HTTP_CODE
      ? Promise.reject(res)
      : res)

export const apiGet = (location: string, queryParams?: QueryParams, customHeaders = true) =>
  apiFetch('GET', makeUrl(location, queryParams), undefined, customHeaders)

export const apiPost = (location: string, body?: Record<string, unknown>) =>
  apiFetch('POST', makeUrl(location), JSON.stringify(body))

export const apiPut = (location: string, body?: Record<string, unknown>) =>
  apiFetch('PUT', makeUrl(location), JSON.stringify(body))

export const apiDelete = (location: string) =>
  apiFetch('DELETE', makeUrl(location))
