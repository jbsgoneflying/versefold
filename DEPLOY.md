# Deploying Versefold to DigitalOcean

This site deploys automatically. Every push to `main` triggers a GitHub Actions
workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) that
builds the static export and `rsync`s it to the droplet over SSH.

Versefold runs on the **same droplet** as NRGX Labs. nginx routes each domain to
its own folder, so the two sites never collide and the NRGX config is never
touched. Versefold lives in `/var/www/versefold`; NRGX Labs stays where it is.

```
push to main  ->  GitHub Actions  ->  npm ci + npm run build  ->  rsync out/  ->  /var/www/versefold  ->  nginx serves versefold.app
```

---

## One-time setup

You do this once. After that, every `git push` deploys automatically.

### 1. On the droplet: create the web root

SSH into the droplet (the same one running NRGX Labs) and run:

```bash
sudo mkdir -p /var/www/versefold
sudo chown -R "$USER":"$USER" /var/www/versefold
```

> The user that owns this folder must match the SSH user GitHub Actions logs in
> as (see step 3). If you deploy as `root`, that's fine too.

### 2. On the droplet: install the nginx site

Copy [deploy/nginx/versefold.conf](deploy/nginx/versefold.conf) onto the droplet
(or paste its contents), then:

```bash
sudo cp versefold.conf /etc/nginx/sites-available/versefold
sudo ln -s /etc/nginx/sites-available/versefold /etc/nginx/sites-enabled/
sudo nginx -t          # confirms the existing NRGX config is still valid too
sudo systemctl reload nginx
```

`nginx -t` validates *all* sites at once, so it confirms nothing broke for NRGX
Labs.

### 3. Create a deploy SSH key for GitHub Actions

Generate a dedicated key pair (do this on your Mac). Using a separate key for CI
means you can revoke it without affecting your personal access.

```bash
ssh-keygen -t ed25519 -C "github-actions-versefold" -f ~/.ssh/versefold_deploy -N ""
```

Add the **public** key to the droplet's authorized keys (for the deploy user):

```bash
ssh-copy-id -i ~/.ssh/versefold_deploy.pub YOUR_USER@YOUR_DROPLET_IP
# or manually append ~/.ssh/versefold_deploy.pub to the droplet's ~/.ssh/authorized_keys
```

### 4. Add GitHub repository secrets

In GitHub: **Settings -> Secrets and variables -> Actions -> New repository secret**.
Add:

| Secret name        | Value                                                        |
| ------------------ | ----------------------------------------------------------- |
| `DROPLET_HOST`     | Droplet IP or hostname (e.g. `203.0.113.10`)                |
| `DROPLET_USER`     | SSH user the key was added for (e.g. `deploy` or `root`)    |
| `DROPLET_SSH_KEY`  | Contents of the **private** key `~/.ssh/versefold_deploy`   |
| `DROPLET_PORT`     | *(optional)* SSH port if not `22`                           |
| `DROPLET_PATH`     | *(optional)* deploy path, defaults to `/var/www/versefold`  |

Copy the private key contents with:

```bash
cat ~/.ssh/versefold_deploy   # paste the entire output, including BEGIN/END lines
```

### 5. Point DNS at the droplet

In your domain registrar / DNS provider, create records pointing at the droplet
IP (the same IP NRGX Labs uses):

| Type | Host                  | Value           |
| ---- | --------------------- | --------------- |
| A    | `versefold.app`       | droplet IP      |
| A    | `www.versefold.app`   | droplet IP      |
| A    | `getversefold.com`    | droplet IP      |
| A    | `www.getversefold.com`| droplet IP      |

DNS can take a few minutes to a few hours to propagate.

### 6. Enable HTTPS (Let's Encrypt)

Once DNS resolves to the droplet, run certbot on the droplet:

```bash
sudo apt install -y certbot python3-certbot-nginx   # if not already installed
sudo certbot --nginx \
  -d versefold.app -d www.versefold.app \
  -d getversefold.com -d www.getversefold.com
```

Certbot edits the Versefold server block to add HTTPS and sets up auto-renewal.
It does not touch the NRGX Labs config.

---

## Triggering a deploy

- **Automatic:** `git push` to `main`.
- **Manual:** GitHub -> **Actions** -> *Deploy to DigitalOcean* -> **Run workflow**.

Watch progress under the repo's **Actions** tab. The first run will create the
files in `/var/www/versefold`; nginx serves them immediately.

---

## Switching the primary domain

The site treats `versefold.app` as primary and redirects `getversefold.com` to
it. To flip them, edit [deploy/nginx/versefold.conf](deploy/nginx/versefold.conf)
(swap the `server_name` blocks), update the `siteUrl` in
[app/layout.tsx](app/layout.tsx), reinstall the nginx file, and rerun certbot.

## Manual deploy (fallback, no CI)

```bash
npm run build
rsync -avz --delete out/ YOUR_USER@YOUR_DROPLET_IP:/var/www/versefold/
```
