from slowapi import Limiter
from slowapi.util import get_remote_address

# This global limiter will be used across all routes
limiter = Limiter(key_func=get_remote_address)
