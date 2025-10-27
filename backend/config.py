import os
from datetime import timedelta
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "mysecretkey123")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "myjwtsecret123")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # --- THIS IS THE CORRECTED LOGIC ---
    # This logic matches your Railway screenshot exactly.
    DB_USER = os.getenv("MYSQLUSER", os.getenv("DB_USER"))
    DB_PASSWORD = quote_plus(os.getenv("MYSQLPASSWORD", os.getenv("DB_PASSWORD", "")))
    DB_HOST = os.getenv("MYSQLHOST", os.getenv("DB_HOST"))
    DB_PORT = os.getenv("MYSQLPORT", os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("MYSQLDATABASE", os.getenv("DB_NAME"))

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )
    # --- END CORRECTED LOGIC ---

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")