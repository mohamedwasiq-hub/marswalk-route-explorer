# Sensitivity of Route B to router settings

Route A (direct) TDI at default weights: **14.2**. Each row re-runs the router with different settings, then scores the result with the same fixed method.

| Case | No-go | Penalty scale | Length (m) | Max slope | Mean slope | Over 15° | TDI |
|---|---|---|---|---|---|---|---|
| baseline | 25° | 10° | 2529 | 14.1° | 3.7° | 0.0% | 12.4 |
| stricter no-go | 20° | 10° | 2529 | 14.1° | 3.7° | 0.0% | 12.4 |
| looser no-go | 30° | 10° | 2529 | 14.1° | 3.7° | 0.0% | 12.4 |
| stronger slope penalty | 25° | 5° | 2676 | 14.6° | 3.3° | 0.0% | 13.4 |
| weaker slope penalty | 25° | 20° | 2401 | 21.3° | 4.3° | 3.0% | 12.1 |

In every case where a path exists, the terrain-aware route scores lower than the direct route.
