import { getCollection } from "astro:content"
import exifr from 'exifr'
import path from 'node:path'

const __dirname = import.meta.dirname;

const getFilename = (path: string) => path.replace(/^.*[\\/]/, '')

const photos = import.meta.glob<{ default: ImageMetadata }>(
  '../content/photos/*.{jpeg,jpg,png,gif,webp}'
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
  const metadata = await exifr.parse(path.join(__dirname, filepath))
  if (!metadata.FocalLength || !metadata.MaxApertureValue || !metadata.ExposureTime || !metadata.ISO) return undefined

  return {
    Camera: `${metadata.Make} ${metadata.Model}`,
    Lens: null,
    FocalLength: `${metadata.FocalLength}mm`,
    Aperture: `f${metadata.MaxApertureValue}`,
    ExposureTime: `1/${Math.round(1 / metadata.ExposureTime)}s`,
    ISO: 'ISO ' + metadata.ISO.toString(),
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
