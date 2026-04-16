import geoip2.database
import os


BASE_DIR = os.path.dirname(__file__)

DB_PATH = os.path.join(
BASE_DIR,
"geoip",
"GeoLite2-City.mmdb"
)


reader = geoip2.database.Reader(DB_PATH)


def get_location(ip):

    try:

        response = reader.city(ip)


        return {

            "latitude": response.location.latitude,

            "longitude": response.location.longitude,

            "country": response.country.name

        }

    except:

        return {

            "latitude": None,

            "longitude": None,

            "country": "Unknown"

        }