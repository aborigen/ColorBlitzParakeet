export type Language = 'en' | 'ru';

export const translations = {
  en: {
    title: "Color Dash",
    titleSuffix: "Blitz",
    subtitle: "The Ultimate Matcher",
    playNow: "PLAY NOW",
    startBlitzing: "START BLITZING",
    leaderboards: "LEADERBOARDS",
    quickReflex: "QUICK REFLEX",
    matchThis: "MATCH THIS COLOR",
    blitzOver: "BLITZ OVER!",
    finalScore: "FINAL SCORE",
    colorFact: "COLOR FACT",
    retryBlitz: "RETRY BLITZ",
    mainMenu: "MAIN MENU",
    factFallback: "Color theory is the art and science of how colors interact!",
    colors: {
      'Red': 'Red',
      'Blue': 'Blue',
      'Green': 'Green',
      'Yellow': 'Yellow',
      'Cyan': 'Cyan',
      'Magenta': 'Magenta',
      'Orange': 'Orange',
      'Purple': 'Purple',
      'Coral': 'Coral',
      'Fuchsia': 'Fuchsia',
      'Teal': 'Teal',
      'Gold': 'Gold',
    }
  },
  ru: {
    title: "Цветной",
    titleSuffix: "Блиц",
    subtitle: "Ультимативный Матчер",
    playNow: "ИГРАТЬ",
    startBlitzing: "НАЧАТЬ БЛИЦ",
    leaderboards: "ЛИДЕРЫ",
    quickReflex: "РЕАКЦИЯ",
    matchThis: "НАЙДИ ЭТОТ ЦВЕТ",
    blitzOver: "БЛИЦ ОКОНЧЕН!",
    finalScore: "ФИНАЛЬНЫЙ СЧЕТ",
    colorFact: "ФАКТ О ЦВЕТЕ",
    retryBlitz: "ПОВТОРИТЬ",
    mainMenu: "В МЕНЮ",
    factFallback: "Теория цвета — это искусство и наука о взаимодействии цветов!",
    colors: {
      'Red': 'Красный',
      'Blue': 'Синий',
      'Green': 'Зеленый',
      'Yellow': 'Желтый',
      'Cyan': 'Голубой',
      'Magenta': 'Пурпурный',
      'Orange': 'Оранжевый',
      'Purple': 'Фиолетовый',
      'Coral': 'Коралловый',
      'Fuchsia': 'Фуксия',
      'Teal': 'Бирюзовый',
      'Gold': 'Золотой',
    }
  }
};

export function t(lang: Language, key: keyof typeof translations['en']): string {
  return translations[lang][key] as string;
}

export function tColor(lang: Language, colorName: string): string {
  const colors = translations[lang].colors as Record<string, string>;
  return colors[colorName] || colorName;
}
