import { StatusCodes } from 'http-status-codes'

type QueryParams = Record<string, boolean | number | string | null>

const firstHttpErrorCode = StatusCodes.BAD_REQUEST
const lastHttpErrorCode = 599

const makeUrl = (location: string, queryParams?: QueryParams) => {
  const targetUrl = `${window.process.env.REACT_APP_BASE_URL}/api/${location}`
  const query = new URLSearchParams(queryParams as Record<string, string>).toString()
  return query
    ? `${targetUrl}?${query}`
    : targetUrl
}

const apiFetch = (method: RequestInit['method'], url: string, body?: RequestInit['body']) =>
  fetch(url, {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
    body,
  })
    .then(res => res.status >= firstHttpErrorCode && res.status <= lastHttpErrorCode
      ? Promise.reject(res)
      : res)

export const apiGet = (location: string, queryParams?: QueryParams) =>
  apiFetch('GET', makeUrl(location, queryParams))

export const apiPost = (location: string, body: unknown) =>
  apiFetch('POST', makeUrl(location), JSON.stringify(body))

export const apiPut = (location: string, body: unknown) =>
  apiFetch('PUT', makeUrl(location), JSON.stringify(body))

export const apiDelete = (location: string) =>
  apiFetch('DELETE', makeUrl(location))
