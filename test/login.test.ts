import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/dom'

jest.mock('../src/utils/navigation', () => ({
    goTo: jest.fn()
}))
import { goTo } from '../src/utils/navigation'
const goToMock = goTo as unknown as jest.Mock

jest.mock('firebase/app', () => ({ initializeApp: jest.fn() }))
jest.mock('@firebase/app', () => ({
    getApp: jest.fn(() => ({})),
    initializeApp: jest.fn()
}))
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})),
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
        setCustomParameters: jest.fn(),
    })),
}))
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => ({})),
    doc: jest.fn(),
    getDoc: jest.fn(),
}))
jest.mock('firebase/analytics', () => ({ getAnalytics: jest.fn() }))

if (!HTMLFormElement.prototype.requestSubmit) {
    HTMLFormElement.prototype.requestSubmit = function() {
        const ev = new Event('submit', { bubbles: true, cancelable: true })
        this.dispatchEvent(ev)
    }
}

function setupDom() {
    document.body.innerHTML = `
    <form id="loginForm">
      <div id="emailGroup">
        <input id="emailInput" type="email"/>
      </div>
      <div class="divider"></div>
      <button id="googleBtn" type="button">Google 登录</button>
      <div id="passwordGroup" class="hidden">
        <input id="passwordInput" type="password"/>
      </div>
      <button id="formBtn" type="submit">Next</button>
    </form>
    <button id="loginBtn" type="button">Login</button>
    <a id="showRegister">Register</a>
    `
}

