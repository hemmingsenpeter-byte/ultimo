"""Package the public static app and fixed fictional pilot materials for later use."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import zipfile

if __package__:
    from .build import ROOT, build
else:
    from build import ROOT, build

SITE_FILES = ("index.html", "style.css", "app.js", "state.mjs", "tutor.mjs", "curriculum.json")
PILOT_FILES = ("fictional-fixture.json", "participant-tasks.md", "facilitator.md", "feedback.csv")
CANONICAL_TREES = ("platform", "curriculum", "framework", "library", "pathways", "schemas")

LAUNCHER = r'''#!/usr/bin/env python3
"""Serve only the bundled public app; no model gateway or data collection."""
import argparse
import errno
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import socket
from urllib.parse import unquote, urlsplit
import webbrowser

PACKAGE = Path(__file__).resolve().parent
SITE = PACKAGE / "site"
ASSETS = {"index.html", "style.css", "app.js", "state.mjs", "tutor.mjs", "curriculum.json"}

class PilotHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = unquote(urlsplit(self.path).path)
        if path == "/pilot-fixture.json":
            fixture = PACKAGE / "pilot" / "fictional-fixture.json"
            if fixture.is_symlink() or fixture.resolve().parent != PACKAGE / "pilot" or not fixture.is_file():
                self.send_error(404, "Fictional fixture unavailable")
                return None
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="ultimo-fictional-fixture.json"')
            self.send_header("Content-Length", str(fixture.stat().st_size))
            self.end_headers()
            return fixture.open("rb")
        name = "index.html" if path == "/" else path.removeprefix("/")
        if name not in ASSETS:
            self.send_error(404, "Only the public pilot app is served")
            return None
        target = SITE / name
        if target.is_symlink() or target.resolve().parent != SITE.resolve():
            self.send_error(403, "Asset outside the pilot site")
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # No request history or learner records are written by this launcher.


def serve(lan=False, port=8765, open_browser=False):
    if not SITE.is_dir() or SITE.is_symlink():
        raise SystemExit("Missing site directory. Extract the complete pilot ZIP first.")
    host = "0.0.0.0" if lan else "127.0.0.1"
    handler = partial(PilotHandler, directory=str(SITE))
    try:
        server = ThreadingHTTPServer((host, port), handler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE or port == 0:
            raise
        server = ThreadingHTTPServer((host, 0), handler)
    chosen = server.server_address[1]
    url = f"http://localhost:{chosen}/"
    print(f"Ultimo pilot: {url}", flush=True)
    print(f"Fictional fixture download: {url}pilot-fixture.json", flush=True)
    print(f"Bound to {host}:{chosen}. Stop with Ctrl+C.", flush=True)
    if chosen != port and port:
        print(f"Port {port} was busy; using {chosen}. A different port has separate browser records.", flush=True)
    if lan:
        print("LAN mode: use only a trusted test network. On your phone, use this computer's Wi-Fi IPv4 address:", flush=True)
        try:
            addresses = sorted({item[4][0] for item in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)
                                if not item[4][0].startswith("127.")})
        except OSError:
            addresses = []
        for address in addresses:
            print(f"  App: http://{address}:{chosen}/", flush=True)
            print(f"  Fictional fixture: http://{address}:{chosen}/pilot-fixture.json", flush=True)
        print(f"If no usable address appears, find the computer's Wi-Fi IPv4 address and open http://<Wi-Fi-IP>:{chosen}/", flush=True)
        print("The phone must be on the same Wi-Fi; a firewall may need to allow this local port.", flush=True)
    else:
        print("Loopback only. To test from a phone on the same trusted Wi-Fi, restart with --lan.", flush=True)
    print("No model provider runs. Import pilot/fictional-fixture.json through Data & settings if needed.", flush=True)
    if open_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lan", action="store_true", help="Opt in to phone access on a trusted local network")
    parser.add_argument("--port", type=int, default=8765, help="Preferred port; defaults to 8765, or use 0 for any free port")
    parser.add_argument("--open", action="store_true", dest="open_browser", help="Open the desktop browser after starting")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("--port must be between 0 and 65535")
    serve(args.lan, args.port, args.open_browser)

if __name__ == "__main__":
    main()
'''

README = """# Ultimo pilot kit — prepared for later

No participant session has been run by preparing this kit. Curriculum remains draft.

## Start on a computer

1. Install Python 3.11 or later. No npm packages or model credentials are needed.
2. Extract this ZIP completely, then run `python3 start-pilot.py` (on Windows,
   `py -3 start-pilot.py`). Open the printed URL. Add `--open` to open a browser
   automatically; it is optional.
3. Read `pilot/facilitator.md` and use `pilot/participant-tasks.md` when ready.
4. To load fictional practice records, choose **Data & settings → Restore a
   backup** and select `pilot/fictional-fixture.json`. This replaces records at
   that browser origin; use a separate browser profile for the pilot.
5. Stop the server with Ctrl+C.

