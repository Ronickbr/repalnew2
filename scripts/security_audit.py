import os
import re
import json
import subprocess
import sys
from datetime import datetime

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT_FILE = os.path.join(PROJECT_ROOT, "RELATORIO_SEGURANCA_ABRANGENTE.md")

# OWASP & Pattern Definitions
PATTERNS = [
    {
        "id": "A05-Injection-Eval",
        "pattern": r"(eval|exec|Function)\s*\(",
        "description": "Use of eval() or similar functions can lead to Code Injection.",
        "severity": "CRITICAL",
        "file_types": [".js", ".ts", ".jsx", ".tsx"]
    },
    {
        "id": "A03-XSS-Danger",
        "pattern": r"dangerouslySetInnerHTML",
        "description": "Direct use of innerHTML can lead to XSS. Ensure content is sanitized.",
        "severity": "HIGH",
        "file_types": [".jsx", ".tsx"]
    },
    {
        "id": "A07-Auth-Hardcoded-Secret",
        "pattern": r"(?i)(api_key|secret|password|token)\s*[:=]\s*['\"][^'\"]{5,}['\"]",
        "description": "Potential hardcoded secret found.",
        "severity": "CRITICAL",
        "file_types": [".js", ".ts", ".json", ".env"]
    },
    {
        "id": "A01-Broken-Access-Control",
        "pattern": r"bypass_auth\s*=\s*true",
        "description": "Auth bypass flag detected.",
        "severity": "HIGH",
        "file_types": [".js", ".ts"]
    },
    {
        "id": "A09-Logging-Info-Leak",
        "pattern": r"console\.(log|info|debug)",
        "description": "Console logging in potential production code can leak sensitive info.",
        "severity": "LOW",
        "file_types": [".js", ".ts", ".jsx", ".tsx"]
    },
    {
        "id": "A02-Misconfig-Insecure-HTTP",
        "pattern": r"http://",
        "description": "Use of insecure HTTP instead of HTTPS.",
        "severity": "MEDIUM",
        "file_types": [".js", ".ts", ".html"]
    }
]

IGNORE_DIRS = ["node_modules", ".git", "dist", "build", "coverage", ".agent"]
IGNORE_FILES = ["package-lock.json", "security_audit.py", "RELATORIO_AUDITORIA_FINAL.md", "RELATORIO_SEGURANCA_ABRANGENTE.md"]

findings = []

def run_command(command):
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def scan_files():
    print("Starting Static Code Analysis...")
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Filter directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file in IGNORE_FILES:
                continue
                
            file_path = os.path.join(root, file)
            ext = os.path.splitext(file)[1]
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                # Skip SafeHTML component as it is the sanitization mechanism
                if "SafeHTML.tsx" in file_path or "dompurify" in content.lower():
                    continue

                lines = content.splitlines()
                
                for i, line in enumerate(lines):
                    # Skip comments
                    if line.strip().startswith('//') or line.strip().startswith('/*') or line.strip().startswith('*'):
                        continue

                    for pattern in PATTERNS:
                        # Skip checks if file type doesn't match
                        if not any(file_path.endswith(ft) for ft in pattern['file_types']):
                            continue
                            
                        if re.search(pattern['pattern'], line):
                            # False positive filters
                            if pattern['id'] == 'A07-Auth-Hardcoded-Secret':
                                # Ignore .env files as they are meant to hold secrets (locally)
                                if file.endswith('.env'):
                                    continue
                            
                            if pattern['id'] == 'A02-Misconfig-Insecure-HTTP':
                                # Ignore XML namespaces and w3.org schemas
                                if 'xmlns="http' in line or 'w3.org' in line or 'sitemaps.org' in line:
                                    continue
                                # Ignore localhost fallbacks if they are explicitly for dev/fallback
                                if 'localhost' in line and ('||' in line or '?' in line):
                                     continue
                                # Ignore localhost in console logs
                                if 'localhost' in line and 'console.' in line:
                                    continue
                            
                            # Ignore console.log in catch blocks or if wrapped in dev check (simple heuristic)
                            if pattern['id'] == 'A09-Logging-Info-Leak':
                                if 'console.error' in line:
                                    continue
                                if 'process.env.NODE_ENV' in line or 'import.meta.env.DEV' in line:
                                    continue
                                if 'logger.js' in file_path or 'server.js' in file_path:
                                    continue

                            findings.append({
                                "id": pattern['id'],
                                "severity": pattern['severity'],
                                "file": os.path.relpath(file_path, PROJECT_ROOT),
                                "line": i + 1,
                                "code": line.strip()[:100],
                                "description": pattern['description']
                            })
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

def check_dependencies():
    print("Checking Dependencies (npm audit)...")
    # This assumes npm is installed. If not, we skip.
    stdout, stderr, code = run_command("npm audit --json")
    
    # npm audit returns 1 if vulnerabilities found, but JSON is still valid
    if stdout.strip().startswith("{"):
        try:
            audit_data = json.loads(stdout)
            vulns = audit_data.get("vulnerabilities", {})
            metadata = audit_data.get("metadata", {}).get("vulnerabilities", {})
            
            # Summary
            if metadata.get("total", 0) > 0:
                findings.append({
                    "id": "A06-Vulnerable-Dependencies",
                    "severity": "HIGH",
                    "file": "package.json",
                    "line": 0,
                    "code": f"Total vulnerabilities: {metadata.get('total')}",
                    "description": f"npm audit found vulnerabilities: {json.dumps(metadata, indent=2)}"
                })
        except json.JSONDecodeError:
            print("Failed to parse npm audit output.")
    else:
        print("npm audit failed or not available.")

def generate_report():
    print(f"Generating report at {REPORT_FILE}...")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = f"""# Relatório de Auditoria de Segurança Abrangente

**Data:** {timestamp}
**Auditor:** Automated Security Agent (Python)
**Contexto:** {PROJECT_ROOT}

---

## Resumo Executivo

Este relatório apresenta os resultados de uma varredura de segurança automatizada focada no OWASP Top 10:2025 e melhores práticas de segurança.

**Total de Descobertas:** {len(findings)}

---

## Detalhes das Vulnerabilidades

"""
    
    if not findings:
        report += "Nenhuma vulnerabilidade crítica detectada automaticamente.\n"
    else:
        # Group by severity
        severity_order = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}
        sorted_findings = sorted(findings, key=lambda x: severity_order.get(x["severity"], 5))
        
        for f in sorted_findings:
            report += f"### [{f['severity']}] {f['id']}\n"
            report += f"- **Arquivo:** `{f['file']}` (Linha {f['line']})\n"
            report += f"- **Descrição:** {f['description']}\n"
            report += f"- **Código:** `{f['code']}`\n"
            report += "\n"

    report += """
---

## Recomendações Gerais

1. **Revisão Manual:** Ferramentas automatizadas podem gerar falso-positivos. Revise cada item.
2. **Dependências:** Execute `npm audit fix` para corrigir vulnerabilidades conhecidas.
3. **Secrets:** Nunca commite credenciais. Use variáveis de ambiente.
4. **Input Validation:** Sempre sanitize inputs do usuário (XSS/SQLi).

"""

    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print("Scan complete.")

if __name__ == "__main__":
    scan_files()
    check_dependencies()
    generate_report()
