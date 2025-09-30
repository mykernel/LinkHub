#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import sys

PORT = 3003

class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # 根路径默认进入访客模式页面
        if self.path in ("/", "/index.html"):
            self.path = "/bookmarks.html"
        return super().do_GET()

    def guess_type(self, path):
        """正确的 MIME 类型（带 UTF-8 编码）"""
        if path.endswith('.html'):
            return 'text/html; charset=utf-8'
        elif path.endswith('.css'):
            return 'text/css; charset=utf-8'
        elif path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        elif path.endswith('.json'):
            return 'application/json; charset=utf-8'
        else:
            return super().guess_type(path)

if __name__ == '__main__':
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), UTF8Handler) as httpd:
            print(f"✓ 前端服务启动成功！")
            print(f"  地址: http://localhost:{PORT}")
            print(f"  编码: UTF-8")
            print(f"\n按 Ctrl+C 停止服务\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
        sys.exit(0)
    except OSError as e:
        if 'Address already in use' in str(e):
            print(f"✗ 端口 {PORT} 已被占用")
            sys.exit(1)
        else:
            raise
