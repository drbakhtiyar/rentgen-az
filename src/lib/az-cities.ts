/**
 * Azerbaijan border geometry (real, simplified GeoJSON — mainland + Nakhchivan)
 * and a coordinate lookup for cities/rayons. Used by the decorative hero map to
 * place a marker on every city where we have centers (data-driven).
 *
 * Coordinates are geographic facts (static). The hero map projects them.
 */

// Real border rings as [lng, lat]. Source: world.geo.json (AZE), simplified.
export const AZ_MAINLAND: [number, number][] = [
  [47.373315, 41.219732], [47.815666, 41.151416], [47.987283, 41.405819], [48.584353, 41.80887],
  [49.110264, 41.282287], [49.618915, 40.572924], [50.08483, 40.526157], [50.392821, 40.256561],
  [49.569202, 40.176101], [49.395259, 39.399482], [49.223228, 39.049219], [48.856532, 38.815486],
  [48.883249, 38.320245], [48.634375, 38.270378], [48.010744, 38.794015], [48.355529, 39.288765],
  [48.060095, 39.582235], [47.685079, 39.508364], [46.50572, 38.770605], [46.483499, 39.464155],
  [46.034534, 39.628021], [45.610012, 39.899994], [45.891907, 40.218476], [45.359175, 40.561504],
  [45.560351, 40.81229], [45.179496, 40.985354], [44.97248, 41.248129], [45.217426, 41.411452],
  [45.962601, 41.123873], [46.501637, 41.064445], [46.637908, 41.181673], [46.145432, 41.722802],
  [46.404951, 41.860675], [46.686071, 41.827137], [47.373315, 41.219732],
];
export const AZ_NAKHCHIVAN: [number, number][] = [
  [45.001987, 39.740004], [45.298145, 39.471751], [45.739978, 39.473999], [45.735379, 39.319719],
  [46.143623, 38.741201], [45.457722, 38.874139], [44.952688, 39.335765], [44.79399, 39.713003],
  [45.001987, 39.740004],
];

// City / rayon centroids [lng, lat]. Broad coverage so new cities appear too.
export const AZ_CITY_COORDS: Record<string, [number, number]> = {
  "Bakı": [49.87, 40.41], "Sumqayıt": [49.67, 40.59], "Abşeron": [49.55, 40.47], "Xırdalan": [49.73, 40.46],
  "Gəncə": [46.36, 40.68], "Mingəçevir": [47.05, 40.77], "Yevlax": [47.15, 40.62], "Naftalan": [46.82, 40.51],
  "Göygöl": [46.32, 40.59], "Samux": [46.41, 40.76], "Şəmkir": [46.02, 40.83], "Daşkəsən": [46.08, 40.52],
  "Gədəbəy": [45.81, 40.57], "Tovuz": [45.63, 40.99], "Ağstafa": [45.45, 41.12], "Qazax": [45.35, 41.09],
  "Şəki": [47.17, 41.19], "Zaqatala": [46.64, 41.63], "Balakən": [46.41, 41.72], "Qax": [46.92, 41.42],
  "Oğuz": [47.46, 41.07], "Qəbələ": [47.85, 40.99], "İsmayıllı": [48.15, 40.79], "Ağsu": [48.40, 40.57],
  "Şamaxı": [48.64, 40.63], "Quba": [48.51, 41.36], "Qusar": [48.43, 41.43], "Xaçmaz": [48.81, 41.46],
  "Şabran": [48.99, 41.22], "Siyəzən": [49.11, 41.08], "Xızı": [49.07, 40.91],
  "Lənkəran": [48.85, 38.75], "Astara": [48.87, 38.46], "Masallı": [48.66, 39.03], "Yardımlı": [48.25, 38.90],
  "Lerik": [48.42, 38.77], "Cəlilabad": [48.50, 39.21], "Biləsuvar": [48.55, 39.46],
  "Salyan": [48.98, 39.60], "Neftçala": [49.25, 39.38], "Şirvan": [48.92, 39.93], "Hacıqabul": [48.93, 40.04],
  "Kürdəmir": [48.16, 40.34], "İmişli": [48.06, 39.87], "Sabirabad": [48.48, 40.01], "Beyləqan": [47.62, 39.77],
  "Ağcabədi": [47.46, 40.05], "Bərdə": [47.13, 40.37], "Ağdaş": [47.47, 40.65], "Göyçay": [47.74, 40.65],
  "Ucar": [47.65, 40.52], "Zərdab": [47.71, 40.22], "Tərtər": [46.93, 40.34], "Ağdam": [46.93, 39.99],
  "Naxçıvan": [45.41, 39.21], "Ordubad": [46.02, 38.91], "Culfa": [45.63, 38.96], "Şərur": [45.17, 39.55],
  "Şuşa": [46.75, 39.76], "Xankəndi": [46.75, 39.82], "Laçın": [46.55, 39.64], "Kəlbəcər": [46.04, 40.10],
  "Füzuli": [47.14, 39.60], "Cəbrayıl": [47.03, 39.40], "Zəngilan": [46.65, 39.09], "Qubadlı": [46.58, 39.34],
};

/** Canonical city key from a DB city string (strips district suffix). */
export function canonCity(raw: string | null | undefined): string {
  return (raw ?? "").split(/[—–\-(]/)[0].trim();
}

/** Resolve a DB city string to coordinates (case-insensitive), or null. */
export function cityCoords(raw: string | null | undefined): [number, number] | null {
  const key = canonCity(raw);
  if (!key) return null;
  if (AZ_CITY_COORDS[key]) return AZ_CITY_COORDS[key];
  const lk = key.toLocaleLowerCase("az");
  for (const [name, xy] of Object.entries(AZ_CITY_COORDS)) {
    if (name.toLocaleLowerCase("az") === lk) return xy;
  }
  return null;
}