describe('login.ts', () => {
    let mockSignInWithEmailAndPassword: jest.Mock
    let mockSignInWithPopup: jest.Mock
    let mockGetDoc: jest.Mock

    beforeEach(() => {
        goToMock.mockClear()
    });

    it('Clicking the "Login" button should redirect to /login.html', () => {
        jest.isolateModules(() => {
            setupDom();
            require('firebase/auth').signInWithEmailAndPassword = jest.fn();
            require('firebase/auth').signInWithPopup = jest.fn();
            require('firebase/firestore').getDoc = jest.fn();

            require('../src/login');
            fireEvent.click(document.getElementById('loginBtn')!);
            expect(goToMock).toHaveBeenCalledWith('/login.html');
        });
    });

    it('Clicking on the "Register" link should redirect to /register.html', () => {
        jest.isolateModules(() => {
            setupDom();
            require('firebase/auth').signInWithEmailAndPassword = jest.fn();
            require('firebase/auth').signInWithPopup = jest.fn();
            require('firebase/firestore').getDoc = jest.fn();

            require('../src/login');
            fireEvent.click(document.getElementById('showRegister')!);
            expect(goToMock).toHaveBeenCalledWith('/register.html');
        });
    });

    it('When an empty email is submitted, a prompt should be displayed.', () => {
        jest.isolateModules(() => {
            setupDom();
            require('../src/login');
            jest.spyOn(window, 'alert').mockImplementation(() => {});
            const loginForm = document.getElementById('loginForm') as HTMLFormElement;
            fireEvent.submit(loginForm);
            expect(window.alert).toHaveBeenCalledWith('Please enter a valid email.');
        });
    });

    it('After entering a valid email address, you should proceed to the second step.', () => {
        jest.isolateModules(() => {
            setupDom();
            require('../src/login');
            const loginForm   = document.getElementById('loginForm')   as HTMLFormElement;
            const emailInput  = document.getElementById('emailInput')  as HTMLInputElement;
            const emailGroup  = document.getElementById('emailGroup')!;
            const googleBtn   = document.getElementById('googleBtn')!;
            const divider     = document.querySelector('.divider')!;
            const pwdGroup    = document.getElementById('passwordGroup')!;
            const formBtn     = document.getElementById('formBtn')!;

            emailInput.value = 'user@example.com';
            fireEvent.submit(loginForm);

            expect(emailGroup).toHaveClass('hidden');
            expect(googleBtn).toHaveClass('hidden');
            expect(divider).toHaveClass('hidden');
            expect(pwdGroup).not.toHaveClass('hidden');
            expect(formBtn.textContent).toBe('Log in');
        });
    });

    it('When entering the second set of passwords, a prompt should be displayed.', () => {
        jest.isolateModules(() => {
            setupDom();
            require('../src/login');
            const loginForm  = document.getElementById('loginForm')  as HTMLFormElement;
            const emailInput = document.getElementById('emailInput') as HTMLInputElement;

            // 先走到第二步
            emailInput.value = 'user@example.com';
            fireEvent.submit(loginForm);

            jest.spyOn(window, 'alert').mockImplementation(() => {});
            fireEvent.submit(loginForm);
            expect(window.alert).toHaveBeenCalledWith('Please enter your password.');
        });
    });

    it('After successful login via email/password, the page should automatically redirect to the home page.', async () => {
        await new Promise<void>(resolve => {
            jest.isolateModules(async () => {
                setupDom();
                mockSignInWithEmailAndPassword = require('firebase/auth').signInWithEmailAndPassword;
                mockGetDoc                     = require('firebase/firestore').getDoc;

                mockSignInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u1', email: 'user@example.com' } });
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data:   () => ({ role: 'student' })
                });

                require('../src/login');
                const loginForm     = document.getElementById('loginForm')     as HTMLFormElement;
                const emailInput    = document.getElementById('emailInput')    as HTMLInputElement;
                const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;

                emailInput.value = 'user@example.com';
                fireEvent.submit(loginForm);

                passwordInput.value = 'correct-password';
                fireEvent.submit(loginForm);

                setTimeout(() => {
                    expect(mockSignInWithEmailAndPassword)
                        .toHaveBeenCalledWith(expect.anything(), 'user@example.com', 'correct-password');
                    expect(goToMock).toHaveBeenCalledWith('/');
                    resolve();
                }, 0);
            });
        });
    });

    it('After successful login to Google, it should redirect to the home page.', async () => {
        await new Promise<void>(resolve => {
            jest.isolateModules(async () => {
                setupDom();
                mockSignInWithPopup = require('firebase/auth').signInWithPopup;
                mockGetDoc          = require('firebase/firestore').getDoc;

                mockSignInWithPopup.mockResolvedValue({ user: { uid: 'u2', email: 'guser@example.com' } });
                mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });

                require('../src/login');
                const googleBtn = document.getElementById('googleBtn') as HTMLButtonElement;
                fireEvent.click(googleBtn);

                setTimeout(() => {
                    expect(mockSignInWithPopup).toHaveBeenCalled();
                    expect(goToMock).toHaveBeenCalledWith('/');
                    resolve();
                }, 0);
            });
        });
    });

    it('When the login with email and password fails, an error message should be displayed.', async () => {
        await new Promise<void>(resolve => {
            jest.isolateModules(async () => {
                setupDom();
                mockSignInWithEmailAndPassword = require('firebase/auth').signInWithEmailAndPassword;

                require('../src/login');
                const loginForm     = document.getElementById('loginForm')     as HTMLFormElement;
                const emailInput    = document.getElementById('emailInput')    as HTMLInputElement;
                const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;

                emailInput.value = 'user@example.com';
                fireEvent.submit(loginForm);

                mockSignInWithEmailAndPassword.mockRejectedValue({ message: 'Invalid credentials' });
                jest.spyOn(window, 'alert').mockImplementation(() => {});

                passwordInput.value = 'wrong-password';
                fireEvent.submit(loginForm);

                setTimeout(() => {
                    expect(window.alert).toHaveBeenCalledWith('Login failed: Invalid credentials');
                    resolve();
                }, 0);
            });
        });
    });

    it('When Google login fails, an error message should be displayed.', async () => {
        await new Promise<void>(resolve => {
            jest.isolateModules(async () => {
                setupDom();
                mockSignInWithPopup = require('firebase/auth').signInWithPopup;
                mockSignInWithPopup.mockRejectedValue({ message: 'some error' });
                jest.spyOn(window, 'alert').mockImplementation(() => {});

                require('../src/login');
                const googleBtn = document.getElementById('googleBtn') as HTMLButtonElement;
                fireEvent.click(googleBtn);

                setTimeout(() => {
                    expect(window.alert).toHaveBeenCalledWith(
                        expect.stringContaining('Google 登录失败：some error')
                    );
                    resolve();
                }, 0);
            });
        });
    });
});