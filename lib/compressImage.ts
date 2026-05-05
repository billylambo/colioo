import imageCompression from 'browser-image-compression'

interface CompressOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 0.4,
    maxWidthOrHeight = 1200,
  } = options

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.85,
    })
    return new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), {
      type: 'image/webp',
    })
  } catch (e) {
    console.warn('Compression échouée, fichier original utilisé:', e)
    return file
  }
}

export async function compressLogo(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 400,
  })
}

export async function compressProductImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.35,
    maxWidthOrHeight: 1200,
  })
}

export async function compressThumb(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 400,
  })
}