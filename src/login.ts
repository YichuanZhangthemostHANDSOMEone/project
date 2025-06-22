import { login, getUserRole } from '@modules/auth';

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm') as HTMLFormElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const message = document.getElementById('message') as HTMLElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const user = await login(emailInput.value, passwordInput.value);
      const role = await getUserRole(user.uid);
      if (role === 'teacher') {
        location.href = '/admin.html';
      } else {
        location.href = '/student.html';
      }
    } catch (err) {
      message.textContent = 'Login failed';
      console.error(err);
    }
  });
});
