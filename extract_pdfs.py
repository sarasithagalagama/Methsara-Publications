import sys
import subprocess

try:
    import pypdf
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    import pypdf

pdfs = [
    r"d:\Methsara-Publications\docs\ISP Final\IE2091 Common issues to address in the projects.pdf",
    r"d:\Methsara-Publications\docs\ISP Final\IE2091 Final Presentation Guidelines.pdf",
    r"d:\Methsara-Publications\docs\ISP Final\IE2091 Final Report Guidelines.pdf",
    r"d:\Methsara-Publications\docs\ISP Final\IE2091 Marketing Video Guidelines.pdf"
]

for pdf_path in pdfs:
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
        out_path = pdf_path + ".txt"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Successfully extracted {pdf_path}")
    except Exception as e:
        print(f"Error extracting {pdf_path}: {e}")
