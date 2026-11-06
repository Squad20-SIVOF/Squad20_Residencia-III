export function calculateFuelTotal(liters: number, price: number) {
  // Integer units (0.01 L and 0.0001 BRL) avoid binary rounding at half a cent.
  return (
    Math.round((Math.round(liters * 100) * Math.round(price * 10000)) / 10000) /
    100
  );
}
