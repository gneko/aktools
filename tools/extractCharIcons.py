import re
import json
import requests
import shutil
import os.path

from urllib.parse import quote

with open('./aktools-old/static/data/akhr.json', encoding="utf-8") as f:
    d = json.load(f, encoding='utf-8')


for ch in d:
    if ch['hidden']:
        continue

    if 'name-en' not in ch:
        print("{0} has no name-en".format(ch['name']))
        continue

    enname = ch['name-en']

    if os.path.isfile("./aktools-old/static/img/chara/{0}.png".format(enname)):
        continue
    
    r = requests.get("https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/img/chara/{0}.png".format(quote(enname)), stream=True)
    if r.status_code == 200:
        with open("./aktools-old/static/img/chara/{0}.png".format(enname), 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f) 
    else:
        print("Error downloading pic for {0}, name-en: {1}".format(ch['name'],ch['name-en']))

    