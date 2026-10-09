# Galeria Hermes Santos — Home Hero

Static, dependency-free HTML, CSS and JavaScript. Only the Home Hero is implemented.

## Preview

Run `python -m http.server 8090 --bind 127.0.0.1` and open http://127.0.0.1:8090/.
There is no build step or package installation.

## Assets

- Room: supplied clean environment plate, regraded offline as WebP.
- Bench: supplied transparent bench, optimized as WebP.
- Logo: the complete supplied PNG, preserved byte-for-byte without retouching or cropping.
- Artwork: temporary crop from the approved hero. Replace `assets/artwork-placeholder-from-approved-hero.webp` with the original artwork.
- Typography: self-hosted Cormorant Garamond; license included in assets.

## Behavior

The CSS entrance lasts approximately 4.2 seconds, with image decoding and a 1.5-second fallback gate. Reduced-motion and JavaScript-disabled rendering show the static design. The compact menu supports keyboard navigation and Escape.

## Validation and remaining items

Local desktop/mobile rendering and JavaScript syntax were checked. No framework lint, typecheck or build scripts exist. The tonal pass preserves layout measurements, but full vertical luminance profiles do not meet every reference tolerance. Full WCAG AA, production LCP and zero CLS are not certified.

Confirm artwork alt text, provide the original artwork, and confirm navigation destinations. Fragment links are placeholders; no subsequent sections were built. The EN query link does not implement translation.
