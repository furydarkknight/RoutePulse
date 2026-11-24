// Central API client for the RoutePulse backend.
// Every exported function keeps its original name and return shape, so existing components work unchanged.

const BASE = (process.env.url_base || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

const getToken = () => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("token");
};

/** Clear the session and send the user to the login page. */
function handleExpiredSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("token");
  window.location.href = "/auth/log";
}

/**
 * Shared fetch wrapper: adds the JSON + Bearer headers, handles 401 once, parses JSON safely.
 * Returns { res, data } and throws only on network failure.
 */
async function request(path, { method = "GET", body, auth = true, credentials } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && auth) {
    handleExpiredSession();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json().catch(() => null);
  return { res, data };
}

/** Call request() but swallow errors into `undefined` (original behaviour of most helpers). */
async function safe(label, fn) {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[api] ${label} failed:`, error?.message || error);
    }
    return undefined;
  }
}

// ---------- auth ----------
export const register = (data) =>
  safe("register", async () => {
    const { data: resData } = await request("/api/register", {
      method: "POST",
      body: data,
      auth: false,
      credentials: "include",
    });
    return resData;
  });

export const login = (data) =>
  safe("login", async () => {
    const payload =
      typeof data === "object" && data !== null
        ? {
            email: data.email,
            username: data.email || data.username,
            password: data.password,
            ...data,
          }
        : data;
    const { res, data: resData } = await request("/api/login", {
      method: "POST",
      body: payload,
      auth: false,
    });
    if (!resData) return { success: false, message: `Login failed (${res.status})` };
    const token = resData.token || resData.data?.token || resData.accessToken || resData.jwt;
    return { ...resData, token: token || resData.token };
  });

export const getUser = () =>
  safe("getUser", async () => (await request("/api/user")).data);

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cartUpdated"));
  }
}

// ---------- cart / orders ----------
export const addProductToOrder = (productId) =>
  safe("addProductToOrder", async () => {
    const { data } = await request("/api/add-product", { method: "POST", body: { productId: Number(productId) } });
    notifyCartUpdated();
    return data;
  });

export const deleteProductFromOrderApi = (productId) =>
  safe("deleteProductFromOrder", async () => {
    const { data } = await request(`/api/delete-product/${productId}`, { method: "DELETE" });
    notifyCartUpdated();
    return data;
  });

export const getAllOrders = () =>
  safe("getAllOrders", async () => {
    let { res, data } = await request("/api/get-orders");
    if (!res.ok && res.status === 404) {
      ({ res, data } = await request("/api/get_orders"));
    }
    return data;
  });

export const handleUpdateQuantity = (productid, orderId, change) =>
  safe("updateQuantity", async () => {
    const { data } = await request(`/api/update-product-quantity/${productid}`, { method: "PATCH", body: { orderId, change } });
    notifyCartUpdated();
    return data;
  });

export const confirmOrder = (orderDetails) =>
  safe("confirmOrder", async () => {
    const { data } = await request("/api/confirm-order", { method: "POST", body: orderDetails });
    notifyCartUpdated();
    return data;
  });

// ---------- driver ----------
export const getlNeasestOrder = (lng, lat) =>
  safe("nearestOrder", async () =>
    (await request("/api/nearest-order", { method: "POST", body: { lng: Number(lng), lat: Number(lat) } })).data);

// Original behaviour kept: this one throws so the caller can show the backend message.
export const assigneDriverApi = async (orderId) => {
  const { res, data } = await request("/api/assign-driver", { method: "POST", body: { _id: orderId } });
  if (!res.ok) throw new Error(data?.message || "Failed to assign driver");
  return data;
};

export const getDriversOrdersApi = () =>
  safe("getDriversOrders", async () => {
    let { res, data } = await request("/api/get_orders");
    if (!res.ok && res.status === 404) {
      ({ res, data } = await request("/api/get-orders"));
    }
    if (!res.ok) throw new Error(data?.message || `Failed to fetch orders (${res.status})`);
    return data;
  });

// Fixed: the old version put `method` inside headers and sent no valid body.
export const getAssignedDriverForClient = (orderId) =>
  safe("seeDriver", async () => {
    const id = typeof orderId === "object" && orderId !== null ? orderId.orderId || orderId._id || orderId.id : orderId;
    const { data } = await request("/api/see-driver", {
      method: "POST",
      body: { orderId: id, _id: id, id },
    });
    return data;
  });

