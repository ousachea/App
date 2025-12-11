// utils/artistHelpers.js
/**
 * Normalizes artist data to ensure all works have the expected object format
 * Converts string arrays like ['ABC-123', 'DEF-456'] to object arrays like [{code: 'ABC-123'}, {code: 'DEF-456'}]
 */
export function normalizeArtists(artists) {
    return artists.map(artist => ({
        ...artist,
        mainWorks: normalizeWorks(artist.mainWorks),
        compilations: normalizeWorks(artist.compilations)
    }))
}

/**
 * Normalizes a works array - handles both string and object formats
 */
function normalizeWorks(works) {
    if (!works) return []

    return works.map(work => {
        // If it's already an object with a code property, return as is
        if (typeof work === 'object' && work.code) {
            return work
        }
        // If it's a string, convert to object
        if (typeof work === 'string') {
            return { code: work }
        }
        // Fallback
        return work
    })
}