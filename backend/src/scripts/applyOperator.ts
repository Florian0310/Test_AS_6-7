import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'

// Explicitly requested operator correction. Does not change products, accounts or inquiries.
const payload = await getPayload({config})
await payload.updateGlobal({slug:'contact-settings',overrideAccess:true,data:{legalCompanyName:'Willy Schröder',street:'Fotzebenweg 3',postalCode:'2763',city:'Pernitz'}})
const legal = await payload.findGlobal({slug:'legal-settings',overrideAccess:true})
const replace = (value: unknown) => String(value || '').replace(/Schröder - Alles Saniert \((?:Gesellschaft nach bürgerlichem Recht|civil law partnership)\)/g,'Willy Schröder')
await payload.updateGlobal({slug:'legal-settings',overrideAccess:true,data:{impressumDe:replace(legal.impressumDe),impressumEn:replace(legal.impressumEn)}})
console.log('Operator identity updated.')
await payload.destroy()
