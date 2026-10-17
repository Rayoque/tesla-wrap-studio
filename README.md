# Wrap Studio

A mobile-first web app for designing a Tesla Paint Shop wrap for the Model 3 (2024+, Standard and Premium) on your phone.

Live: https://rayoque.github.io/tesla-wrap-studio/

- Tap Photos to load pictures from your library. Everything stays in your browser; nothing is uploaded.
- One finger drags the selected photo, two fingers pinch to scale and rotate. Tap a photo to select it.
- Layer panel: opacity, edge feather, directional fade, soft eraser, snap to panel, reorder, copy, delete. Undo and redo at the top.
- Export makes a 1024x1024 PNG clipped to the template panels, under 1 MB. Copy it to a USB drive in a folder named `Wraps`.

Template orientation: front is at the top, the hood is upside down, and the side panels are rotated 90 degrees so the top of the car faces the center.

## Credits
`template.png` and `vehicle_image.png` come from Tesla's public [teslamotors/custom-wraps](https://github.com/teslamotors/custom-wraps) repository. Uses [UPNG.js](https://github.com/photopea/UPNG.js) (MIT) and [pako](https://github.com/nodeca/pako) (MIT).
