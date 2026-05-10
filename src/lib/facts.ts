import { Language } from './i18n';

export const COLOR_FACTS: Record<Language, string[]> = {
  en: [
    "Red is the first color a baby sees after black and white.",
    "Blue is consistently voted the most popular favorite color worldwide.",
    "Yellow is the most visible color from a distance, which is why it's used for school buses.",
    "The color pink is known to have a calming effect and can reduce aggression.",
    "Purple was historically associated with royalty because the dye was extremely expensive.",
    "Green is the easiest color for the human eye to process and is associated with safety.",
    "Orange is named after the fruit, not the other way around!",
    "Black isn't technically a color, but the absence of all visible light.",
    "White is a combination of all colors in the visible spectrum.",
    "Mosquitoes are twice as attracted to the color blue as any other color.",
    "The color red can actually make you feel hungrier—it's often used in restaurant logos.",
    "In ancient Rome, only the Emperor was allowed to wear a completely purple toga.",
    "There are over 10 million different colors that the human eye can distinguish.",
    "Silver is considered the most 'tech' color, often associated with innovation.",
    "Gold symbolizes wealth and success in almost every culture across history."
  ],
  ru: [
    "Красный — первый цвет, который начинает различать ребенок после черного и белого.",
    "Синий неизменно признается самым популярным любимым цветом во всем мире.",
    "Желтый — самый заметный цвет на расстоянии, поэтому его используют для школьных автобусов.",
    "Розовый цвет обладает успокаивающим эффектом и может снижать уровень агрессии.",
    "Фиолетовый исторически ассоциировался с королевской властью, так как краситель был очень дорогим.",
    "Зеленый цвет легче всего воспринимается человеческим глазом и ассоциируется с безопасностью.",
    "Оранжевый цвет был назван в честь фрукта (апельсина), а не наоборот!",
    "Черный — это технически не цвет, а отсутствие всего видимого света.",
    "Белый цвет — это сочетание всех цветов видимого спектра.",
    "Комаров в два раза больше привлекает синий цвет, чем любой другой.",
    "Красный цвет может вызывать чувство голода — его часто используют в логотипах ресторанов.",
    "В древнем Риме только императору разрешалось носить полностью пурпурную тогу.",
    "Человеческий глаз способен различать более 10 миллионов различных цветов.",
    "Серебряный считается самым 'технологичным' цветом, ассоциирующимся с инновациями.",
    "Золотой символизирует богатство и успех почти во всех культурах мира."
  ]
};

export function getRandomFact(lang: Language): string {
  const list = COLOR_FACTS[lang] || COLOR_FACTS.en;
  return list[Math.floor(Math.random() * list.length)];
}
