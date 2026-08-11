import "dotenv/config"; import { config } from "dotenv"; config({ path: [".env.local", ".env"] });
const key = process.env.GOOGLE_PLACES_API_KEY!;
const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": key,
    "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.photos",
  },
  body: JSON.stringify({ textQuery: "Alliance Clinic Baku", languageCode: "az", regionCode: "AZ" }),
});
const data = await res.json();
for (const pl of (data.places ?? []).slice(0, 4)) {
  console.log(JSON.stringify({
    id: pl.id, name: pl.displayName?.text, addr: pl.formattedAddress,
    loc: pl.location, rating: pl.rating, reviews: pl.userRatingCount,
    phone: pl.internationalPhoneNumber ?? pl.nationalPhoneNumber,
    site: pl.websiteUri, photos: (pl.photos ?? []).length,
  }, null, 1));
}
