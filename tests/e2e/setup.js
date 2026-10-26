export default async function setup() {
  for (const url of ['http://localhost:8000/','http://localhost:3001/api/catalog/products']) {
    const response = await fetch(url,{signal:AbortSignal.timeout(20000)}).catch(()=>null);
    if (!response?.ok) throw new Error(`Browser tests require both local services. Start the frontend and backend first: ${url}`);
  }
}
