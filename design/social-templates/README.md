# Sosial media marka şablonları (REN-28)

Instagram/Facebook üçün 3 marka şablonu, mövcud sayt brend kitinə (`src/app/globals.css`) uyğun. Bütün mətnlər placeholder-dir — real kontent REN-26-da (ilk 2 həftəlik kontent-təqvimi) SMM tərəfindən doldurulacaq.

## Fayllar

| Şablon | Ölçü | Fayl | Qeyd |
|---|---|---|---|
| Karusel — üz qapağı | 1080×1080 | `carousel/01-cover.svg` | Slayd 1/5 |
| Karusel — bədən | 1080×1080 | `carousel/02-body.svg` | Slayd 2-4 üçün təkrar istifadə olunur (nömrə/nöqtələri dəyiş) |
| Karusel — CTA | 1080×1080 | `carousel/03-cta.svg` | Slayd 5/5, bağlanış çağırışı |
| Story | 1080×1920 | `story/01-story.svg` | Tək-mesaj formatı, IG təhlükəsiz-zona bələdçisi daxildir |
| Sitat/etibar kartı | 1080×1080 | `quote-card/01-quote-card.svg` | Sual → Cavab formatı |

Hər `.svg` faylının yanında `png/` qovluğunda 1080px genişlikdə PNG önizləməsi var (sürətli baxış üçün; SVG mənbə fayl kimi qalır).

## Necə redaktə etmək olar

- SVG fayllarını birbaşa Figma/Illustrator/Inkscape-ə import edin (File → Import) və mətn qutularını real kontentlə əvəz edin.
- Şablonlar `Plus Jakarta Sans` (başlıqlar) və `Inter` (bədən mətni) şriftlərindən istifadə edir — hər ikisi pulsuz Google Fonts. Fərqli maşında açarkən şriftlərin quraşdırıldığından əmin olun, əks halda sistem şrifti ilə əvəzlənəcək.
- Kvadrat mötərizədə olan mətn (`[ Başlıq bura yazılacaq ]`) placeholder-dır — real kontentlə əvəzlənməlidir. Konturlu mötərizələr çıxarılmalıdır.
- Story şablonundakı cızıqlı "təhlükəsiz zona deyil" xətləri (`safe-zone-guides` qrupu) yalnız dizayn bələdçisidir — export etməzdən əvvəl gizlədin/silin.

## Generator

Bütün şablonlar `generate.mjs` ilə proqramatik yaradılıb (rəng/məsafə səhvlərinin qarşısını almaq üçün paylaşılan komponentlər: loqo lokapı, grid pattern, glow, scanline zolağı). Brend rəngi dəyişərsə və ya yeni slayd variantı lazım olarsa, bu faylı redaktə edib yenidən işə salın:

```
node design/social-templates/generate.mjs
```

Bu, həm `.svg` mənbələrini, həm `png/` önizləmələrini yenidən yazır.

## Brend tokenləri (`src/app/globals.css`-dən)

- `ink-900` `#0a1124` — əsas tünd fon
- `cyan-400` `#2ad4e6` / `cyan-500` `#11bdd4` — vurğu rəngi (loqo ikonu, etiketlər)
- `brand-600` `#0a5ff0` / `brand-400` `#4a9dff` — `.az` uzantısı və CTA gradient
- `surface` `#f6f9ff` / `surface-2` `#eef3fb` — açıq fon variantı
- Loqo lokapı: `ink-900` (və ya tünd fonda `white/10`) dairəvi kvadrat nişan + `ScanLine` (lucide-react) ikonu `cyan-400` rəngində + "Rentgen" + ".az" (header-client.tsx-dəki tam eyni tərkib)

## Ton qaydaları (REN-25 brifindən)

Diaqnoz və ya müalicə nəticəsi vədi olan ifadələr işlətmə (məs. "ağrısız", "100% dəqiq nəticə"). Yalnız məlumatlandırıcı, sakitləşdirici ton. Bu qayda bütün placeholder mətnlərdə də qeyd olunub ki, SMM real kontenti yazarkən unutmasın.
