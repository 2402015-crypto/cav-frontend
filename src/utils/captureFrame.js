export function captureVideoView(video, view) {
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight || !view) return ''

  const viewRect = view.getBoundingClientRect()
  const scale = Math.max(viewRect.width / video.videoWidth, viewRect.height / video.videoHeight)
  const renderedWidth = video.videoWidth * scale
  const renderedHeight = video.videoHeight * scale
  const imageOffsetX = (renderedWidth - viewRect.width) / 2
  const imageOffsetY = (renderedHeight - viewRect.height) / 2
  const sourceX = imageOffsetX / scale
  const sourceY = imageOffsetY / scale
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
