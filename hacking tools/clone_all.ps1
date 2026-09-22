# ─────────────────────────────────────────────────────────
# Clone all Awesome Hacking repositories (shallow, depth=1)
# Runs clones in parallel batches for speed
# ─────────────────────────────────────────────────────────

$repos = @(
    # ── Awesome Repositories ──
    "https://github.com/ashishb/android-security-awesome",
    "https://github.com/paragonie/awesome-appsec",
    "https://github.com/redhuntlabs/Awesome-Asset-Discovery",
    "https://github.com/djadmin/awesome-bug-bounty",
    "https://github.com/W00t3k/Awesome-Cellular-Hacking",
    "https://github.com/TupleType/awesome-cicd-attacks",
    "https://github.com/apsdehal/awesome-ctf",
    "https://github.com/brootware/awesome-cyber-security-university",
    "https://github.com/joe-shenouda/awesome-cyber-skills",
    "https://github.com/bst04/CyberSources",
    "https://github.com/infosecB/awesome-detection-engineering",
    "https://github.com/devsecops/awesome-devsecops",
    "https://github.com/nicholasaleks/Awesome-Drone-Hacking",
    "https://github.com/fkie-cad/awesome-embedded-and-iot-security",
    "https://github.com/secfigo/Awesome-Fuzzing",
    "https://github.com/carpedm20/awesome-hacking",
    "https://github.com/paralax/awesome-honeypots",
    "https://github.com/meirwah/awesome-incident-response",
    "https://github.com/hslatman/awesome-industrial-control-system-security",
    "https://github.com/onlurking/awesome-infosec",
    "https://github.com/kayranfatih/awesome-iot-and-hardware-security",
    "https://github.com/samanL33T/Awesome-Mainframe-Hacking",
    "https://github.com/rshipp/awesome-malware-analysis",
    "https://github.com/Karneades/awesome-malware-persistence",
    "https://github.com/lirantal/awesome-nodejs-security",
    "https://github.com/jivoi/awesome-osint",
    "https://github.com/ashishb/osx-and-ios-security-awesome",
    "https://github.com/n0kovo/awesome-password-cracking",
    "https://github.com/caesar0301/awesome-pcaptools",
    "https://github.com/enaqx/awesome-pentest",
    "https://github.com/Joe-B-Security/awesome-prompt-injection",
    "https://github.com/EnableSecurity/awesome-rtc-hacking",
    "https://github.com/infosecn1nja/Red-Teaming-Toolkit",
    "https://github.com/Kim-Hammar/awesome-rl-for-cybersecurity",
    "https://github.com/HACKE-RC/awesome-reversing",
    "https://github.com/PaulSec/awesome-sec-talks",
    "https://github.com/danielmiessler/SecLists",
    "https://github.com/sbilly/awesome-security",
    "https://github.com/giuliacassara/awesome-social-engineering",
    "https://github.com/analysis-tools-dev/static-analysis",
    "https://github.com/The-Art-of-Hacking/h4cker",
    "https://github.com/hslatman/awesome-threat-intelligence",
    "https://github.com/jaredthecoder/awesome-vehicle-security",
    "https://github.com/infoslack/awesome-web-hacking",
    "https://github.com/Anugraahsr/Awesome-web3-Security",
    "https://github.com/InQuest/awesome-yara",
    # ── Other Useful Repositories ──
    "https://github.com/DeepSpaceHarbor/Awesome-AI-Security",
    "https://github.com/jacobdjwilson/awesome-annual-security-reports",
    "https://github.com/shieldfy/API-Security-Checklist",
    "https://github.com/kbandla/APTnotes",
    "https://github.com/ngalongc/bug-bounty-reference",
    "https://github.com/r3dy/capsulecorp-pentest",
    "https://github.com/sobolevn/awesome-cryptography",
    "https://github.com/trickest/cve",
    "https://github.com/clong/DetectionLab",
    "https://github.com/packing-box/awesome-executable-packing",
    "https://github.com/Cugu/awesome-forensics",
    "https://github.com/EbookFoundation/free-programming-books",
    "https://github.com/Hacker0x01/hacker101",
    "https://github.com/gradiuscypher/infosec_getting_started",
    "https://github.com/rmusser01/Infosec_Reference",
    "https://github.com/sroberts/awesome-iocs",
    "https://github.com/xairy/linux-kernel-exploitation",
    "https://github.com/jivoi/awesome-ml-for-cybersecurity",
    "https://github.com/foospidy/payloads",
    "https://github.com/swisskyrepo/PayloadsAllTheThings",
    "https://github.com/nixawk/pentest-wiki",
    "https://github.com/berzerk0/Probable-Wordlists",
    "https://github.com/DavidProbinsky/RedTeam-Physical-Tools",
    "https://github.com/onethawt/reverseengineering-reading-list",
    "https://github.com/cn0xroot/RFSec-ToolKit",
    "https://github.com/OWASP/CheatSheetSeries",
    "https://github.com/alebcay/awesome-shell",
    "https://github.com/satta/awesome-suricata",
    "https://github.com/OTRF/ThreatHunter-Playbook",
    "https://github.com/polycarbohydrate/awesome-tor",
    "https://github.com/vulhub/vulhub",
    "https://github.com/qazbnm456/awesome-web-security"
)

$baseDir = "c:\Users\Vatsal's\Desktop\hacking tools"
$total = $repos.Count
$completed = 0
$failed = @()

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Awesome Hacking - Repository Cloner" -ForegroundColor Cyan
Write-Host "  Total repos to clone: $total" -ForegroundColor Cyan
Write-Host "  Using shallow clone (--depth 1)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($repo in $repos) {
    $repoName = ($repo -split '/')[-1]
    $targetDir = Join-Path $baseDir $repoName
    $completed++

    if (Test-Path $targetDir) {
        Write-Host "[$completed/$total] SKIP (exists): $repoName" -ForegroundColor Yellow
        continue
    }

    Write-Host "[$completed/$total] Cloning: $repoName ..." -ForegroundColor Green
    try {
        git clone --depth 1 --quiet $repo $targetDir 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  FAILED: $repoName" -ForegroundColor Red
            $failed += $repoName
        } else {
            Write-Host "  Done: $repoName" -ForegroundColor DarkGreen
        }
    } catch {
        Write-Host "  ERROR: $repoName - $_" -ForegroundColor Red
        $failed += $repoName
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  COMPLETE" -ForegroundColor Green
Write-Host "  Cloned: $($total - $failed.Count) / $total" -ForegroundColor Green
if ($failed.Count -gt 0) {
    Write-Host "  Failed ($($failed.Count)):" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}
Write-Host "============================================" -ForegroundColor Cyan
