export const isBnpDocfinderUrl = value => typeof value === 'string'
  && /^https:\/\/docfinder\.bnpparibas-am\.com\/api\/files\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\/[0-9]+$/.test(value)
