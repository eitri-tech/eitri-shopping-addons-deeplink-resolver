export const delay = async (ms) => {
    return new Promise((resolve, _reject) => setTimeout(resolve, ms))
}

export const normalizeUrl = (url, host) =>{
    const normalizedHost = `https://${host
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')}`

    return url.replace(
        /^https:\/\/[^/]+\.go\.link/,
        normalizedHost
    )
}