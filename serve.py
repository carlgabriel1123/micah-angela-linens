"""Local preview server for the site.

Usage:  python serve.py [port] [--root DIR]      (default port 8140, root = this folder)
Then open http://localhost:8140

Sends no-cache headers so every refresh shows your latest edits, and only
serves the page itself and the assets folder (no README, source files or
node_modules), which keeps it safe to share through a temporary tunnel.
"""
import functools
import http.server
import os
import posixpath
import sys
import urllib.parse

PUBLIC_FILES = {"/", "/index.html"}
PUBLIC_DIRS = ("/assets/",)


class SiteHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

    def _is_public(self):
        raw = urllib.parse.urlsplit(self.path).path
        path = posixpath.normpath(urllib.parse.unquote(raw))
        if raw.endswith("/") and path != "/":
            path += "/"
        if path in PUBLIC_FILES:
            return True
        return path.startswith(PUBLIC_DIRS) and not path.endswith("/")

    def do_GET(self):
        if not self._is_public():
            self.send_error(404, "Not found")
            return
        super().do_GET()

    def do_HEAD(self):
        if not self._is_public():
            self.send_error(404, "Not found")
            return
        super().do_HEAD()

    def list_directory(self, path):
        self.send_error(404, "Not found")
        return None


def main():
    args = sys.argv[1:]
    root = os.path.dirname(os.path.abspath(__file__))
    if "--root" in args:
        i = args.index("--root")
        root = os.path.abspath(args[i + 1])
        del args[i:i + 2]
    port = int(args[0]) if args else 8140
    handler = functools.partial(SiteHandler, directory=root)
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Serving {root} at http://localhost:{port}  (Ctrl+C to stop)", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
