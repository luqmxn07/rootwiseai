import requests
import pandas as pd

api_key = 'c2ae9e8fd3467d8c69bb143b83cfb999'
city = 'London'

url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={city}&aqi=no"
response = requests.get(url)
data = response.json()

df = pd.json_normalize(data)
df.to_csv("weather_data.csv", index=False)
