# BLACKEYE - Educational Phishing Simulation Toolkit

A simple, all-in-one tool for cybersecurity awareness training. Simulate credential‑harvesting attacks with 33 realistic login pages, live visitor tracking, and an integrated spear‑phishing email sender - all from a single terminal menu.

**Everything is local and self‑contained.** No APIs to sign up for, no binaries to hunt down. The script even downloads the Cloudflare tunnel for you if it's missing.

---

## Features

- **33 phishing page templates** - Instagram, Facebook, Google, Netflix, PayPal, Steam, and many more.
- **Three tunnel options** - Cloudflare, Ngrok, or plain localhost. Cloudflare's binary is fetched automatically.
- **Live visitor intel** - IP, city, region, country, ISP, organisation, and whether it's a VPN or hosting datacenter.
- **Device detection** - iPhone, Android, Windows, macOS, Linux spotted from the browser's User‑Agent.
- **Real-time credential capture** - Usernames and passwords appear the moment they are submitted.
- **Spear-phishing email crafter** - Send HTML emails through Gmail, Outlook, Yahoo, or any SMTP server.
- Four built-in templates (password reset, security alert, shared document, invoice (the Templates were ai generated so might not be so good)).
- All emails carry a visible **EDUCATIONAL DEMONSTRATION ONLY** banner.
- **Session summary** - Runtime, unique visitors, and total captured credentials.

---

## Requirements

- **php** - for the fake login server.
- **curl** - for geolocation lookups and email sending.
- **python3** - used to parse JSON from the IP info service.
- **(Optional) ngrok** - if using the ngrok tunnel method.

No cloudflared binary needed — it will be downloaded on first use.

---

## Installation

```bash
git clone https://github.com/whoamitang/Blackeye
cd Blackeye
bash blackeye.sh
```

That's it. The only file you need to run is `blackeye.sh`.

---

## Usage

Run:

```bash
bash blackeye.sh
```

From the main menu, pick a phishing page (e.g. `01` for Instagram) or `E` for the email crafter.

If you chose a page, select a tunnel method:

1. **Cloudflare** — public URL via Cloudflare's free tunnel.
2. **Ngrok** — public URL via ngrok.
3. **Localhost** — only accessible on your machine.

Copy the displayed URL and send it to your test subject (yourself, a colleague, or a consenting student).

When someone opens the link and enters credentials, you'll see a real-time breakdown in your terminal.

Press `Ctrl+C` to stop the server and view a quick session summary.

---

## Email Crafter

1. Select `E` from the main menu.
2. Provide your SMTP details.
3. Choose a template.
4. Fill in target details and phishing URL.
5. Send or save a draft.

---

## How It Works

### Phishing Page Mode

- PHP built-in server (`php -S`) hosts the chosen page on `localhost:3333`.
- Tunnel exposes the port publicly.
- Visitors are logged to `ip.txt`.
- Credentials are written to `usernames.txt`.
- Captured credentials are appended to `master_creds.log`.

### Email Crafter Mode

- Generates HTML templates in `templates/`.
- Replaces placeholders like `{{TARGET_NAME}}` and `{{PHISH_LINK}}`.
- Uses `curl` SMTP requests to send mail.
- Success only reported on SMTP `250` response.

---

## Important Notes

- This tool is for education only.
- Never use it without explicit informed consent.
- Gmail users need 2FA + App Password.
- Cloudflared is downloaded from official releases.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Cloudflare tunnel fails | Ensure internet access. |
| SMTP test fails | Wrong credentials or wrong port. |
| Emails go to spam | Ask the recipient to check spam. |
| No visitor info shown | IP lookup may fail, credentials still log. |

---

## Legal Disclaimer

Usage of BlackEye for attacking targets without prior mutual consent is illegal. The end user is solely responsible for obeying all applicable local, state, and federal laws. The developers assume no liability for any misuse or damage caused by this program. Use only in authorised training environments.

---

## Credits

### Original Codebase

- BLACKEYE v1.0 — created by `@thelinuxchoice`
- 32 templates + 1 custom — upgraded by `@suljot_gjoka`

### Phishing Page Authors

- Instagram — `An0nUD4Y`
- Facebook, Google, Snapchat, Twitter, Microsoft — Social Fish (`UndeadSec`)
- PayPal, eBay, CryptoCurrency, Verizon, Dropbox, Adobe ID, Shopify, Messenger, Twitch, MySpace, Badoo, VK, Yandex, DeviantArt — `@suljot_gjoka`

### v3.x Extensions

Spear-phishing email module, SMTP integration, geolocation enrichment, tunnel method selection, visitor deduplication, device detection, session summary, and educational disclaimers.

---

Yes this README.md was AI generated except this line... maybe.
