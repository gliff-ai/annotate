type RGBColor = [red: number, green: number, blue: number];

// Muted qualitative colour scheme, colourblind safe, but lacking a clear red or medium blue.
const palette: RGBColor[] = [
  [68, 170, 153],
  [136, 204, 238],
  [51, 34, 136],
  [17, 119, 51],
  [153, 153, 51],
  [221, 204, 119],
  [204, 102, 119],
  [136, 34, 85],
  [170, 68, 153],
];

const main: RGBColor = [245, 0, 87]; // Material dark theme secondary
const secondary: RGBColor = [63, 81, 181]; // Material dark theme primary

function getRGBString(color: RGBColor): string {
  return `rgb(${color.join(",")})`;
}

function getRandomPalette(): RGBColor {
  return palette[Math.floor(Math.random() * palette.length)];
}

export { palette, main, secondary, getRGBString, getRandomPalette };
