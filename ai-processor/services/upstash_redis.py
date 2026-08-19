"""Small synchronous adapter for Upstash's REST API.

Upstash REST does not support Redis pub/sub subscriptions, so CLOUD mode uses
the existing status list and reloads API keys before each queued job.
"""
import requests
import time


class UpstashRedis:
    def __init__(self, url, token):
        if not url or not token:
            raise ValueError('CLOUD Redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
        self.url = url
        self.headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    def _command(self, *command, max_retries=3):
        for attempt in range(max_retries):
            try:
                # print(f"Upstash Request: {list(command)}")
                response = requests.post(self.url, headers=self.headers, json=list(command), timeout=30)
                # print(f"Response status: {response.status_code}")
                response.raise_for_status()
                payload = response.json()
                if payload.get('error'):
                    raise RuntimeError(payload['error'])
                return payload.get('result')
            except (requests.exceptions.RequestException, requests.exceptions.ConnectionError) as e:
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2
                    print(f"Connection error: {e}, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    print(f"Final connection error: {e}")
                    raise

    def ping(self):
        return self._command('PING')

    def lpush(self, key, value):
        return self._command('LPUSH', key, value)

    def rpop(self, key):
        result = self._command('RPOP', key)
        return result if result else None

    def brpop(self, key, timeout=1):
        # Upstash REST API doesn't support blocking commands well
        # Use RPOP instead for non-blocking operation
        result = self._command('RPOP', key)
        return (key, result) if result else None

