/* src/utils/imageUtils.js */

/**
 * Creates an image element from a URL
 */
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues
    image.src = url
  })

/**
 * Returns the cropped image as a Blob, compressed to be under a certain size if possible
 */
export async function getCroppedImg(imageSrc, pixelCrop, maxSizeKB = 50) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  // Set canvas size to the cropped dimensions
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Quality iteration to get under maxSizeKB
  let quality = 0.9
  let blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))

  while (blob && blob.size > maxSizeKB * 1024 && quality > 0.1) {
    quality -= 0.1
    blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
  }

  return blob
}
