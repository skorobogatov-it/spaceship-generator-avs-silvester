
export enum ShipFraction {
  EMPIRE = 'Империя',
  FREE_FLEET = 'Вольный Флот',
  WAR_ORPHANS = 'Сироты Войны',
  KOVARL = 'Коварол',
  HORDE = 'Орда',
  CONSTRUCTION_CARTEL = 'Строительный картель',
  CAVERNA = 'Каверна',
  PJSC_EMPIRE = 'ПАО Империя'
}

export enum ShipPurpose {
  MILITARY = 'Боевой',
  CIVILIAN = 'Гражданский'
}

export interface SizeClass {
  id: number;
  label: string;
  description: string;
  minLength: number;
  maxLength: number;
  canLand: boolean;
}

export interface GeneratorState {
  name: string;
  sizeIndex: number;
  fraction: ShipFraction;
  purpose: ShipPurpose;
  originPlanet: string;
  isRandom: boolean;
  turretCount: number;
}
