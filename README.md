# Versefold — Landing Page

A premium, calm, Scripture-first pre-launch landing page for **Versefold**, a quiet
Bible app for reading, study, and daily remembrance.

The main conversion is joining the **early access** list.

- Primary domain: `Versefold.app`
- Secondary domain: `GetVersefold.com` (redirect to primary)

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) with **static export** (`output: "export"`)
- [Tailwind CSS v4](https://tailwindcss.com/) with brand tokens defined in `app/globals.css` (`@theme`)
- Self-hosted fonts via `next/font`: **Cormorant Garamond** (serif headlines) + **Inter** (sans body)
- No backend required — the early-access form is a client component with a placeholder handler.

Because the site is exported to plain static files, the production server only needs
to serve a folder. No Node runtime is required on the droplet.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build (static export)

```bash
npm run build
```

This produces a fully static site in the `out/` directory (HTML, CSS, JS, and assets).

To preview the production build locally:

```bash
npx serve out
```

## Project structure

```
app/
  layout.tsx        # fonts, metadata (title, description, Open Graph / Twitter)
  page.tsx          # composes all sections in order
  globals.css       # Tailwind import + brand tokens + base styles + reveal animation
components/
  Logo.tsx          # inline SVG book-fold + star mark and serif wordmark
  Nav.tsx           # sticky header with mobile menu
  Hero.tsx          # headline + CSS/SVG reading panel and confession card
  Problem.tsx       # "Scripture first. Everything else quiet."
  Pillars.tsx       # Read / Understand / Remember
  AiLayer.tsx       # gentle study tools (the LLM layer)
  GuidedStudy.tsx   # 7-day Sermon on the Mount sample guide
  ConfessionCards.tsx  # lock-screen card mockups
  StudyLenses.tsx   # "Study with a lens, not a feed."
  Restraint.tsx     # restraint principles grid
  EarlyAccess.tsx   # email capture form + success state
  Footer.tsx
  ui/               # Button, Chip, SectionLabel, Reveal (scroll fade-in)
public/             # logo PNGs (favicon + Open Graph image)
```

## Wiring the email form

The form in `components/EarlyAccess.tsx` currently simulates a submission. Search for
the `// TODO` comment and replace the simulated delay with a real request to your
provider (ConvertKit, Beehiiv, Loops, Supabase, etc.). Example with Loops:

```ts
await fetch("https://app.loops.so/api/newsletter-form/<FORM_ID>", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: trimmed, firstName: firstName.trim() }),
});
```

Since this is a static export there is no server route; submit directly to the
provider's public endpoint from the browser, or add a small serverless function.

## Deploying to a DigitalOcean droplet (nginx)

1. Build locally and copy the static output to the droplet:

   ```bash
   npm run build
   rsync -avz --delete out/ root@YOUR_DROPLET_IP:/var/www/versefold/
   ```

2. Create an nginx server block (`/etc/nginx/sites-available/versefold`):

   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name versefold.app www.versefold.app;

       root /var/www/versefold;
       index index.html;

       # Static export uses <route>.html files
       location / {
           try_files $uri $uri.html $uri/ =404;
       }

       error_page 404 /404.html;

       # Long cache for hashed assets
       location /_next/static/ {
           add_header Cache-Control "public, max-age=31536000, immutable";
       }
   }

   # Redirect the secondary domain to the primary
   server {
       listen 80;
       server_name getversefold.com www.getversefold.com;
       return 301 https://versefold.app$request_uri;
   }
   ```

3. Enable the site and reload nginx:

   ```bash
   ln -s /etc/nginx/sites-available/versefold /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   ```

4. Point DNS A records for `versefold.app` and `getversefold.com` at the droplet IP.

5. Add free TLS certificates with Let's Encrypt:

   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d versefold.app -d www.versefold.app \
                   -d getversefold.com -d www.getversefold.com
   ```

Certbot will rewrite the server blocks to listen on 443 and set up automatic renewal.

## Notes

- Fully responsive, mobile-first (prioritized since this is an iOS app).
- Semantic HTML, AA contrast, visible focus states, and a skip-to-content link.
- Animations are subtle fade/translate reveals and are disabled under
  `prefers-reduced-motion`.
- All visuals are CSS/SVG — no external image dependencies beyond the logo.

© 2026 Versefold. All rights reserved.
