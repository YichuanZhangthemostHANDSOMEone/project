import quantize from 'quantize';
import { prominent } from 'color.js';

export const LEGO_COLORS: { name: string; rgb: [number, number, number] }[] = [
  { name: 'White', rgb: [242, 243, 242] },
  { name: 'Black', rgb: [27, 42, 52] },
  { name: 'Red', rgb: [196, 40, 28] },
  { name: 'Blue', rgb: [13, 105, 171] },
  { name: 'Yellow', rgb: [245, 205, 48] },
  { name: 'Green', rgb: [75, 151, 75] },
  { name: 'Tan', rgb: [215, 197, 153] },
  { name: 'Dark Gray', rgb: [99, 95, 98] },
];

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
}

export async function analyzeImageData(data: ImageData): Promise<string> {
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.data.length; i += 4) {
    pixels.push([data.data[i], data.data[i + 1], data.data[i + 2]]);
  }

  const q = quantize(pixels, 8);
  const palette = q.palette();

  const dataArray = Uint8ClampedArray.from(
    palette.flatMap((p: [number, number, number]) => [...p, 255])
  );
  const dominant = (await prominent(
    new ImageData(dataArray, palette.length, 1),
    { amount: 1 }
  )) as [number, number, number];

  let closest = LEGO_COLORS[0];
  let minDist = colorDistance(dominant, closest.rgb);

  for (const color of LEGO_COLORS.slice(1)) {
    const dist = colorDistance(dominant, color.rgb);
    if (dist < minDist) {
      minDist = dist;
      closest = color;
    }
  }

  return closest.name;
}
