# Authentication Guide

`@postcli/substack` authenticates using Substack session cookies (`substack.sid` and `connect.sid`). The CLI provides three methods to obtain and store these credentials.

## Methods

### 1. Auto (Chrome Cookie Grab)

The default and easiest method. The CLI reads cookies directly from Chrome's SQLite cookie database.

```bash
postcli-substack auth login
```

**How it works:**

1. The CLI searches for Chrome's cookie database in known locations:
   - Linux: `~/.config/google-chrome/Default/Cookies`, `~/.config/chromium/Default/Cookies`, and Snap paths
   - macOS: `~/Library/Application Support/Google/Chrome/Default/Cookies`
2. Queries the database for `substack.sid`, `connect.sid`, and `substack.lli` cookies from `*.substack.com`
3. Decrypts the cookie values using the OS keychain (Linux: `secret-tool`, macOS: `security` Keychain) or the default password `peanuts`
4. If the `substack.lli` JWT is found, it extracts the `userId` and auto-discovers the user's profile and publications
5. Saves the token and publication URL to `~/.config/postcli/.env`

**Requirements:**
- Chrome or Chromium must be installed
- You must have an active Substack session in Chrome (be logged in)
- Chrome must not be running with a locked cookie database (close Chrome if you get errors)

### 2. Email OTP

Falls back to this method when Chrome cookies are not available.

```bash
postcli-substack auth login
```

**Steps:**

1. Enter your Substack email address
2. The CLI sends a login code request to Substack
3. Check your email for the 6-digit code
4. Enter the code
5. If successful, the CLI captures `substack.sid` and `connect.sid` from the response `Set-Cookie` headers
6. You're prompted for your publication subdomain (or use `--subdomain` flag)
7. Credentials are saved

### 3. Manual Setup

For cases where neither Chrome grab nor email OTP works.

```bash
postcli-substack auth setup
```

**Steps:**

1. Open Substack in your browser
2. Open DevTools (F12) and navigate to Application > Cookies > `https://substack.com`
3. Copy the values for `substack.sid` and `connect.sid`
4. Paste them when prompted
5. Enter your publication URL (e.g. `https://myname.substack.com`)

## Token Format

The auth token is a base64-encoded JSON object:

```json
{
  "substack_sid": "s%3A...",
  "connect_sid": "s%3A..."
}
```

Encoded:

```
eyJzdWJzdGFja19zaWQiOiJzJTNBLi4uIiwiY29ubmVjdF9zaWQiOiJzJTNBLi4uIn0=
```

When making API requests, the token is decoded and sent as cookies:

```
Cookie: substack.sid=s%3A...; connect.sid=s%3A...
```

## Storage

Credentials are stored in:

```
~/.config/postcli/.env
```

File permissions are set to `0o600` (owner read/write only). Directory permissions are `0o700`.

Contents:

```
SUBSTACK_TOKEN=eyJzdWJzdGFja19zaWQ...
SUBSTACK_PUBLICATION_URL=https://myname.substack.com
```

The CLI also checks the current working directory's `.env` as a fallback (for development).

## Logout

```bash
postcli-substack auth logout
```

Removes `SUBSTACK_TOKEN` and `SUBSTACK_PUBLICATION_URL` from all known `.env` locations. If the `.env` file has no other content, it is deleted entirely.

## Troubleshooting

### Token expired

Substack session cookies expire. When this happens:

```bash
postcli-substack auth test
# Connection test failed.
```

Fix: Log in again.

```bash
postcli-substack auth login
```

### Wrong publication URL

If commands return "No posts found" but you know you have posts, the publication URL might be wrong.

Check your current config:

```bash
cat ~/.config/postcli/.env
```

The `SUBSTACK_PUBLICATION_URL` must match one of your actual publications. If your Substack is at a custom domain, use the `.substack.com` subdomain instead (e.g. `https://myname.substack.com`).

### Multiple accounts

Only one account is supported at a time. To switch accounts:

```bash
postcli-substack auth logout
postcli-substack auth login
```

### Chrome cookie grab fails

Common causes:

- **Chrome is running** and holds a lock on the cookie database. Try closing Chrome first.
- **Encrypted cookies** with a keychain password that can't be retrieved. The CLI falls back to the default password `peanuts`, which may not work with newer Chrome versions or custom configurations.
- **Profile path mismatch**. The CLI checks `Default` and `Profile 1`. If you use a different profile, use manual setup.
- **Not logged into Substack** in Chrome. Open `substack.com` in Chrome and log in first.

### MCP server can't authenticate

The MCP server reads credentials from the same `~/.config/postcli/.env` file. Run `postcli-substack auth login` before starting the MCP server.

### Environment variable override

You can skip the `.env` file entirely by setting environment variables directly:

```bash
export SUBSTACK_TOKEN="eyJ..."
export SUBSTACK_PUBLICATION_URL="https://myname.substack.com"
postcli-substack posts list
```
