export function captureVideoView(video, view) {
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight || !view) return ''

  const viewRect = view.getBoundingClientRect()
  const videoRect = video.getBoundingClientRect()
  const scale = Math.max(videoRect.width / video.videoWidth, videoRect.height / video.videoHeight)
  const renderedWidth = video.videoWidth * scale
  const renderedHeight = video.videoHeight * scale
  const overflowX = renderedWidth - videoRect.width
  const overflowY = renderedHeight - videoRect.height
  const [positionX = '50%', positionY = '50%'] = getComputedStyle(video).objectPosition.split(' ')
  const positionRatioX = parseObjectPosition(positionX)
  const positionRatioY = parseObjectPosition(positionY)
  const imageOffsetX = overflowX * positionRatioX
  const imageOffsetY = overflowY * positionRatioY
  const sourceX = ((viewRect.left - videoRect.left) + imageOffsetX) / scale
  const sourceY = ((viewRect.top - videoRect.top) + imageOffsetY) / scale
  const sourceWidth = viewRect.width / scale
  const sourceHeight = viewRect.height / scale
  const cropX = Math.max(0, Math.min(video.videoWidth, sourceX))
  const cropY = Math.max(0, Math.min(video.videoHeight, sourceY))
  const cropWidth = Math.max(1, Math.min(video.videoWidth - cropX, sourceWidth))
  const cropHeight = Math.max(1, Math.min(video.videoHeight - cropY, sourceHeight))
  const canvas = document.createElement('canvas')

  canvas.width = Math.round(cropWidth)
  canvas.height = Math.round(cropHeight)
  const context = canvas.getContext('2d')
  if (!context) return ''

  context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.92)
}

function parseObjectPosition(value) {
  if (value.endsWith('%')) return Number.parseFloat(value) / 100
  if (value === 'left' || value === 'top') return 0
  if (value === 'right' || value === 'bottom') return 1
  return 0.5
}
