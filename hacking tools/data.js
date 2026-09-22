// ─────────────────────────────────────────────────────────
//  Awesome Hacking – Resource Data
//  Last synced: 2026-08-26
//  Built by: Vatsal
// ─────────────────────────────────────────────────────────

const RESOURCES = [
  // ── Awesome Repositories ──────────────────────────────
  {
    name: "Android Security",
    url: "https://github.com/ashishb/android-security-awesome",
    description: "Collection of Android security related resources",
    category: "Mobile Security",
    section: "awesome",
    icon: "📱"
  },
  {
    name: "AppSec",
    url: "https://github.com/paragonie/awesome-appsec",
    description: "Resources for learning about application security",
    category: "Application Security",
    section: "awesome",
    icon: "🛡️"
  },
  {
    name: "Asset Discovery",
    url: "https://github.com/redhuntlabs/Awesome-Asset-Discovery",
    description: "List of resources which help during asset discovery phase of a security assessment engagement",
    category: "Reconnaissance",
    section: "awesome",
    icon: "🔍"
  },
  {
    name: "Bug Bounty",
    url: "https://github.com/djadmin/awesome-bug-bounty",
    description: "List of Bug Bounty Programs and write-ups from the Bug Bounty hunters",
    category: "Bug Bounty",
    section: "awesome",
    icon: "🐛"
  },
  {
    name: "Cellular Hacking",
    url: "https://github.com/W00t3k/Awesome-Cellular-Hacking",
    description: "This is a list of hacking research in the 3G/4G/5G cellular security space",
    category: "Network Security",
    section: "awesome",
    icon: "📡"
  },
  {
    name: "CI/CD Attacks",
    url: "https://github.com/TupleType/awesome-cicd-attacks",
    description: "Offensive research of CI/CD systems and deployment processes",
    category: "DevSecOps",
    section: "awesome",
    icon: "⚙️"
  },
  {
    name: "CTF",
    url: "https://github.com/apsdehal/awesome-ctf",
    description: "List of CTF frameworks, libraries, resources and softwares",
    category: "CTF",
    section: "awesome",
    icon: "🏁"
  },
  {
    name: "Cyber Security University",
    url: "https://github.com/brootware/awesome-cyber-security-university",
    description: "Free educational resources that focus on learning cybersecurity by doing",
    category: "Education",
    section: "awesome",
    icon: "🎓"
  },
  {
    name: "Cyber Skills",
    url: "https://github.com/joe-shenouda/awesome-cyber-skills",
    description: "Curated list of hacking environments where you can train your cyber skills legally and safely",
    category: "Education",
    section: "awesome",
    icon: "🎯"
  },
  {
    name: "Cybersources",
    url: "https://github.com/bst04/CyberSources",
    description: "A collection of all types of tools and resources for cybersecurity",
    category: "General Security",
    section: "awesome",
    icon: "🗂️"
  },
  {
    name: "Detection Engineering",
    url: "https://github.com/infosecB/awesome-detection-engineering",
    description: "Resources for designing, building, and operating detective cybersecurity controls",
    category: "Blue Team",
    section: "awesome",
    icon: "🔬"
  },
  {
    name: "DevSecOps",
    url: "https://github.com/devsecops/awesome-devsecops",
    description: "List of awesome DevSecOps tools with the help from community experiments and contributions",
    category: "DevSecOps",
    section: "awesome",
    icon: "🔧"
  },
  {
    name: "Drone Hacking",
    url: "https://github.com/nicholasaleks/Awesome-Drone-Hacking",
    description: "List of Drone hacking tools and resources",
    category: "Hardware & IoT",
    section: "awesome",
    icon: "🚁"
  },
  {
    name: "Embedded and IoT Security",
    url: "https://github.com/fkie-cad/awesome-embedded-and-iot-security",
    description: "A curated list of awesome resources about embedded and IoT security",
    category: "Hardware & IoT",
    section: "awesome",
    icon: "🔌"
  },
  {
    name: "Fuzzing",
    url: "https://github.com/secfigo/Awesome-Fuzzing",
    description: "List of fuzzing resources for learning Fuzzing and initial phases of Exploit Development like root cause analysis",
    category: "Fuzzing",
    section: "awesome",
    icon: "🧪"
  },
  {
    name: "Hacking",
    url: "https://github.com/carpedm20/awesome-hacking",
    description: "List of awesome Hacking tutorials, tools and resources",
    category: "General Security",
    section: "awesome",
    icon: "💀"
  },
  {
    name: "Honeypots",
    url: "https://github.com/paralax/awesome-honeypots",
    description: "List of honeypot resources",
    category: "Blue Team",
    section: "awesome",
    icon: "🍯"
  },
  {
    name: "Incident Response",
    url: "https://github.com/meirwah/awesome-incident-response",
    description: "List of tools for incident response",
    category: "Blue Team",
    section: "awesome",
    icon: "🚨"
  },
  {
    name: "Industrial Control System Security",
    url: "https://github.com/hslatman/awesome-industrial-control-system-security",
    description: "List of resources related to Industrial Control System (ICS) security",
    category: "Hardware & IoT",
    section: "awesome",
    icon: "🏭"
  },
  {
    name: "InfoSec",
    url: "https://github.com/onlurking/awesome-infosec",
    description: "List of awesome infosec courses and training resources",
    category: "Education",
    section: "awesome",
    icon: "📚"
  },
  {
    name: "IoT and Hardware Security",
    url: "https://github.com/kayranfatih/awesome-iot-and-hardware-security",
    description: "Collection of tools, books, resources and software about IoT and hardware security",
    category: "Hardware & IoT",
    section: "awesome",
    icon: "🔩"
  },
  {
    name: "Mainframe Hacking",
    url: "https://github.com/samanL33T/Awesome-Mainframe-Hacking",
    description: "List of Awesome Mainframe Hacking/Pentesting Resources",
    category: "Pentesting",
    section: "awesome",
    icon: "🖥️"
  },
  {
    name: "Malware Analysis",
    url: "https://github.com/rshipp/awesome-malware-analysis",
    description: "List of awesome malware analysis tools and resources",
    category: "Malware Analysis",
    section: "awesome",
    icon: "🦠"
  },
  {
    name: "Malware Persistence",
    url: "https://github.com/Karneades/awesome-malware-persistence",
    description: "Techniques adversaries use to maintain system access across restarts",
    category: "Malware Analysis",
    section: "awesome",
    icon: "🔗"
  },
  {
    name: "Node.js Security",
    url: "https://github.com/lirantal/awesome-nodejs-security",
    description: "Curated list of tools, security incidents and other resources around Node.js security",
    category: "Application Security",
    section: "awesome",
    icon: "🟢"
  },
  {
    name: "OSINT",
    url: "https://github.com/jivoi/awesome-osint",
    description: "List of amazingly awesome Open Source Intelligence (OSINT) tools and resources",
    category: "OSINT",
    section: "awesome",
    icon: "🕵️"
  },
  {
    name: "OSX and iOS Security",
    url: "https://github.com/ashishb/osx-and-ios-security-awesome",
    description: "OSX and iOS related security tools",
    category: "Mobile Security",
    section: "awesome",
    icon: "🍎"
  },
  {
    name: "Password Cracking",
    url: "https://github.com/n0kovo/awesome-password-cracking",
    description: "Tools and resources for recovering passwords",
    category: "Offensive Security",
    section: "awesome",
    icon: "🔑"
  },
  {
    name: "Pcaptools",
    url: "https://github.com/caesar0301/awesome-pcaptools",
    description: "Collection of tools developed by researchers in the Computer Science area to process network traces",
    category: "Network Security",
    section: "awesome",
    icon: "📦"
  },
  {
    name: "Pentest",
    url: "https://github.com/enaqx/awesome-pentest",
    description: "List of awesome penetration testing resources, tools and other shiny things",
    category: "Pentesting",
    section: "awesome",
    icon: "⚔️"
  },
  {
    name: "PHP Security",
    url: "https://github.com/ziadoz/awesome-php#security",
    description: "Libraries for generating secure random numbers, encrypting data and scanning for vulnerabilities",
    category: "Application Security",
    section: "awesome",
    icon: "🐘"
  },
  {
    name: "Prompt Injection",
    url: "https://github.com/Joe-B-Security/awesome-prompt-injection",
    description: "Prompt injection vulnerabilities targeting AI and LLM systems",
    category: "AI Security",
    section: "awesome",
    icon: "🤖"
  },
  {
    name: "Real-time Communications Hacking",
    url: "https://github.com/EnableSecurity/awesome-rtc-hacking",
    description: "Covers VoIP, WebRTC and VoLTE security related topics",
    category: "Network Security",
    section: "awesome",
    icon: "📞"
  },
  {
    name: "Red Teaming Toolkit",
    url: "https://github.com/infosecn1nja/Red-Teaming-Toolkit",
    description: "Cutting-edge open-source security tools (OST) for red teamers and threat hunters",
    category: "Red Team",
    section: "awesome",
    icon: "🔴"
  },
  {
    name: "Reinforcement Learning for Cyber Security",
    url: "https://github.com/Kim-Hammar/awesome-rl-for-cybersecurity",
    description: "List of awesome reinforcement learning for security resources",
    category: "AI Security",
    section: "awesome",
    icon: "🧠"
  },
  {
    name: "Reversing",
    url: "https://github.com/HACKE-RC/awesome-reversing",
    description: "Collection of resources to learn Reverse Engineering from start",
    category: "Reverse Engineering",
    section: "awesome",
    icon: "🔄"
  },
  {
    name: "Sec Talks",
    url: "https://github.com/PaulSec/awesome-sec-talks",
    description: "List of awesome security talks",
    category: "Education",
    section: "awesome",
    icon: "🎤"
  },
  {
    name: "SecLists",
    url: "https://github.com/danielmiessler/SecLists",
    description: "Collection of multiple types of lists used during security assessments",
    category: "Offensive Security",
    section: "awesome",
    icon: "📋"
  },
  {
    name: "Security",
    url: "https://github.com/sbilly/awesome-security",
    description: "Collection of awesome software, libraries, documents, books, resources and cool stuffs about security",
    category: "General Security",
    section: "awesome",
    icon: "🔐"
  },
  {
    name: "Social Engineering",
    url: "https://github.com/giuliacassara/awesome-social-engineering",
    description: "List of awesome social engineering resources",
    category: "Social Engineering",
    section: "awesome",
    icon: "🎭"
  },
  {
    name: "Static Analysis",
    url: "https://github.com/analysis-tools-dev/static-analysis",
    description: "List of static analysis tools, linters and code quality checkers for various programming languages",
    category: "Application Security",
    section: "awesome",
    icon: "🔎"
  },
  {
    name: "The Art of Hacking Series",
    url: "https://github.com/The-Art-of-Hacking/h4cker",
    description: "List of resources includes thousands of cybersecurity-related references and resources",
    category: "Education",
    section: "awesome",
    icon: "🎨"
  },
  {
    name: "Threat Intelligence",
    url: "https://github.com/hslatman/awesome-threat-intelligence",
    description: "List of Awesome Threat Intelligence resources",
    category: "Threat Intelligence",
    section: "awesome",
    icon: "🧩"
  },
  {
    name: "Vehicle Security",
    url: "https://github.com/jaredthecoder/awesome-vehicle-security",
    description: "List of resources for learning about vehicle security and car hacking",
    category: "Hardware & IoT",
    section: "awesome",
    icon: "🚗"
  },
  {
    name: "Web Hacking",
    url: "https://github.com/infoslack/awesome-web-hacking",
    description: "List of web application security",
    category: "Web Hacking",
    section: "awesome",
    icon: "🌐"
  },
  {
    name: "Web3 Security",
    url: "https://github.com/Anugraahsr/Awesome-web3-Security",
    description: "A curated list of web3 Security materials and resources For Pentesters and Bug Hunters",
    category: "Web Hacking",
    section: "awesome",
    icon: "⛓️"
  },
  {
    name: "YARA",
    url: "https://github.com/InQuest/awesome-yara",
    description: "List of awesome YARA rules, tools, and people",
    category: "Malware Analysis",
    section: "awesome",
    icon: "📐"
  },

  // ── Other Useful Repositories ─────────────────────────
  {
    name: "AI Security",
    url: "https://github.com/DeepSpaceHarbor/Awesome-AI-Security",
    description: "Curated list of AI security resources",
    category: "AI Security",
    section: "other",
    icon: "🤖"
  },
  {
    name: "Annual Security Reports",
    url: "https://github.com/jacobdjwilson/awesome-annual-security-reports",
    description: "Cybersecurity trends, insights, and challenges from annual reports",
    category: "Threat Intelligence",
    section: "other",
    icon: "📊"
  },
  {
    name: "API Security Checklist",
    url: "https://github.com/shieldfy/API-Security-Checklist",
    description: "Checklist of the most important security countermeasures when designing, testing, and releasing your API",
    category: "Application Security",
    section: "other",
    icon: "✅"
  },
  {
    name: "APT Notes",
    url: "https://github.com/kbandla/APTnotes",
    description: "Various public documents, whitepapers and articles about APT campaigns",
    category: "Threat Intelligence",
    section: "other",
    icon: "📝"
  },
  {
    name: "Bug Bounty Reference",
    url: "https://github.com/ngalongc/bug-bounty-reference",
    description: "List of bug bounty write-up that is categorized by the bug nature",
    category: "Bug Bounty",
    section: "other",
    icon: "🐛"
  },
  {
    name: "Capsulecorp Pentest",
    url: "https://github.com/r3dy/capsulecorp-pentest",
    description: "Vagrant+Ansible virtual network penetration testing lab. Companion to \"The Art of Network Penetration Testing\" by Royce Davis",
    category: "Pentesting",
    section: "other",
    icon: "🧪"
  },
  {
    name: "Cryptography",
    url: "https://github.com/sobolevn/awesome-cryptography",
    description: "Cryptography resources and tools",
    category: "Cryptography",
    section: "other",
    icon: "🔏"
  },
  {
    name: "CVE PoC",
    url: "https://github.com/trickest/cve",
    description: "List of CVE Proof of Concepts (PoCs) updated daily by Trickest",
    category: "Offensive Security",
    section: "other",
    icon: "💥"
  },
  {
    name: "CyberChef",
    url: "https://gchq.github.io/CyberChef/",
    description: "A simple, intuitive web app for analysing and decoding data without having to deal with complex tools or programming languages",
    category: "Tools",
    section: "other",
    icon: "🧑‍🍳"
  },
  {
    name: "Detection Lab",
    url: "https://github.com/clong/DetectionLab",
    description: "Vagrant & Packer scripts to build a lab environment complete with security tooling and logging best practices",
    category: "Blue Team",
    section: "other",
    icon: "🔬"
  },
  {
    name: "Executable Packing",
    url: "https://github.com/packing-box/awesome-executable-packing",
    description: "Resources about executable packing and unpacking",
    category: "Reverse Engineering",
    section: "other",
    icon: "📦"
  },
  {
    name: "Forensics",
    url: "https://github.com/Cugu/awesome-forensics",
    description: "List of awesome forensic analysis tools and resources",
    category: "Blue Team",
    section: "other",
    icon: "🔍"
  },
  {
    name: "Free Programming Books",
    url: "https://github.com/EbookFoundation/free-programming-books",
    description: "Free programming books for developers",
    category: "Education",
    section: "other",
    icon: "📖"
  },
  {
    name: "GTFOBins",
    url: "https://gtfobins.github.io",
    description: "A curated list of Unix binaries that can be exploited by an attacker to bypass local security restrictions",
    category: "Offensive Security",
    section: "other",
    icon: "🐧"
  },
  {
    name: "Hacker101",
    url: "https://github.com/Hacker0x01/hacker101",
    description: "A free class for web security by HackerOne",
    category: "Education",
    section: "other",
    icon: "🎓"
  },
  {
    name: "Infosec Getting Started",
    url: "https://github.com/gradiuscypher/infosec_getting_started",
    description: "A collection of resources, documentation, links, etc to help people learn about Infosec",
    category: "Education",
    section: "other",
    icon: "🚀"
  },
  {
    name: "Infosec Reference",
    url: "https://github.com/rmusser01/Infosec_Reference",
    description: "Information Security Reference That Doesn't Suck",
    category: "General Security",
    section: "other",
    icon: "📑"
  },
  {
    name: "IOC",
    url: "https://github.com/sroberts/awesome-iocs",
    description: "Collection of sources of indicators of compromise",
    category: "Threat Intelligence",
    section: "other",
    icon: "⚠️"
  },
  {
    name: "Linux Kernel Exploitation",
    url: "https://github.com/xairy/linux-kernel-exploitation",
    description: "A bunch of links related to Linux kernel fuzzing and exploitation",
    category: "Offensive Security",
    section: "other",
    icon: "🐧"
  },
  {
    name: "Machine Learning for Cyber Security",
    url: "https://github.com/jivoi/awesome-ml-for-cybersecurity",
    description: "Curated list of tools and resources related to the use of machine learning for cyber security",
    category: "AI Security",
    section: "other",
    icon: "🧠"
  },
  {
    name: "Payloads",
    url: "https://github.com/foospidy/payloads",
    description: "Collection of web attack payloads",
    category: "Offensive Security",
    section: "other",
    icon: "💣"
  },
  {
    name: "PayloadsAllTheThings",
    url: "https://github.com/swisskyrepo/PayloadsAllTheThings",
    description: "List of useful payloads and bypass for Web Application Security and Pentest/CTF",
    category: "Web Hacking",
    section: "other",
    icon: "🧨"
  },
  {
    name: "Pentest Wiki",
    url: "https://github.com/nixawk/pentest-wiki",
    description: "A free online security knowledge library for pentesters / researchers",
    category: "Pentesting",
    section: "other",
    icon: "📖"
  },
  {
    name: "Probable Wordlists",
    url: "https://github.com/berzerk0/Probable-Wordlists",
    description: "Wordlists sorted by probability originally created for password generation and testing",
    category: "Offensive Security",
    section: "other",
    icon: "📝"
  },
  {
    name: "Red Team Physical Tools",
    url: "https://github.com/DavidProbinsky/RedTeam-Physical-Tools",
    description: "Curated list of tools for physical security, red teaming, and tactical covert entry",
    category: "Red Team",
    section: "other",
    icon: "🔴"
  },
  {
    name: "Reverse Engineering",
    url: "https://github.com/onethawt/reverseengineering-reading-list",
    description: "List of Reverse Engineering articles, books, and papers",
    category: "Reverse Engineering",
    section: "other",
    icon: "🔄"
  },
  {
    name: "RFSec-ToolKit",
    url: "https://github.com/cn0xroot/RFSec-ToolKit",
    description: "Collection of Radio Frequency Communication Protocol Hacktools",
    category: "Hardware & IoT",
    section: "other",
    icon: "📻"
  },
  {
    name: "Security Cheatsheets",
    url: "https://github.com/OWASP/CheatSheetSeries",
    description: "OWASP Cheat Sheet Series for application security",
    category: "Application Security",
    section: "other",
    icon: "📋"
  },
  {
    name: "Shell",
    url: "https://github.com/alebcay/awesome-shell",
    description: "List of awesome command-line frameworks, toolkits, guides and gizmos to make complete use of shell",
    category: "Tools",
    section: "other",
    icon: "💻"
  },
  {
    name: "Suricata",
    url: "https://github.com/satta/awesome-suricata",
    description: "Suricata IDS/IPS and network security monitoring resources",
    category: "Blue Team",
    section: "other",
    icon: "🐊"
  },
  {
    name: "ThreatHunter-Playbook",
    url: "https://github.com/OTRF/ThreatHunter-Playbook",
    description: "A Threat hunter's playbook to aid the development of techniques and hypothesis for hunting campaigns",
    category: "Threat Intelligence",
    section: "other",
    icon: "📒"
  },
  {
    name: "Tor",
    url: "https://github.com/polycarbohydrate/awesome-tor",
    description: "Resources about the Tor network and anonymous communication",
    category: "Privacy",
    section: "other",
    icon: "🧅"
  },
  {
    name: "Vulhub",
    url: "https://github.com/vulhub/vulhub",
    description: "Pre-Built Vulnerable Environments Based on Docker-Compose",
    category: "Pentesting",
    section: "other",
    icon: "🐳"
  },
  {
    name: "Web Security",
    url: "https://github.com/qazbnm456/awesome-web-security",
    description: "Curated list of Web Security materials and resources",
    category: "Web Hacking",
    section: "other",
    icon: "🌐"
  }
];

// Extract unique categories
const CATEGORIES = [...new Set(RESOURCES.map(r => r.category))].sort();
