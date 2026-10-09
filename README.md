# JR Capital — jrcapitalgrp.com

The JR Capital website with a built-in content manager (CMS).

- **Site:** static pages built with [Eleventy](https://www.11ty.dev/) from the "B Field Rail" design.
- **CMS:** [Decap CMS](https://decapcms.org/) at **`/admin/`**. Every text, list and photo on the site is editable there.
- **Hosting:** [Netlify](https://www.netlify.com/) (free tier). Each save in the CMS commits to this repo, and Netlify republishes the site in about a minute.
- **Form:** the "Join the investor list" form uses Netlify Forms. Submissions appear in the Netlify dashboard and can be emailed to you.

## Editing content

1. Go to **https://jrcapitalgrp.com/admin/** and click **Login with GitHub**.
2. Pick a section under **Homepage**, **Site settings** or **Legal pages**.
3. Edit it, then click **Publish → Publish now**. The live site updates in about 1–2 minutes.

Anyone who edits needs a GitHub account with write access to this repository
(GitHub → repo **Settings → Collaborators → Add people**).

## Where things live

| What | Where |
|---|---|
| All homepage copy, one file per section | `src/_data/home/*.json` |
| Contact details, nav, footer disclosures | `src/_data/site.json` |
| Privacy policy and terms | `src/legal/*.md` |
| Photos uploaded through the CMS | `src/assets/uploads/` |
| Page layout and markup | `src/index.njk`, `src/_includes/` |
| Styles | `src/assets/css/site.css` (page), `industry.css` (design-system base) |
| Animations, form submission | `src/assets/js/main.js` |
| CMS field definitions | `src/admin/config.yml` |

Section numbers (01–11), step numbers and "Goal 01" style labels are generated automatically
from list order, so reordering items in the CMS renumbers them.

## Run locally

```bash
npm install
npm run dev          # http://localhost:8080
```

To try the CMS locally without GitHub, run `npm run cms` in a second terminal and open
http://localhost:8080/admin/. Changes are written straight to the files on disk.

## One-time setup (hosting, CMS login, domain)

### 1. Deploy on Netlify
1. Sign up at https://app.netlify.com with GitHub.
2. **Add new site → Import an existing project → GitHub →** pick `Vijaya0869/jr-capital`.
3. The build settings come from `netlify.toml` (build `npm run build`, publish `_site`). Click **Deploy**.

### 2. Turn on the investor-list form
1. In the site on Netlify: **Forms → Enable form detection**, then **Deploys → Trigger deploy**.
2. **Forms → Form notifications → Add notification → Email notification**, enter the address that should receive sign-ups.

### 3. Let the CMS log in with GitHub
1. On GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `https://jrcapitalgrp.com`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. Copy the **Client ID** and generate a **Client secret**.
3. On Netlify: **Project configuration** (older accounts: **Site configuration**) **→ Access & security → OAuth → Install provider → GitHub**, then paste both values.

### 4. Point jrcapitalgrp.com at Netlify (Porkbun)
1. On Netlify: **Domain management → Add a domain →** `jrcapitalgrp.com` (also add `www.jrcapitalgrp.com`).
2. At Porkbun → jrcapitalgrp.com:
   - Turn off **URL Forwarding** (it currently points the domain elsewhere).
   - **DNS records:** delete the `ALIAS jrcapitalgrp.com → uixie.porkbun.com` and `CNAME *.jrcapitalgrp.com → uixie.porkbun.com` records, then add:

     | Type | Host | Answer | TTL |
     |---|---|---|---|
     | ALIAS | *(blank / root)* | `apex-loadbalancer.netlify.com` | 600 |
     | CNAME | `www` | `<your-site-name>.netlify.app` | 600 |

   - Leave the MX and SPF (`v=spf1 …`) records alone so email forwarding keeps working.
3. Back on Netlify, wait for the domain to verify, then **HTTPS → Verify DNS / Provision certificate**. A free certificate is issued automatically.

## Before launch

- [ ] Replace the placeholder privacy policy and terms (CMS → Legal pages) with counsel-approved text.
- [ ] Set the real investor portal URL (CMS → Site settings).
- [ ] Have securities counsel review the site, especially the footer disclosures and the investor-list form.
