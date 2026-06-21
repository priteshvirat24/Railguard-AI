# High-Resolution Textures Directory

Place your 4K/8K texture files in this folder.
For each material, the application will attempt to load a set of PBR maps: `_diffuse.jpg`, `_normal.jpg`, `_roughness.jpg`, etc.

Expected material prefixes:
- `asphalt` (For the main station ground)
- `concrete` (For platforms)
- `brick` (For the station walls)
- `gravel` (For the track bed)
- `metal` (For rails and pillars)
- `wood` (For sleepers/benches)

Example files:
- `asphalt_diffuse.jpg`
- `asphalt_normal.jpg`
- `asphalt_roughness.jpg`

If a file is missing, the `SafeTextureMaterial` will automatically fallback to the hardcoded base colors.
