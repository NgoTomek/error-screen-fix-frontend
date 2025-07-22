// src/lib/utils/imageProcessor.js
import imageCompression from 'browser-image-compression'

/**
 * Compress image file to reduce size while maintaining quality
 * @param {File} imageFile - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (imageFile, options = {}) => {
  const defaultOptions = {
    maxSizeMB: 2, // Maximum size in MB
    maxWidthOrHeight: 1920, // Maximum width or height
    useWebWorker: true,
    fileType: imageFile.type, // Preserve original file type
    initialQuality: 0.8, // Initial quality (0 to 1)
    alwaysKeepResolution: false,
    ...options
  }

  try {
    console.log(`Original file size: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB`)
    
    const compressedFile = await imageCompression(imageFile, defaultOptions)
    
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Compression ratio: ${((1 - compressedFile.size / imageFile.size) * 100).toFixed(1)}%`)
    
    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    throw new Error('Failed to compress image. Please try a different file.')
  }
}

/**
 * Convert image file to base64 string with optional compression
 * @param {File} file - The image file
 * @param {Object} options - Options for processing
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = async (file, options = {}) => {
  const { compress = true, maxSizeMB = 2 } = options

  let processedFile = file

  // Compress if enabled and file is large
  if (compress && file.size > maxSizeMB * 1024 * 1024) {
    processedFile = await compressImage(file, { maxSizeMB })
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      resolve(event.target.result)
    }
    
    reader.onerror = (error) => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(processedFile)
  })
}

/**
 * Validate image file
 * @param {File} file - The image file to validate
 * @returns {Promise<Object>} - Validation result with image metadata
 */
export const validateImageFile = async (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  const minSize = 1024 // 1KB
  const maxDimension = 8000
  const minDimension = 50

  // Basic validation
  if (!file) {
    throw new Error('No file provided')
  }

  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error(`Invalid file type. Supported types: ${validTypes.join(', ')}`)
  }

  if (file.size < minSize) {
    throw new Error('File is too small. Minimum size is 1KB.')
  }

  if (file.size > maxSize) {
    throw new Error('File is too large. Maximum size is 10MB.')
  }

  // Load image to check dimensions
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      if (img.width < minDimension || img.height < minDimension) {
        reject(new Error(`Image is too small. Minimum dimensions are ${minDimension}x${minDimension} pixels.`))
        return
      }
      
      if (img.width > maxDimension || img.height > maxDimension) {
        reject(new Error(`Image is too large. Maximum dimensions are ${maxDimension}x${maxDimension} pixels.`))
        return
      }
      
      resolve({
        isValid: true,
        width: img.width,
        height: img.height,
        aspectRatio: (img.width / img.height).toFixed(2),
        size: file.size,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2),
        type: file.type,
        needsCompression: file.size > 2 * 1024 * 1024
      })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('File appears to be corrupted or is not a valid image.'))
    }
    
    img.src = url
  })
}

/**
 * Create thumbnail from image file
 * @param {File} file - The image file
 * @param {number} maxSize - Maximum size for thumbnail
 * @returns {Promise<string>} - Thumbnail data URL
 */
export const createThumbnail = async (file, maxSize = 200) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Calculate new dimensions
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to base64
      const thumbnail = canvas.toDataURL(file.type, 0.8)
      resolve(thumbnail)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to create thumbnail'))
    }
    
    img.src = url
  })
}

/**
 * Extract dominant colors from image
 * @param {File} file - The image file
 * @param {number} colorCount - Number of colors to extract
 * @returns {Promise<Array>} - Array of dominant colors
 */
export const extractColors = async (file, colorCount = 5) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Use smaller size for color extraction
      const size = 100
      canvas.width = size
      canvas.height = size
      
      ctx.drawImage(img, 0, 0, size, size)
      
      const imageData = ctx.getImageData(0, 0, size, size)
      const pixels = imageData.data
      const colorMap = {}
      
      // Sample colors
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const rgb = `${r},${g},${b}`
        
        colorMap[rgb] = (colorMap[rgb] || 0) + 1
      }
      
      // Sort by frequency and get top colors
      const sortedColors = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, colorCount)
        .map(([rgb]) => {
          const [r, g, b] = rgb.split(',').map(Number)
          return {
            rgb: `rgb(${r}, ${g}, ${b})`,
            hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
          }
        })
      
      resolve(sortedColors)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to extract colors'))
    }
    
    img.src = url
  })
}

/**
 * Process image for upload with all optimizations
 * @param {File} file - The image file to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processed image data
 */
export const processImageForUpload = async (file, options = {}) => {
  try {
    // Validate the image
    const validation = await validateImageFile(file)
    
    // Compress if needed
    let processedFile = file
    if (validation.needsCompression) {
      processedFile = await compressImage(file, options)
    }
    
    // Convert to base64
    const base64 = await fileToBase64(processedFile, { compress: false })
    
    // Create thumbnail
    const thumbnail = await createThumbnail(processedFile)
    
    // Extract colors (optional)
    const colors = options.extractColors ? await extractColors(processedFile) : []
    
    return {
      file: processedFile,
      base64,
      thumbnail,
      colors,
      metadata: {
        originalSize: file.size,
        processedSize: processedFile.size,
        compressionRatio: ((1 - processedFile.size / file.size) * 100).toFixed(1),
        ...validation
      }
    }
  } catch (error) {
    console.error('Image processing failed:', error)
    throw error
  }
}