"""Read Nuxt's serialized literals without evaluating publisher JavaScript."""
import json
import re


class LiteralReader:
    def __init__(self, source, aliases=None):
        self.source, self.aliases, self.pos = source, aliases or {}, 0

    def space(self):
        while self.pos < len(self.source) and self.source[self.pos].isspace():
            self.pos += 1

    def take(self, token):
        self.space()
        if not self.source.startswith(token, self.pos):
            raise ValueError('Unexpected serialized publication syntax')
        self.pos += len(token)

    def read(self):
        self.space()
        char = self.source[self.pos:self.pos+1]
        if char == '"':
            value, length = json.JSONDecoder().raw_decode(self.source[self.pos:])
            self.pos += length
            return value
        if char == '[':
            self.take('['); result = []; self.space()
            while self.source[self.pos:self.pos+1] != ']':
                result.append(self.read()); self.space()
                if self.source[self.pos:self.pos+1] != ',': break
                self.take(',')
            self.take(']'); return result
        if char == '{':
            self.take('{'); result = {}; self.space()
            while self.source[self.pos:self.pos+1] != '}':
                self.space()
                if self.source[self.pos] == '"': key = self.read()
                else:
                    key = self.identifier()
                self.take(':'); result[key] = self.read(); self.space()
                if self.source[self.pos:self.pos+1] != ',': break
                self.take(',')
            self.take('}'); return result
        match = re.match(r'-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?', self.source[self.pos:])
        if match:
            self.pos += len(match[0]); value = float(match[0])
            return int(value) if value.is_integer() else value
        name = self.identifier()
        if name in ('true', 'false', 'null', 'undefined'):
            return {'true':True, 'false':False, 'null':None, 'undefined':None}[name]
        if name == 'Array':
            self.take('('); count = self.read(); self.take(')')
            if not isinstance(count,int) or not 0 <= count <= 10000: raise ValueError('Invalid serialized array')
            return [None] * count
        if name not in self.aliases: raise ValueError('Unknown publication alias: '+name)
        return self.aliases[name]

    def identifier(self):
        self.space(); match = re.match(r'[A-Za-z_$][\w$]*',self.source[self.pos:])
        if not match: raise ValueError('Expected publication identifier')
        self.pos += len(match[0]); return match[0]


def nuxt_returns(serialized):
    params = re.match(r'window\.__NUXT__=\(function\(([^)]*)\)', serialized)
    if not params or '}(' not in serialized or not serialized.endswith('));'):
        raise ValueError('Unsupported Nuxt publication')
    arguments = LiteralReader('['+serialized[serialized.rfind('}(')+2:-3]+']').read()
    names = params[1].split(',')
    if len(names) != len(arguments): raise ValueError('Publication aliases changed')
    blocks = list(re.finditer(r'\.rendement\s*=\s*(?=\{)', serialized))
    if len(blocks) != 1: raise ValueError('Ambiguous insurance return publication')
    return LiteralReader(serialized[blocks[0].end():], dict(zip(names,arguments))).read()
