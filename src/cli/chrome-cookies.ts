import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import crypto from 'crypto';
import Database from 'better-sqlite3';

const CHROME_COOKIE_PATHS = [
  // Linux
  join(homedir(), '.config/google-chrome/Default/Cookies'),
  join(homedir(), '.config/google-chrome/Profile 1/Cookies'),
  join(homedir(), '.config/chromium/Default/Cookies'),
  join(homedir(), 'snap/chromium/common/chromium/Default/Cookies'),
  // macOS
  join(homedir(), 'Library/Application Support/Google/Chrome/Default/Cookies'),
  join(homedir(), 'Library/Application Support/Google/Chrome/Profile 1/Cookies'),
  join(homedir(), 'Library/Application Support/Chromium/Default/Cookies'),
];

function findCookieDb(): string | null {
  for (const p of CHROME_COOKIE_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
}

function getEncryptionKey(): Buffer {
  const isMac = process.platform === 'darwin';
  if (isMac) {
    try {
      const password = execSync(
        'security find-generic-password -s "Chrome Safe Storage" -w',
        { encoding: 'utf-8', timeout: 5000 }
      ).trim();
      return crypto.pbkdf2Sync(password, 'saltysalt', 1003, 16, 'sha1');
    } catch {
      return crypto.pbkdf2Sync('peanuts', 'saltysalt', 1003, 16, 'sha1');
    }
  }
  // Linux
  try {
    const password = execSync('secret-tool lookup application chrome', {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
    return crypto.pbkdf2Sync(password, 'saltysalt', 1, 16, 'sha1');
  } catch {
    return crypto.pbkdf2Sync('peanuts', 'saltysalt', 1, 16, 'sha1');
  }
}

function decrypt(encryptedValue: Buffer, key: Buffer): string {
  if (encryptedValue.length === 0) return '';

  const prefix = encryptedValue.subarray(0, 3).toString('ascii');
  if (prefix !== 'v10' && prefix !== 'v11') {
    return encryptedValue.toString('utf-8');
  }

  const data = encryptedValue.subarray(3);
  const iv = Buffer.alloc(16, 0x20);

  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(true);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf-8');

  // First CBC block decrypts with garbage due to IV mismatch.
  // Extract the actual session value (starts with "s%3A")
  const match = decrypted.match(/s%3A[A-Za-z0-9_.%+-\/]+/);
  if (match) return match[0];

  return decrypted;
}

export interface ChromeCookieResult {
  substackSid: string;
  connectSid?: string;
}

export function grabSubstackCookies(): ChromeCookieResult | null {
  const dbPath = findCookieDb();
  if (!dbPath) return null;

  const key = getEncryptionKey();
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });

  try {
    const rows = db.prepare(
      `SELECT name, encrypted_value FROM cookies
       WHERE host_key LIKE '%substack.com'
       AND name IN ('substack.sid', 'connect.sid')`
    ).all() as { name: string; encrypted_value: Buffer }[];

    let substackSid = '';
    let connectSid = '';

    for (const row of rows) {
      const value = decrypt(row.encrypted_value, key);
      if (row.name === 'substack.sid') substackSid = value;
      if (row.name === 'connect.sid') connectSid = value;
    }

    if (substackSid) {
      return { substackSid, connectSid: connectSid || substackSid };
    }
    return null;
  } finally {
    db.close();
  }
}
