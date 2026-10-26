import { afterEach, describe, expect, it, vi } from 'vitest'
import { Users } from '../src/collections/Users'
import { Requests } from '../src/collections/Requests'
import { createInMemoryRateLimiter } from '../src/utils/rateLimit'
import { resolveRentalDays } from '../src/utils/pricing'
import { parsePublicBody, guardPublicPost, clientKey } from '../src/utils/http'
import { verifyTurnstileToken } from '../src/services/turnstileService'
import { listProductsHandler, submitRequestHandler } from '../src/endpoints/publicEndpoints'
import { normalizeSearch } from '../src/utils/catalogLocale'
import { buildRequestMail } from '../src/services/emailService'

afterEach(()=>vi.unstubAllEnvs())
describe('Security regressions',()=>{
  it('respects an explicit German locale even with an English browser preference',async()=>{
    const payload={find:async()=>({docs:[{id:1,title:'Bautrockner 50L',slug:'bautrockner-50l',shortDescription:'Beschreibung'}],totalDocs:1})}
    const res=await listProductsHandler({payload,query:{locale:'de'},headers:new Headers({'accept-language':'en-US'})} as any)
    expect((await res.json()).data[0].title).toBe('Bautrockner 50L')
  })
  it('prepares an English notification without interpreting submitted text as HTML',()=>{
    const mail=buildRequestMail({customerName:'Test',customerEmail:'audit@example.invalid',productTitle:'Drill',productArticleNumber:'AS-1',rentalDays:3,totalWithDeposit:25,locale:'en',message:'<script>alert(1)</script>'})
    expect(mail.subject).toContain('New rental inquiry');expect(mail.html).toBeUndefined();expect(mail.text).toContain('<script>')
  })
  it('protects user CRUD against unauthenticated callers',async()=>{
    for(const action of ['read','create','update','delete'] as const) {
      expect(await Users.access![action]!({req:{user:null}} as any)).toBe(false)
    }
  })
  it('bounds rate limiting and resets expired entries',()=>{
    const now=vi.spyOn(Date,'now').mockReturnValue(1000)
    const limiter=createInMemoryRateLimiter({windowMs:100,maxRequests:2})
    expect(limiter.consume('a').allowed).toBe(true);expect(limiter.consume('a').allowed).toBe(true)
    expect(limiter.consume('a').allowed).toBe(false);now.mockReturnValue(1101)
    expect(limiter.consume('a').allowed).toBe(true);now.mockRestore()
  })
  it('rejects malformed JSON, oversized and non-JSON bodies',async()=>{
    await expect(parsePublicBody(new Request('http://localhost',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'}) as any)).rejects.toMatchObject({status:400})
    await expect(parsePublicBody(new Request('http://localhost',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(17000)}) as any)).rejects.toMatchObject({status:413})
    await expect(parsePublicBody(new Request('http://localhost',{method:'POST',body:'hello'}) as any)).rejects.toMatchObject({status:415})
  })
  it('rejects hostile origins and does not trust forged client IP headers by default',()=>{
    vi.stubEnv('TRUST_PROXY_HEADERS','false')
    const req={headers:new Headers({'origin':'https://untrusted.invalid','x-real-ip':'forged'})} as any
    expect(()=>guardPublicPost(req,'pricing')).toThrow('Origin is not allowed')
    expect(clientKey(req)).toBe('shared')
  })
  it('rejects unavailable dates and fractional or unbounded periods',()=>{
    for(const input of [{startDate:'2026-02-30',endDate:'2026-03-02'},{rentalDays:1.5},{rentalDays:100000}]) expect(()=>resolveRentalDays(input)).toThrow()
  })
  it('never allows a development captcha bypass in production',async()=>{
    vi.stubEnv('NODE_ENV','production');vi.stubEnv('TURNSTILE_SECRET_KEY','');vi.stubEnv('TURNSTILE_BYPASS_FOR_DEV','true')
    expect((await verifyTurnstileToken({})).success).toBe(false)
  })
  it('returns generic server errors instead of database details',async()=>{
    const res=await listProductsHandler({payload:{find:async()=>{throw new Error('secret database path')}}} as any)
    expect(res.status).toBe(500);expect(await res.text()).not.toContain('secret database path')
  })
  it('rejects missing privacy acknowledgement without writing a request',async()=>{
    const create=vi.fn();const req={payload:{create},json:async()=>({productId:'1',name:'Max Test',email:'test@example.invalid',rentalDays:1})}
    const res=await submitRequestHandler(req as any);expect(res.status).toBe(400);expect(create).not.toHaveBeenCalled()
  })
  it('uses collision-resistant inquiry references for simultaneous submissions',async()=>{
    const field=Requests.fields.find(field=>'name' in field && field.name==='requestNumber') as any
    const hook=field.hooks.beforeValidate[0];const ids=new Set(Array.from({length:200},()=>hook({value:null})))
    expect(ids.size).toBe(200)
  })
  it('normalizes umlaut spellings and case for search',()=>{
    expect(normalizeSearch('WÄRMEDÄMMUNG')).toBe(normalizeSearch('Waermedaemmung'))
    expect(normalizeSearch('größer')).toBe(normalizeSearch('groesser'))
  })
})
