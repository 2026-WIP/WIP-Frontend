import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export function isImeComposingEvent(event: ReactKeyboardEvent<HTMLElement>) {
  const nativeEvent = event.nativeEvent;
  return nativeEvent.isComposing || nativeEvent.keyCode === 229;
}