The launcher serves only the public `site/` assets and the fixed fictional fixture
at `/pilot-fixture.json`. It starts on loopback only,
not a public host, and does not run a model provider or collect feedback.

## Optional phone test on the same Wi-Fi

Run `python3 start-pilot.py --lan` on the computer only when ready, on a trusted
local test network. Open the printed LAN URL in the phone's browser. Both devices
must share the same Wi-Fi; the computer's firewall may need to allow that local
port. On the phone, download the fictional fixture from the printed
`/pilot-fixture.json` URL, then use **Data & settings → Restore a backup** to
select that download. If the displayed addresses are unsuitable, find the computer's Wi-Fi IPv4
address in its network settings and use the printed port. Stop with Ctrl+C after
use. This is a temporary local test server, not a production deployment.

The default port is 8765. If busy, the launcher selects another free port; you
can also pass `--port NUMBER`. Browser records belong to the exact origin
(scheme, hostname and port). Different ports, `localhost`, an IP address and a
phone browser each have separate records. Reuse the printed origin to return to
existing records or deliberately export/import a backup to move them.

## Keep pilot results private

Use fictional examples. Learner records remain browser-local and are not
synchronised or encrypted. Keep downloaded backups and completed feedback
outside the repository; do not return personal records in a public issue or PR.
The blank `pilot/feedback.csv` is for later use. This kit contains only the fixed
public app assets and listed pilot materials, never a learner-data directory,
credentials or a model gateway.

`manifest.json` records the curriculum version, base Git commit when available,
and SHA-256 hashes of packaged files. The build uses canonical working-tree
content, so the base commit alone does not identify uncommitted changes.
"""


def base_commit(root):
    try:
        result = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "--verify", "HEAD"],
            capture_output=True, text=True, timeout=5, check=True,
        )
        value = result.stdout.strip()
        return value if len(value) == 40 and all(char in "0123456789abcdef" for char in value) else None
    except (OSError, subprocess.SubprocessError):
        return None


def validate_canonical_inputs(root):
    """Refuse redirected files before the compiler can copy or read their targets."""
    def fail_walk(error):
        raise error

    for name in CANONICAL_TREES:
        tree = root / name
        if tree.is_symlink() or not tree.is_dir():
            raise ValueError(f"Missing or unsafe canonical input directory: {name}")
        # Inspect each directory entry before os.walk can descend. Never follow links.
        for folder, directories, files in os.walk(tree, followlinks=False, onerror=fail_walk):
            for entry in [Path(folder), *(Path(folder) / item for item in directories + files)]:
                mode = entry.lstat().st_mode
                if (stat.S_ISLNK(mode) or not (stat.S_ISDIR(mode) or stat.S_ISREG(mode))
                        or not entry.resolve().is_relative_to(root)):
                    raise ValueError(f"Unsafe canonical input: {entry.relative_to(root)}")


def build_pilot(root=ROOT, output=None):
    root = Path(root).resolve()
    output = Path(output) if output is not None else root / "pilot-dist" / "ultimo-pilot.zip"
    materials = {}
    materials_dir = root / "pilot"
    if materials_dir.is_symlink() or materials_dir.resolve().parent != root:
        raise ValueError("Unsafe pilot material directory")
    for name in PILOT_FILES:
        path = root / "pilot" / name
        if path.is_symlink() or not path.is_file() or path.resolve().parent != (root / "pilot").resolve():
            raise ValueError(f"Missing or unsafe pilot material: pilot/{name}")
        materials[f"pilot/{name}"] = path.read_bytes()
    validate_canonical_inputs(root)
    with tempfile.TemporaryDirectory(prefix="ultimo-pilot-build-") as temporary:
        site = Path(temporary) / "site"
        data = build(root, site)
        payload = {f"site/{name}": (site / name).read_bytes() for name in SITE_FILES}
    payload.update(materials)
    payload["README.md"] = README.encode("utf-8")
    payload["start-pilot.py"] = LAUNCHER.encode("utf-8")
    manifest = {
        "format_version": 1,
        "curriculum_version": data["version"],
        "base_git_commit": base_commit(root),
        "source": "Canonical working tree; base Git commit may precede uncommitted changes.",
        "files": {name: {"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()}
                  for name, content in sorted(payload.items())},
    }
    payload["manifest.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")
    output.parent.mkdir(parents=True, exist_ok=True)
    # Write atomically; neither stale output files nor adjacent private files enter the ZIP.
    with tempfile.NamedTemporaryFile(dir=output.parent, prefix=".ultimo-pilot-", suffix=".tmp", delete=False) as handle:
        staging = Path(handle.name)
    try:
        with zipfile.ZipFile(staging, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name, content in sorted(payload.items()):
                info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, content)
        staging.replace(output)
    finally:
        staging.unlink(missing_ok=True)
    print(f"Packaged pilot kit: {output} ({output.stat().st_size:,} bytes)")
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="ZIP destination; default: pilot-dist/ultimo-pilot.zip")
    args = parser.parse_args()
    build_pilot(output=args.output)


if __name__ == "__main__":
    main()
