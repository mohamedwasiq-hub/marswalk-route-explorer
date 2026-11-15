# MarsWalk: verified data notes

All values below were read from the product labels or the Mars ODE catalogue on **13 Nov 2026**. These notes become `data-manifest.json` on build day.

## Study area

Jezero Crater, western **depositional fan (delta)**. This is the Perseverance rover's main science target.
Bounds: **18.3921°N – 18.5887°N, 77.3439°E – 77.4663°E** (planetocentric, east-positive). About 11.6 km north–south × 6.9 km east–west.

## 1. Terrain: HiRISE DTM

| Field | Value |
|---|---|
| Product ID | `DTEEC_002387_1985_003798_1985_A01` |
| Data set | `MRO-M-HIRISE-5-DTM-V1.0` (PDS3) |
| Mission / instrument | Mars Reconnaissance Orbiter / HiRISE |
| Source stereo images | PSP_002387_1985, PSP_003798_1985 |
| Producer | University of Arizona (McEwen, Emami); ISIS + SOCET Set 5.6 |
| Rationale (from label) | "Depositional fan in Jezero Crater" |
| File | `data/raw/DTEEC_002387_1985_003798_1985_A01.IMG`, 305.2 MB |
| Download URL | https://hirise.lpl.arizona.edu/PDS/DTM/PSP/ORB_002300_002399/PSP_002387_1985_PSP_003798_1985/DTEEC_002387_1985_003798_1985_A01.IMG |
| ODE page | https://ode.rsl.wustl.edu/mars/indexproductpage.aspx?product_id=DTEEC_002387_1985_003798_1985_A01 |
| Grid | 11538 lines × 6934 samples, 1 band |
| Values | **Elevation in metres above the Mars 2000 areoid** (Smith et al. 2001). Scaling 1.0, offset 0.0. Not radius. |
| Data type | 32-bit float, little-endian (`PC_REAL`) → numpy dtype `<f4` |
| No-data | `MISSING_CONSTANT = 16#FF7FFFFB#` (≈ −3.4028e38). Mask anything ≤ −1e30. |
| Valid range | −2600.51 m to −2298.75 m (≈ 302 m of relief) |
| File layout | Fixed records of 27736 bytes; label in record 1; **image starts at byte 27736** (`^IMAGE = 2`). Each row = 6934 × 4 = 27736 bytes. |
| Projection | Equirectangular, planetocentric, sphere radius 3394.8398 km, centre lat 15.0°, centre lon 77.41° |
| Pixel scale | 1.0096476 m/pixel (true at 15° latitude) |
| Projection offsets | LINE_PROJECTION_OFFSET 1090880.5, SAMPLE_PROJECTION_OFFSET 3745.5 |

### Download verification (13 Nov 2026)

- File size **320,045,704 bytes** = 27736 × 11539 records. Matches the label exactly.
- Loaded with numpy: min **−2600.51 m**, max **−2298.75 m**, mean −2478.21 m. Matches the label's valid range.
- Valid (non-missing) pixels over the whole grid: **77.1%**. The no-data is at the skewed footprint edges, so the clip must sit inside the valid area.

### Slope-calculation note

The equirectangular scale is true at **15°** but the site is at **~18.5°**. Ground spacing per pixel at the site:

- north–south (rows): **1.0096 m**
- east–west (columns): 1.0096 × cos(18.49°) / cos(15°) ≈ **0.991 m**

Use separate dx and dy in `numpy.gradient`. The error from ignoring this is ~1.8%: small, but documenting it scores Validity points.

## 2. Image: HiRISE orthoimage (matches DTM grid)

| Field | Value |
|---|---|
| Product ID | `PSP_002387_1985_RED_C_01_ORTHO` |
| File | `data/raw/PSP_002387_1985_RED_C_01_ORTHO.JP2` (29.5 MB) + `.LBL` |
| Grid | 11538 × 6934, 8-bit, null = 0 |
| Scale / projection | **Identical to the DTM** (same scale, offsets, bounds). It overlays pixel for pixel. |
| Reads in pillow? | **Yes.** Tested: `JPEG2000 L (6934, 11538)` |

The full-resolution version `PSP_002387_1985_RED_A_01_ORTHO` (0.25 m/px, 369 MB) exists in the same folder. It isn't downloaded and isn't needed.

## 3. Environment facts

- Python 3.14.7, virtual env at `.venv` with numpy 2.5.4 and pillow 13.0.0.
- **rasterio/GDAL can't be used**: Windows Application Control blocks its DLL. Read the `.IMG` with `numpy.fromfile(..., dtype='<f4', offset=27736)`.
- Node 24, Git 2.55 installed.

## Still to check on build day

- Valid-data percentage inside the chosen clip (DTM edges are usually no-data).
- Visual alignment of the slope layer over the orthoimage.
- Pick the ~4 × 4 km clip on the delta front, with real relief for the routes to cross.

## Citation text

> HiRISE DTM DTEEC_002387_1985_003798_1985_A01 and orthoimage PSP_002387_1985_RED_C_01_ORTHO, NASA/JPL/University of Arizona, via the PDS Imaging Node / HiRISE archive and Mars ODE (Washington University in St. Louis).
