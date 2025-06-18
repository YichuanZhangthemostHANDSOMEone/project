export function bindButton(button: HTMLButtonElement, handler: () => void) {
  button.addEventListener('click', handler);
}

export function showMessage(text: string) {
  const el = document.getElementById('result');
  if (el) {
    el.textContent = text;
  }
}
