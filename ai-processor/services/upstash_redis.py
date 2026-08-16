"""Small synchronous adapter for Upstash's REST API.

Upstash REST does not support Redis pub/sub subscriptions, so CLOUD mode uses
the existing status list and reloads API keys before each queued job.
"""
import requests


class UpstashRedis:
    def __init__(self, url, token):
        if not url or not token:
            raise ValueError('CLOUD Redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
        self.url = url
        self.headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    def _command(self, *command):
        response = requests.post(self.url, headers=self.headers, json=list(command), timeout=30)
        response.raise_for_status()
        payload = response.json()
        if payload.get('error'):
            raise RuntimeError(payload['error'])
        return payload.get('result')

    def ping(self):
        return self._command('PING')

    def lpush(self, key, value):
        return self._command('LPUSH', key, value)

    def brpop(self, key, timeout=1):
        result = self._command('BRPOP', key, int(timeout))
        return tuple(result) if result else None

