"""Serialize metadata requests per host and stop on explicit source refusals."""
import threading
import time
import urllib.error
import http.client
from urllib.parse import urlsplit


class MetadataTransport:
    def __init__(self, interval=0.5, cooldown=300, clock=time.monotonic, wait=time.sleep):
        self.interval=interval;self.cooldown=cooldown;self.clock=clock;self.wait=wait
        self.hosts={};self.lock=threading.Lock()

    def read(self,url,fetch,**kwargs):
        host=urlsplit(url).hostname
        with self.lock:state=self.hosts.setdefault(host,{'lock':threading.Lock(),'nextAt':0,'blockedUntil':0,'code':None,'failures':0})
        with state['lock']:
            if state['blockedUntil']>self.clock():raise ValueError(f"Metadata source cooldown after {state['code']}; no new field evidence")
            delay=max(0,state['nextAt']-self.clock())
            if delay:self.wait(delay)
            state['nextAt']=self.clock()+self.interval
            try:
                result=fetch(url,**kwargs)
                state['failures']=0
                return result
            except urllib.error.HTTPError as error:
                if error.code in (403,429):state.update(blockedUntil=self.clock()+self.cooldown,code=f'HTTP {error.code}')
                elif 500<=error.code<600:
                    state['failures']+=1
                    if state['failures']>=3:state.update(blockedUntil=self.clock()+self.cooldown,code=f'HTTP {error.code}')
                else:state['failures']=0
                raise
            except (urllib.error.URLError,TimeoutError,ConnectionError,http.client.IncompleteRead):
                state['failures']+=1
                if state['failures']>=3:state.update(blockedUntil=self.clock()+self.cooldown,code='repeated transport timeouts or failures')
                raise
            except Exception:
                state['failures']=0
                raise


TRANSPORT=MetadataTransport()
