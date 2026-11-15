# AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure.
"""Read a HiRISE PDS3 DTM (.IMG with attached label) using only numpy.

rasterio/GDAL is blocked on the build machine, and the format is simple:
a text label in record 1, then a raw little-endian float32 grid.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
DTM_ID = "DTEEC_002387_1985_003798_1985_A01"
ORTHO_ID = "PSP_002387_1985_RED_C_01_ORTHO"
DTM_PATH = RAW / f"{DTM_ID}.IMG"
ORTHO_PATH = RAW / f"{ORTHO_ID}.JP2"

NODATA_BELOW = -1e30  # MISSING_CONSTANT 16#FF7FFFFB# is about -3.4e38


def _num(label: str, key: str) -> float:
    m = re.search(rf"^\s*{key}\s*=\s*([-+0-9.eE]+)", label, re.M)
    if not m:
        raise KeyError(key)
    return float(m.group(1))


@dataclass
class Dtm:
    elev: np.ndarray          # float32 [rows, cols], NaN = no data, metres above Mars 2000 areoid
    label: str
    map_resolution: float     # pixels per degree
    map_scale: float          # metres per pixel, true at center_lat
    center_lat: float
    center_lon: float
    line_offset: float
    sample_offset: float

    @property
    def site_lat(self) -> float:
        rows = self.elev.shape[0]
        return self.row_to_lat(rows / 2)

    @property
    def dy(self) -> float:
        """Ground metres per row (north-south). Equirectangular y scale is true everywhere."""
        return self.map_scale

    @property
    def dx(self) -> float:
        """Ground metres per column (east-west) at the site latitude.

        The projection scale is true at center_lat (15 deg); at the site (~18.5 deg)
        an east-west pixel covers cos(site)/cos(center) of that.
        """
        return self.map_scale * math.cos(math.radians(self.site_lat)) / math.cos(math.radians(self.center_lat))

    # PDS equirectangular convention (1-based line/sample):
    #   line   = LINE_PROJECTION_OFFSET - lat * MAP_RESOLUTION + 1
    #   sample = SAMPLE_PROJECTION_OFFSET + (lon - CENTER_LON) * cos(CENTER_LAT) * MAP_RESOLUTION + 1
    # Here row/col are 0-based array indices, so row = line - 1.
    def row_to_lat(self, row: float) -> float:
        return (self.line_offset - row) / self.map_resolution

    def col_to_lon(self, col: float) -> float:
        return self.center_lon + (col - self.sample_offset) / (
            self.map_resolution * math.cos(math.radians(self.center_lat))
        )


def read_label(path: Path = DTM_PATH) -> str:
    with open(path, "rb") as f:
        head = f.read(65536).decode("latin-1")
    end = re.search(r"\r?\nEND\s*\r?\n", head)
    return head[: end.end()] if end else head


def load_dtm(path: Path = DTM_PATH) -> Dtm:
    label = read_label(path)
    record_bytes = int(_num(label, "RECORD_BYTES"))
    image_record = int(re.search(r"\^IMAGE\s*=\s*(\d+)", label).group(1))
    rows = int(_num(label, "LINES"))
    cols = int(_num(label, "LINE_SAMPLES"))
    if "PC_REAL" not in label or int(_num(label, "SAMPLE_BITS")) != 32:
        raise ValueError("Expected 32-bit PC_REAL samples")
    offset = record_bytes * (image_record - 1)
    raw = np.fromfile(path, dtype="<f4", count=rows * cols, offset=offset).reshape(rows, cols)
    scale = _num(label, "SCALING_FACTOR")
    add = _num(label, "OFFSET")
    elev = raw.astype(np.float32)
    elev[raw <= NODATA_BELOW] = np.nan
    elev = elev * scale + add
    return Dtm(
        elev=elev,
        label=label,
        map_resolution=_num(label, "MAP_RESOLUTION"),
        map_scale=_num(label, "MAP_SCALE"),
        center_lat=_num(label, "CENTER_LATITUDE"),
        center_lon=_num(label, "CENTER_LONGITUDE"),
        line_offset=_num(label, "LINE_PROJECTION_OFFSET") - 1.0,
        sample_offset=_num(label, "SAMPLE_PROJECTION_OFFSET") - 1.0,
    )


def slope_degrees(elev: np.ndarray, dx: float, dy: float) -> np.ndarray:
    """Slope from central differences (numpy.gradient). NaN where any neighbour is missing."""
    gy, gx = np.gradient(elev, dy, dx)
    return np.degrees(np.arctan(np.hypot(gx, gy))).astype(np.float32)


def hillshade(elev: np.ndarray, dx: float, dy: float, azimuth=315.0, altitude=45.0, z=1.0) -> np.ndarray:
    gy, gx = np.gradient(elev * z, dy, dx)
    slope = np.arctan(np.hypot(gx, gy))
    # rows increase southward, so north-facing gradient is -gy
    aspect = np.arctan2(-gx, gy)
    az = math.radians(360.0 - azimuth + 90.0)
    alt = math.radians(altitude)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(shade, 0, 1)
