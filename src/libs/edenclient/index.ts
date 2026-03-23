import type { Elysia } from 'elysia'
import { EdenClient } from './types'
import { catchError, filter, from, map, of, switchMap } from 'rxjs'
import { EdenFetchError } from './error'
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpResponse } from '@angular/common/http'
import { assertInInjectionContext, inject } from '@angular/core'
import { composePath } from './utils/other'

type EdenClientRuntimeOptions = {
    withCredentials?: boolean
    getAuthToken?: () => string | Promise<string> | undefined
    defaultHeaders?: Record<string, string>
}

type EdenCallOptions = {
    query?: Record<string, string>
    headers?: Record<string, string>
}

const toHeaderRecord = (headers: HttpHeaders): Record<string, string> => {
    const headerRecord: Record<string, string> = {}
    for (const key of headers.keys()) {
        const value = headers.get(key)
        if (value !== null) {
            headerRecord[key] = value
        }
    }
    return headerRecord
}

const toSuccessResponse = <T>(response: HttpResponse<T>): EdenClient.DetailedResponse<T> => {
    return {
        data: response.body as T,
        error: null,
        status: response.status,
        headers: toHeaderRecord(response.headers),
    }
}

const toDetailedFromEvent = (
    event: HttpEvent<unknown>
): EdenClient.DetailedResponse<unknown> | null => {
    if (!(event instanceof HttpResponse)) {
        return null
    }

    return toSuccessResponse(event)
}

const toErrorResponse = (error: HttpErrorResponse): EdenClient.DetailedResponse<unknown> => {
    const normalizedError = new EdenFetchError(error.status, error.error ?? error.message)

    return {
        data: null,
        error: normalizedError,
        status: error.status,
        headers: toHeaderRecord(error.headers ?? new HttpHeaders()),
    }
}

// @ts-ignore
const isServer = typeof FileList === 'undefined'

const isFile = (v: any) => {
    // @ts-ignore
    if (isServer) {
        return v instanceof Blob
    } else {
        // @ts-ignore
        return v instanceof FileList || v instanceof File
    }
}

// FormData is 1 level deep
const hasFile = (obj: Record<string, any>) => {
    if (!obj) return false

    for (const key in obj) {
        if (isFile(obj[key])) return true
        else if (
            Array.isArray(obj[key]) &&
            (obj[key] as unknown[]).find((x) => isFile(x))
        )
            return true
    }

    return false
}

// @ts-ignore
const createNewFile = (v: File) =>
    isServer
        ? v
        : new Promise<File>((resolve) => {
            // @ts-ignore
            const reader = new FileReader()

            reader.onload = () => {
                const file = new File([reader.result!], v.name, {
                    lastModified: v.lastModified,
                    type: v.type
                })
                resolve(file)
            }

            reader.readAsArrayBuffer(v)
        })


const createProxy = (
    domain: string,
    path = '',
    httpClient: HttpClient,
    runtimeOptions: EdenClientRuntimeOptions
): Record<string, any> => {
    return new Proxy(() => { }, {
        get(_, key: string) {
            return createProxy(domain, `${path}/${key}`, httpClient, runtimeOptions);
        },
        apply(_, __, [initialBody = {}, options = {}]: [
            {
                $query?: Record<string, string>,
                $headers?: Record<string, string>,
                $fetch?: EdenClient.FetchOptions,
            },
            EdenCallOptions
        ]) {
            const { $query, $headers, $fetch, ...body } = initialBody;
            const i = path.lastIndexOf('/'),
                method = path.slice(i + 1),
                endpoint = composePath(
                    domain,
                    i === -1 ? '/' : path.slice(0, i),
                    Object.assign(options.query ?? {}, $query)
                )

            const authMode =
                $fetch?.authMode ??
                (runtimeOptions.getAuthToken ? 'bearer' : 'cookie')

            const withCredentials =
                $fetch?.withCredentials ?? runtimeOptions.withCredentials ?? false

            const mergedHeaders = {
                ...(runtimeOptions.defaultHeaders ?? {}),
                ...(options.headers ?? {}),
                ...($headers ?? {}),
            }

            const errorHandler = catchError((error: HttpErrorResponse) => {
                return of(toErrorResponse(error))
            })

            const token$ =
                authMode === 'bearer' && runtimeOptions.getAuthToken
                    ? from(Promise.resolve(runtimeOptions.getAuthToken()))
                    : of(undefined)

            return token$.pipe(
                switchMap((token) => {
                    const headers = new HttpHeaders(
                        token
                            ? {
                                ...mergedHeaders,
                                Authorization: `Bearer ${token}`,
                            }
                            : mergedHeaders
                    )

                    const httpOptions = {
                        headers,
                        withCredentials,
                        observe: 'response' as const,
                        responseType: 'json' as const,
                    }

                    switch (method) {
                        case 'get':
                            return httpClient
                                .get<unknown>(endpoint, httpOptions as any)
                                .pipe(
                                    map(toDetailedFromEvent),
                                    filter((response): response is EdenClient.DetailedResponse<unknown> => response !== null),
                                    errorHandler
                                )
                        case 'post':
                            return httpClient
                                .post<unknown>(endpoint, body, httpOptions as any)
                                .pipe(
                                    map(toDetailedFromEvent),
                                    filter((response): response is EdenClient.DetailedResponse<unknown> => response !== null),
                                    errorHandler
                                )
                        case 'put':
                            return httpClient
                                .put<unknown>(endpoint, body, httpOptions as any)
                                .pipe(
                                    map(toDetailedFromEvent),
                                    filter((response): response is EdenClient.DetailedResponse<unknown> => response !== null),
                                    errorHandler
                                )
                        case 'delete':
                            return httpClient
                                .delete<unknown>(endpoint, httpOptions as any)
                                .pipe(
                                    map(toDetailedFromEvent),
                                    filter((response): response is EdenClient.DetailedResponse<unknown> => response !== null),
                                    errorHandler
                                )
                        default:
                            throw new Error(`Method ${method.toUpperCase()} is not supported`)
                    }
                })
            )
        }
    });
};

export const edenClient = <App extends Elysia<any, any, any, any, any, any>>(
    domain: string,
    options: EdenClientRuntimeOptions = {}
): EdenClient.Create<App> => {
    assertInInjectionContext(() => `edenClient can only be called inside of the constuctor context`)
    const httpClient = inject(HttpClient)
    return new Proxy(
        {},
        {
            get(target, key) {
                return createProxy(domain, key as string, httpClient, options)
            }
        }
    ) as any
}