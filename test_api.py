import requests
import json

url = "http://localhost:3000/api/targets"
payload = {"target_value": "bing.com", "is_monitored": False}

print("POSTing to", url)
try:
    response = requests.post(url, json=payload, allow_redirects=False)
    print("Status Code:", response.status_code)
    print("Headers:", response.headers)
    print("Body:", response.text)
except Exception as e:
    print("Error:", str(e))
