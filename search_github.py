import ssl
import urllib.request
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://registry.npmjs.org/@tjboudreaux/gtcli'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode())
        latest = data['versions'][data['dist-tags']['latest']]
        print(latest.get('description', 'No desc'))
        print("URL:", latest.get('repository', {}).get('url', ''))
except Exception as e:
    print(e)
