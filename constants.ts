
import { ShipFraction, ShipPurpose, SizeClass } from './types';

export const MILITARY_CLASSES: SizeClass[] = [
  { id: 1, label: 'Челнок', minLength: 5, maxLength: 15, description: 'Боевой транспорт малого радиуса.', canLand: true },
  { id: 2, label: 'Истребитель / Штурмовик', minLength: 10, maxLength: 50, description: 'Основная ударная единица космофлота.', canLand: true },
  { id: 3, label: 'Корвет / Эсминец', minLength: 80, maxLength: 250, description: 'Корабль прикрытия и охотник за истребителями.', canLand: true },
  { id: 4, label: 'Малый крейсер', minLength: 250, maxLength: 500, description: 'Автономный рейдер среднего класса.', canLand: true },
  { id: 5, label: 'Крейсер', minLength: 500, maxLength: 1000, description: 'Линейный корабль общего назначения.', canLand: true },
  { id: 6, label: 'Тяжёлый крейсер', minLength: 1000, maxLength: 2000, description: 'Огневая мощь флота, бронированный гигант.', canLand: true },
  { id: 7, label: 'Линкор', minLength: 2000, maxLength: 5000, description: 'Вершина мощи линейного флота.', canLand: false },
  { id: 8, label: 'Летающий космодром', minLength: 5000, maxLength: 10000, description: 'Мобильная база базирования целых крыльев флота.', canLand: false },
  { id: 9, label: 'Большой летающий космодром', minLength: 10000, maxLength: 30000, description: 'Стратегический хаб межзвездного присутствия.', canLand: false },
  { id: 10, label: 'Обитаемый астероид (Крепость)', minLength: 1000, maxLength: 15000, description: 'Фортификация в глубине астероидного пояса.', canLand: false },
  { id: 11, label: 'Ударный материк', minLength: 50000, maxLength: 100000, description: 'Флагман Армады, объединение мобильных баз.', canLand: false }
];

export const CIVILIAN_CLASSES: SizeClass[] = [
  { id: 1, label: 'Шлюпка / Капсула', minLength: 5, maxLength: 10, description: 'Спасательные и служебные средства.', canLand: true },
  { id: 2, label: 'Яхта / Шхуна / Челнок', minLength: 10, maxLength: 80, description: 'Частный транспорт и малые грузоперевозки.', canLand: true },
  { id: 3, label: 'Малый транспортник / Баркас', minLength: 80, maxLength: 200, description: 'Межпланетный курьер и снабжение.', canLand: true },
  { id: 4, label: 'Сухогруз / Лайнер', minLength: 200, maxLength: 500, description: 'Транспортная магистраль систем.', canLand: true },
  { id: 5, label: 'Малый транспортник (тяжёлый)', minLength: 500, maxLength: 1000, description: 'Массовая доставка ресурсов.', canLand: true },
  { id: 6, label: 'Танкер-сухогруз', minLength: 1000, maxLength: 2000, description: 'Перевозка жидких и сыпучих грузов.', canLand: true },
  { id: 7, label: 'Орбитальный грузовоз / Ковчег', minLength: 2000, maxLength: 5000, description: 'Колониальные суда дальнего следования.', canLand: false },
  { id: 8, label: 'Летающий город / Завод', minLength: 5000, maxLength: 10000, description: 'Мобильное поселение или добывающий комплекс.', canLand: false },
  { id: 9, label: 'Космический город', minLength: 10000, maxLength: 30000, description: 'Гигантский жилой сектор орбитальной сборки.', canLand: false },
  { id: 10, label: 'Обитаемый астероид (Гражданский)', minLength: 1000, maxLength: 15000, description: 'Научная или добывающая станция в астероиде.', canLand: false },
  { id: 11, label: 'Космический материк', minLength: 50000, maxLength: 100000, description: 'Объединение орбитальных мегаполисов.', canLand: false }
];

export const FRACTION_DETAILS = {
  [ShipFraction.EMPIRE]: {
    style: 'Neutral, utilitarian, massive, geometric. Reminiscent of Star Wars Star Destroyer, Mon Calamari cruisers. Clean lines, grey hull.',
    description: 'Имперский стиль: строгая геометрия, клиновидные формы.'
  },
  [ShipFraction.FREE_FLEET]: {
    style: 'Rusty, patched-up, industrial, jury-rigged. Visible pipes, missing plating, dark browns and oranges. Heavily weathered scrap-metal look.',
    description: 'Старые, ржавые суда с множеством повреждений.'
  },
  [ShipFraction.WAR_ORPHANS]: {
    style: 'Sleek, aerodynamic, black matte, stealth, futuristic. Smooth curves, minimal visible engines, silent silhouette.',
    description: 'Черные стелс-корабли обтекаемых форм.'
  },
  [ShipFraction.KOVARL]: {
    style: 'Gothic cathedral architecture merged with starship engines. Flying buttresses, stained glass elements, ornate sculptures, grimdark, Warhammer 40k style.',
    description: 'Готический стиль: летающие соборы и массивные орудия.'
  },
  [ShipFraction.HORDE]: {
    style: 'Bio-mechanical, insectoid, skeletal, organic horror. Chitinous plates, spiky limbs, glowing organic lights.',
    description: 'Инсектоидные зловещие корабли из костей и хитина.'
  },
  [ShipFraction.CONSTRUCTION_CARTEL]: {
    style: 'Functional industrial megastructures, massive cranes, spherical fuel tanks, modular habitation units, exposed trusses, vivid yellow and white colors.',
    description: 'Гигантские промышленные платформы и транспортники.'
  },
  [ShipFraction.CAVERNA]: {
    style: 'Elegant, snow-white, polished hull, sleek aerodynamic curves, high-tech minimalism, futuristic glow, like Apple-designed spacecraft.',
    description: 'Белоснежные обтекаемые суда будущего.'
  },
  [ShipFraction.PJSC_EMPIRE]: {
    style: 'Hard sci-fi, realistic modular design, 21st-century technology, similar to ISS (International Space Station), golden foil insulation, solar panels, visible trusses, white pressure modules, functional industrial look.',
    description: 'Начало эры: реалистичный дизайн XXI века.'
  }
};
