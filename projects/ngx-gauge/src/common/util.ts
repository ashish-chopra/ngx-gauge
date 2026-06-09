export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
export function coerceBooleanProperty(value: unknown): boolean {
    return value != null && `${value}` !== 'false';
}
export function coerceNumberProperty(value: unknown, fallbackValue: number = 0): number {
    const num = Number(value);
    return isNaN(parseFloat(value as string)) || isNaN(num) ? fallbackValue : num;
}
export function cssUnit(value: number) {
    return `${value}px`;
}
export function isNumber(value: string) {
    return value != undefined && !isNaN(parseFloat(value)) && !isNaN(Number(value));
}