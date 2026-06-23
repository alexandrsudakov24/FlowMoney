export function getCatLabel(cat: string, t: (key: string) => string): string {
    const key = `cat_${cat.toLowerCase()}`;
    const translated = t(key);
    return translated !== key ? translated : cat;
}
