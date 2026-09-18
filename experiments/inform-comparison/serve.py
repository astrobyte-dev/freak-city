from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--port',type=int,default=0,help='0 selects a fresh unused port')
args=parser.parse_args()
root=Path(__file__).resolve().parent/'web'
server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(SimpleHTTPRequestHandler,directory=str(root)))
print(f'Open http://localhost:{server.server_port}/ (only this experiment is served)',flush=True)
server.serve_forever()
