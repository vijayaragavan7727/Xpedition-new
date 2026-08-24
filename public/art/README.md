# Street Comic Noir — Art Slot System

This directory holds the image assets for the Street Comic Noir theme. All slots are styled with automated duotone filtering and graceful pure-CSS fallbacks when files are missing.

## Available Slots

| Slot Name | Recommended Resolution | Description | Fallback Behavior |
|-----------|------------------------|-------------|-------------------|
| `hero-left` | `1200 × 1600` (Portrait) | Brand panel background for main hero/login screen | Reverts to pure CSS `.city` skyline |
| `hero-banner` | `1600 × 900` (Landscape) | Wide header background for dashboard view | Reverts to pure CSS `.city` skyline |
| `avatar` | `512 × 512` (Square) | Hexagon clipped user avatar frame | Reverts to `.city` fill with Hex mark |

## Styling & Duotone Pipeline

When an image is provided:
1. **Grayscale & Contrast**: Applied via `filter: grayscale(1) contrast(1.25)`.
2. **Duotone Overlay**: Red-to-Blood gradient (`rgba(225,29,46,.55)` to `rgba(110,9,18,.85)`) overlaid with `mix-blend-mode: color`.
3. **Halftone Texture**: Overlaid with `.halftone` Ben-Day print texture at `0.35` opacity.
4. **Bottom Fade**: Bottom 40% fades seamlessly into `--ink` (`#07060B`) via `mask-image: linear-gradient(to bottom, black 60%, transparent 100%)` to ensure maximum text contrast.
