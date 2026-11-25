"""Generate a portable static prototype. Markdown is escaped and shown as text."""
import html
import json
from pathlib import Path
from validate import ROOT, validate

def build():
    validate()
    out = ROOT / "dist"
    out.mkdir(exist_ok=True)
    faculties = json.loads((ROOT / "framework/faculties.json").read_text())
    catalogue = json.loads((ROOT / "framework/catalogue.json").read_text())
    def page(title, content):
        return "<!doctype html><html lang='en'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>" + html.escape(title) + "</title><style>body{max-width:850px;margin:3rem auto;padding:0 1.2rem;font:17px/1.65 system-ui;color:#262722;background:#faf8f2}a{color:#315f50}pre{white-space:pre-wrap;font:inherit}h1{font-family:Georgia,serif}small{color:#555}</style><main>" + content + "</main></html>"
    sections = ["<h1>Ultimo</h1><p>Open curriculum for lifelong human development.</p><p>Draft catalogue. Only linked courses contain learning materials.</p>"]
    for faculty in faculties:
        sections.append("<h2>" + html.escape(faculty["title"]) + "</h2><ul>")
        for course in catalogue:
            if course["faculty"] != faculty["id"]:
                continue
            cid = course["id"]
            folder = ROOT / "curriculum" / cid
            title = html.escape(cid + " — " + course["title"])
            if (folder / "course.json").exists():
                sections.append(f"<li><a href='{cid}.html'>{title}</a> <small>(draft)</small></li>")
                data = json.loads((folder / "course.json").read_text())
                docs = ["README.md"] + [x["path"] for x in data["lessons"]] + ["assessment.md"]
                content = "<p><a href='index.html'>← Catalogue</a></p><h1>" + title + "</h1>"
                for doc in docs:
                    content += "<hr><pre>" + html.escape((folder / doc).read_text()) + "</pre>"
                (out / (cid + ".html")).write_text(page(title, content), encoding="utf-8")
            else:
                sections.append("<li>" + title + " <small>(planned)</small></li>")
        sections.append("</ul>")
    (out / "index.html").write_text(page("Ultimo", "".join(sections)), encoding="utf-8")
    print("Built dist/index.html")

if __name__ == "__main__":
    build()
