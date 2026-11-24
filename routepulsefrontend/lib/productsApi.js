// Product catalogue (DummyJSON). Small in-memory cache so repeated lookups
// (cart items, modals) don't hit the network again.

const PRODUCTS_URL = "https://dummyjson.com/products";
const cache = new Map();

async function getJson(url) {
  if (cache.has(url)) return cache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[products] ${url} -> ${res.status}`);
      return undefined;
    }
    const data = await res.json();
    cache.set(url, data);
    return data;
  } catch (error) {
    console.error("[products] network error", error?.message || error);
    return undefined;
  }
}

export const getAllProducts = () => getJson(`${PRODUCTS_URL}?limit=0`);
export const getOneProductById = (id) => getJson(`${PRODUCTS_URL}/${id}`);
export const getAllCategories = () => getJson(`${PRODUCTS_URL}/categories`);
export const searchProducts = (q) => getJson(`${PRODUCTS_URL}/search?q=${encodeURIComponent(q)}`);
