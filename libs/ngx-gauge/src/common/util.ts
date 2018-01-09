export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
export function coerceBooleanProperty(value: any): boolean {
    return value != null && `${value}` !== 'false';
}
export function coerceNumberProperty(value: any, fallbackValue: number = 0): number {
    return isNaN(parseFloat(value)) || isNaN(Number(value)) ? fallbackValue : Number(value);
}
export function cssUnit(value: number) {
    return `${value}px`;
}
export function isNumber(value: string) {
    return value != undefined && !isNaN(parseFloat(value)) && !isNaN(Number(value));
}