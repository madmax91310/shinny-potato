"""Serialize metadata requests per host and stop on explicit source refusals."""
import threading
import time
import urllib.error
from urllib.parse import urlsplit


class MetadataTransport:
    def __init__(self, interval=0.5, cooldown=300, clock=time.monotonic, wait=time.sleep):
        self.interval=interval;self.cooldown=cooldown;self.clock=clock;self.wait=wait
        self.hosts={};self.lock=threading.Lock()

    def read(self,url,fetch,**kwargs):
        host=urlsplit(url).hostname
        with self.lock:state=self.hosts.setdefault(host,{'lock':threading.Lock(),'nextAt':0,'blockedUntil':0,'code':None})
        with state['lock']:
            if state['blockedUntil']>self.clock():raise ValueError(f"HTTP {state['code']}: metadata source cooldown; no new field evidence")
            delay=max(0,state['nextAt']-self.clock())
            if delay:self.wait(delay)
            state['nextAt']=self.clock()+self.interval
            try:return fetch(url,**kwargs)
            except urllib.error.HTTPError as error:
                if error.code in (403,429):state.update(blockedUntil=self.clock()+self.cooldown,code=error.code)
                raise


TRANSPORT=MetadataTransport()
