type QueryParams = { [param: string]: string | number | boolean | null }

const makeUrl = (location: string, queryParams?: QueryParams) =>
  `${window.process.env.REACT_APP_BASE_URL}/api/${location}` +
  (queryParams
    ? `? ${new URLSearchParams(queryParams as Record<string, string>)}`
    : '')

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
    .then(res => res.status >= 400 && res.status < 600
      ? Promise.reject(res)
      : res)

export const apiGet = (location: string, queryParams?: QueryParams) =>
  apiFetch('GET', makeUrl(location, queryParams))

export const apiPost = (location: string, body?: object) =>
  apiFetch('POST', makeUrl(location), JSON.stringify(body))

export const apiPut = (location: string, body?: object) =>
  apiFetch('PUT', makeUrl(location), JSON.stringify(body))

export const apiDelete = (location: string) =>
  apiFetch('DELETE', makeUrl(location))
