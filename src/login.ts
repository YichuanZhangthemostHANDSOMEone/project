import './styles.css';
import { auth, db } from '@modules/firebase';
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    UserCredential
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { goTo } from './utils/navigation'; // 👈

// @ts-ignore
async function redirectAfterLogin(cred: UserCredential) {
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    let role = 'student';
    if (snap.exists()) {
        role = (snap.data() as any).role;
    } else if (cred.user.email === 'steve.kerrison@jcu.edu.au') {
        role = 'teacher';
    }
    goTo('/'); // 👈
}

const loginBtn      = document.getElementById('loginBtn')      as HTMLButtonElement | null;
const googleBtn     = document.getElementById('googleBtn')     as HTMLButtonElement | null;
const loginForm     = document.getElementById('loginForm')     as HTMLFormElement | null;
const emailGroup    = document.getElementById('emailGroup')    as HTMLDivElement  | null;
const passwordGroup = document.getElementById('passwordGroup') as HTMLDivElement  | null;
const emailInput    = document.getElementById('emailInput')    as HTMLInputElement | null;
const passwordInput = document.getElementById('passwordInput') as HTMLInputElement | null;
const formBtn       = document.getElementById('formBtn')       as HTMLButtonElement | null;
const showRegister  = document.getElementById('showRegister')  as HTMLAnchorElement | null;

let step = 1;
let savedEmail = '';

// Top-bar navigation
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        goTo('/login.html'); // 👈
    });
}
if (showRegister) {
    showRegister.addEventListener('click', e => {
        e.preventDefault();
        goTo('/register.html'); // 👈
    });
}

// Google Sign-In
if (googleBtn) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    googleBtn.addEventListener('click', async e => {
        e.preventDefault();
        try {
            const cred = await signInWithPopup(auth, provider);
            await redirectAfterLogin(cred);
        } catch (err: any) {
            alert('Google 登录失败：' + err.message);
        }
    });
}

// Email/Password Two-Step Login
if (loginForm && emailGroup && passwordGroup && emailInput && passwordInput && formBtn) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();

        if (step === 1) {
            savedEmail = emailInput.value.trim();
            if (!savedEmail) {
                alert('Please enter a valid email.');
                return;
            }
            emailGroup.classList.add('hidden');
            googleBtn?.classList.add('hidden');
            document.querySelector('.divider')?.classList.add('hidden');
            passwordGroup.classList.remove('hidden');
            formBtn.textContent = 'Log in';
            passwordInput.focus();
            step = 2;
        } else {
            const pwd = passwordInput.value;
            if (!pwd) {
                alert('Please enter your password.');
                return;
            }
            try {
                const cred = await signInWithEmailAndPassword(auth, savedEmail, pwd);
                await redirectAfterLogin(cred);
            } catch (err: any) {
                alert('Login failed: ' + err.message);
            }
        }
    });
}