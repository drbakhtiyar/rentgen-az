/**
 * Ziyarət-başına təsadüfi xidmət seçimi — hər element FƏRQLİ kateqoriyadan
 * (istifadəçi qaydası). Ana səhifə kartları və footer siyahısı bunu paylaşır.
 *
 * Sayt locale cookie-sinə görə hər sorğuda render olunduğu üçün seçim
 * həqiqətən ziyarət-başınadır. Footer hər səhifədə olduğundan zamanla bütün
 * xidmət səhifələri daxili link alır — SEO baxımından qəsdən belədir.
 */
export function pickCrossCategoryRandom<T extends { category: string | null }>(
  items: T[],
  n: number,
): T[] {
  const byCat = new Map<string, T[]>();
  for (const s of items) {
    if (!s.category) continue;
    byCat.set(s.category, [...(byCat.get(s.category) ?? []), s]);
  }
  const cats = [...byCat.keys()];
  for (let i = cats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cats[i], cats[j]] = [cats[j], cats[i]];
  }
  return cats.slice(0, n).map((c) => {
    const list = byCat.get(c)!;
    return list[Math.floor(Math.random() * list.length)];
  });
}
