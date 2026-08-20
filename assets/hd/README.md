# HD local asset directory

This directory is the preferred local source for V8.2+ images.

```text
assets/hd/spells/<spellKey>.webp|png|jpg
assets/hd/equipment/<equipmentId>.webp|png|jpg
```

## Quality policy

- Prefer native **380×380 tooltip artwork** from bg3.wiki.
- For equipment, prefer the tooltip/Faded artwork over 64px inventory icons.
- For spells, prefer the tooltip artwork over 144px Controller UI icons.
- A 300px MediaWiki thumbnail is only a transport/display rendition. The vendor script converts `/thumb/.../300px-...` URLs back to the original file URL before download.
- Never resize a 64/144/300px source upward and call it HD. If the Wiki only exposes a smaller source for an asset, keep it as a fallback and record its native dimensions.

Run `python tools/vendor-bg3-wiki-assets-hd.py` from the **full repository root** to populate these folders.
