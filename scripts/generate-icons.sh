#!/bin/bash
# Generate placeholder icons for ZenSpace PWA
# Requires ImageMagick: brew install imagemagick

# Create a simple green circle icon
convert -size 192x192 xc:none -fill "#10b981" -draw "circle 96,96 96,10" public/icon-192.png
convert -size 512x512 xc:none -fill "#10b981" -draw "circle 256,256 256,26" public/icon-512.png

echo "Icons generated!"
