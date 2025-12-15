// Show the UI
figma.showUI(__html__, {
  width: 200,
  height: 100,
  themeColors: true
})

// Count pixels across all pages
async function countPixels() {
  // Notify UI that we're loading
  figma.ui.postMessage({ type: 'loading' })

  // Load all pages
  await figma.loadAllPagesAsync()

  let totalPixels = 0

  for (const page of figma.root.children) {
    // Find leaf nodes only (nodes without children or with empty children)
    const leafNodes = page.findAll(node => {
      return !('children' in node) || node.children.length === 0
    })

    for (const node of leafNodes) {
      if ('width' in node && 'height' in node) {
        totalPixels += node.width * node.height
      }
    }
  }

  return totalPixels
}

// Run initial count
countPixels().then(pixels => {
  figma.ui.postMessage({ type: 'count', pixels: pixels })
})

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'refresh') {
    const pixels = await countPixels()
    figma.ui.postMessage({ type: 'count', pixels: pixels })
  }

  if (msg.type === 'close') {
    figma.closePlugin()
  }
}
