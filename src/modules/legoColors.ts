// src/modules/legoColors.ts
export interface LegoColor {
  name: string;
  rgb: [number, number, number];
}

// Basic LEGO color palette for classification
export const legoColors: LegoColor[] = [
  { name: 'Red',    rgb: [196, 40, 27] },
  { name: 'Blue',   rgb: [13, 105, 171] },
  { name: 'Green',  rgb: [40, 127, 70] },
  { name: 'Yellow', rgb: [245, 205, 47] },
  { name: 'White',  rgb: [255, 255, 255] },
  { name: 'Black',  rgb: [0, 0, 0] },
  { name: 'PlateColor',  rgb: [204, 198, 177] },
];
