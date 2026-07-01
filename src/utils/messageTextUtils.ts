export function removeLineBreaks(value: string) {
  return value.replace(/[\r\n]+/g, '');
}
