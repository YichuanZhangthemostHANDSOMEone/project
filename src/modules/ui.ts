export function bindButton(button: HTMLButtonElement, handler: () => void) {
  button.addEventListener('click', handler);
}

export function showMessage(text: string) {
  const el = document.getElementById('result');
  if (el) {
    el.textContent = text;
  }
}

export function showLoadingIndicator(show: boolean) {
  const el = document.getElementById('loading-indicator');
  if (!el) {
    const div = document.createElement('div');
    div.id = 'loading-indicator';
    div.style.cssText = 'position:fixed; top:10px; right:10px; background:#fff; padding:8px; border:1px solid #ccc;';
    document.body.appendChild(div);
  }
  (document.getElementById('loading-indicator') as HTMLDivElement).textContent
      = show ? 'Loading WASM...' : '';
}