import { describe, expect, it } from 'vitest'
import { Users } from '../src/collections/Users'
import { Requests } from '../src/collections/Requests'
import { Products } from '../src/collections/Products'
import { Categories } from '../src/collections/Categories'
import { Media } from '../src/collections/Media'
import { SiteSettings } from '../src/globals/SiteSettings'
import { ContactSettings } from '../src/globals/ContactSettings'
import { RentalSettings } from '../src/globals/RentalSettings'
import { LegalSettings } from '../src/globals/LegalSettings'
import { isCMSUser, isAdminUser } from '../src/utils/access'
import { restrictRequestUpdate } from '../src/hooks/requestAccess'
import { protectRoleAssignment } from '../src/hooks/userAccess'

const req = (role?:string) => ({user:role ? {id:2,role,collection:'users'} : null}) as any
describe('CMS role boundaries',() => {
  it.each([undefined,'','ADMIN','editor','customer'])('fails closed for unknown role %s',role => {
    expect(isCMSUser(req(role).user)).toBe(false)
    expect(isAdminUser(req(role).user)).toBe(false)
  })
  it('allows admins to manage every collection and global',async()=>{
    for(const collection of [Users,Requests,Products,Categories,Media]) for(const action of ['create','read','update','delete'] as const) {
      expect(await collection.access![action]!({req:req('admin')})).toBe(true)
    }
    for(const global of [SiteSettings,ContactSettings,RentalSettings,LegalSettings]) for(const action of ['read','update'] as const) expect(await global.access![action]!({req:req('admin')})).toBe(true)
  })
  it('allows product CRUD and upload support without settings or user administration',async()=>{
    for(const action of ['create','read','update','delete'] as const) expect(await Products.access![action]!({req:req('user')})).toBe(true)
    expect(await Media.access!.create!({req:req('user')})).toBe(true)
    expect(await Media.access!.delete!({req:req('user')})).toBe(false)
    for(const global of [SiteSettings,ContactSettings,RentalSettings,LegalSettings]) for(const action of ['read','update'] as const) expect(await global.access![action]!({req:req('user')})).toBe(false)
    expect(await Users.access!.create!({req:req('user')})).toBe(false)
    expect(await Users.access!.delete!({req:req('user')})).toBe(false)
    expect(await Users.access!.read!({req:req('user')})).toEqual({id:{equals:2}})
    expect(await Users.access!.update!({req:req('user')})).toEqual({id:{equals:2}})
    for(const action of ['create','update','delete'] as const) expect(await Categories.access![action]!({req:req('user')})).toBe(false)
  })
  it.each([{status:'rejected'},{status:'completed'},{status:'accepted',customerEmail:'changed@example.invalid'},{'pricingSummary.total':1},{status:'accepted',productSnapshot:{}},{}])('rejects a forbidden request update %j',data=>{
    expect(()=>restrictRequestUpdate({req:req('user'),operation:'update',overrideAccess:false,args:{data}} as any)).toThrow()
  })
  it('permits exactly the acceptance operation and trusted server-side creation',()=>{
    expect(restrictRequestUpdate({req:req('user'),operation:'update',overrideAccess:false,args:{data:{status:'accepted'}}} as any)).toEqual({data:{status:'accepted'}})
    expect(restrictRequestUpdate({req:req(),operation:'create',overrideAccess:true,args:{data:{customerName:'Guest'}}} as any)).toEqual({data:{customerName:'Guest'}})
  })
  it('rejects role escalation before field access could silently discard it',()=>{
    expect(()=>protectRoleAssignment({req:req('user'),operation:'update',overrideAccess:false,args:{data:{role:'admin'}}} as any)).toThrow()
    expect(protectRoleAssignment({req:req('admin'),operation:'update',overrideAccess:false,args:{data:{role:'admin'}}} as any)).toEqual({data:{role:'admin'}})
  })
})
