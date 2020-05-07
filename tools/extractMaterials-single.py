# -*- coding: UTF-8 -*-

import re
import json
import requests

# 在根目录下执行以下指令:
# python3 ./tools/extractMaterials.py


def readJson(path):
    if path.startswith("http"):
        r = requests.get(path,headers={"referer":"https://kokodayo.fun","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36 Edg/81.0.416.68"})
        r.encoding = "utf-8"
        return r.json()
    else:
        with open(path, encoding='utf-8') as f:
            return json.load(f, encoding='utf-8')


charId = "ch400"

char = readJson(charId)

result = {}
profMap = {
    'MEDIC': '医疗',
    'WARRIOR': '近卫',
    "PIONEER": '先锋',
    'TANK': '重装',
    'SNIPER': '狙击',
    'CASTER': '术师',
    'SUPPORT': '辅助',
    'SPECIAL': '特种'
}


newChars = []


def getSkillName(skillId):
    skill = readJson("{0}.json".format(skillId))
    for level in skill['levels']:
        if 'name' in level:
            return level['name']


chmat = {
    'name': char['name'],
    'rarity': char['rarity'],
    'profession': profMap.get(char['profession'], '其它'),
    'evolveCosts': [x['evolveCost'] for x in char['phases']],
    'sskillCosts': [
        {
            'skillName': getSkillName(x['skillId']) if x['skillId'] else "",
            'levelUpCost': x['levelUpCostCond'],
            'unlockCond':x['unlockCond']
        } for x in char['skills']],
    'askillCosts': char['allSkillLvlup'],
}
result[char['name']] = chmat


with open(charId+".json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False)
    # print("After update: {0} char-mats".format(len(result)))
    if len(newChars) > 0:
        print("新干员：{0}".format("，".join(newChars)), end="")
