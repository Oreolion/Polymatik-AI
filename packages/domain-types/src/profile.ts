/** User-editable display names; identity always comes from a verified session. */
export function profileName(value: unknown): string | null {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/u.test(value))
    return null;
  const name = value.normalize('NFC').trim();
  return name.length > 0 && name.length <= 80 ? name : null;
}
