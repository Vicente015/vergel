import { getCollection } from "astro:content"
import exifr from 'exifr'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the project root directory (works in both dev and build)
const getProjectRoot = () => {
  const currentDir = import.meta.dirname || path.dirname(fileURLToPath(import.meta.url))

  // Check if we're in a build output directory
  if (currentDir.includes('/dist/server') || currentDir.includes('\\dist\\server')) {
    // Go up to project root from dist/server/chunks
    return path.resolve(currentDir, '..', '..', '..')
  }

  // In dev mode, go up from src/utils to project root
  return path.resolve(currentDir, '..', '..')
}

const projectRoot = getProjectRoot()

const getFilename = (path: string) => path.replace(/^.*[\\/]/, '')

const photos = import.meta.glob<{ default: ImageMetadata }>(
  '../content/media/**/**/**/*.{jpeg,jpg,png,gif,webp}'
)
const photosEntries = Object.entries(photos).map(
  ([path, file]) => [getFilename(path), file] as [string, () => Promise<{ default: ImageMetadata }>]
)

const posts = await getCollection('posts')

const postsWithPhotos = posts.map((post) => ({
  ...post,
  photos: photosEntries.filter(([photo]) =>
    post.rendered!.metadata!.imagePaths.map(getFilename).includes(photo)
  )
}))

type PhotoMetadata = {
  Camera: string
  Lens: string | null
  FocalLength: string
  Aperture: string
  ExposureTime: string
  ISO: string
}

type PhotoWithMetadata = {
  file: () => Promise<{ default: ImageMetadata }>,
  metadata: PhotoMetadata
}

type PhotoWithMetadataEntry = [string, PhotoWithMetadata]

const getPhotoMetadata = async (filepath: string): Promise<PhotoMetadata | undefined> => {
  const absolutePath = path.resolve(projectRoot, 'src/utils', filepath)

  try {
    const metadata = await exifr.parse(absolutePath)
    console.debug(filepath, metadata)
    if (!metadata) return undefined
    if (!metadata.FocalLength || !metadata.MaxApertureValue || !metadata.ExposureTime || !metadata.ISO) return undefined

    return {
      Camera: `${metadata.Make} ${metadata.Model}`,
      Lens: null,
      FocalLength: `${metadata.FocalLength}mm`,
      Aperture: `f${metadata.MaxApertureValue}`,
      ExposureTime: `1/${Math.round(1 / metadata.ExposureTime)}s`,
      ISO: 'ISO ' + metadata.ISO.toString(),
    }
  } catch (error) {
    console.warn(`Failed to read EXIF from ${filepath}:`, error)
    return undefined
  }
}

const getPhotosWithMetadata = async (): Promise<Record<string, PhotoWithMetadata> | undefined> => {
  const meta = await Promise.all(
    Object.entries(photos)
      .map(async ([filepath, file]): Promise<PhotoWithMetadataEntry | undefined> => {
        const metadata = await getPhotoMetadata(filepath)
        if (!metadata) return undefined

        return [
          getFilename(filepath),
          {
            file,
            metadata
          }
        ]
      }))
  if (!meta) return undefined

  return Object.fromEntries(meta.filter(Boolean) as PhotoWithMetadataEntry[])
}

export {
  postsWithPhotos,
  photos,
  getPhotosWithMetadata
}
