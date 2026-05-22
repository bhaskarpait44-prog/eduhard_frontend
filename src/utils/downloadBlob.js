export function downloadBlob(blob, filename) {
  if (!blob) {
    console.error('[Download] No blob provided')
    return
  }
  
  // Create blob if not already one
  const blobData = (blob instanceof Blob) ? blob : new Blob([blob], { type: 'application/pdf' })
  
  // Debug size
  console.log(`[Download] Starting download: ${filename} (${blobData.size} bytes)`)

  const url = window.URL.createObjectURL(blobData)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  
  // Clean up after a short delay to ensure browser captures the click
  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 500)
}
