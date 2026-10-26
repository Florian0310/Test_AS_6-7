export const categoryEnglish: Record<string,string> = {
  'bohren-stemmen':'Drilling & demolition','erdbewegung':'Earthmoving','fliesen-kleben-duebel':'Tiling, adhesives & fixings',
  'gartenarbeit':'Gardening','geruest-montagehilfen':'Scaffolding & assembly','heizen':'Heating','holzbearbeitung':'Woodworking',
  'kleinwerkzeug-hilfsgeraete':'Hand tools & accessories','messen-pruefen':'Measuring & testing','metallbearbeitung':'Metalworking',
  'reinigung':'Cleaning','stein-betonbearbeitung':'Stone & concrete work','werkzeuge-waermedaemmverbundsysteme':'Tools for external thermal insulation systems',
}
export const englishFields = (label: string) => ({
  name: 'english', label, type: 'group' as const,
  fields: [
    {name:'title',label:'English title / category name',type:'text' as const},
    {name:'description',label:'English description',type:'textarea' as const},
  ],
})
const descriptions: Record<string,string> = {
  'hilti-sf-6-a22':'Cordless drill driver for professional work in wood and metal.',
  'bautrockner-50l':'Powerful dehumidifier for construction sites, basements and renovation projects.',
}
export const localizeProduct = (product: any, en: boolean): any => {
  if (!en) return product
  return {...product,
    title: product.english?.title || (product.slug === 'bautrockner-50l' ? 'Construction dehumidifier 50 L' : product.title),
    shortDescription: product.english?.description || descriptions[product.slug] || 'Product details available on request.',
    longDescription: null,
    category: product.category && typeof product.category === 'object' ? {...product.category,
      name:product.category.english?.title || categoryEnglish[product.category.slug] || 'Tools',
    } : product.category,
  }
}
export const normalizeSearch = (value: string): string => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u')
