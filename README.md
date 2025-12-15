# Pixel Counter

A Figma plugin that counts the total pixel area across all pages in your document.

## What it does

Pixel Counter scans all pages in your Figma file and calculates the total pixel area by summing up the `width × height` of every leaf node (elements without children).

## Installation

1. Open Figma Desktop
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Select the `manifest.json` file from this directory

## Usage

1. Open a Figma file
2. Run the plugin from **Plugins** → **Development** → **Pixel Counter**
3. The plugin will display the total pixel count
4. Click **Refresh** to recalculate after making changes

## Files

- `manifest.json` - Plugin configuration
- `code.js` - Main plugin logic
- `ui.html` - Plugin UI

## Compatibility

Works with both Figma and FigJam.
