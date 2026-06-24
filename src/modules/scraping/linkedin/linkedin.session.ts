import { Page } from 'puppeteer';
import { LinkedInCredentials } from './linkedin.types.js';

export class LinkedInSessionManager {
  private loggedIn = false;

  get isLoggedIn(): boolean {
    return this.loggedIn;
  }

  async login(page: Page, credentials: LinkedInCredentials): Promise<boolean> {
    if (this.loggedIn) return true;

    try {
      await page.goto('https://www.linkedin.com/login', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await page.type('#username', credentials.email, { delay: 50 + Math.random() * 80 });
      await page.type('#password', credentials.password, { delay: 50 + Math.random() * 80 });

      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));

      await page.click('[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      const currentUrl = page.url();
      this.loggedIn = !currentUrl.includes('/login') && !currentUrl.includes('/checkpoint');

      if (!this.loggedIn) {
        console.error('[LinkedInSession] Falha no login — verifique credenciais ou checkpoint');
      }

      return this.loggedIn;
    } catch (err) {
      console.error(
        '[LinkedInSession] Erro durante login:',
        err instanceof Error ? err.message : err,
      );
      this.loggedIn = false;
      return false;
    }
  }

  async saveCookies(page: Page): Promise<string> {
    const cookies = await page.cookies();
    return JSON.stringify(cookies);
  }

  async restoreCookies(page: Page, cookiesJson: string): Promise<void> {
    try {
      const cookies = JSON.parse(cookiesJson);
      await page.setCookie(...cookies);
      this.loggedIn = true;
    } catch {
      this.loggedIn = false;
    }
  }

  async checkSession(page: Page): Promise<boolean> {
    try {
      await page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
      this.loggedIn = !page.url().includes('/login');
      return this.loggedIn;
    } catch {
      this.loggedIn = false;
      return false;
    }
  }

  logout(): void {
    this.loggedIn = false;
  }
}
