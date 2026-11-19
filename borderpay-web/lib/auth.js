// Local storage backed User Account System linked to Web3 Wallet

const USERS_KEY = "borderpay_registered_users";
const SESSION_KEY = "borderpay_active_session";

export function getRegisteredUsers() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading users:", e);
    return [];
  }
}

export function findUserByAddress(address) {
  if (!address) return null;
  const users = getRegisteredUsers();
  return users.find((u) => u.address.toLowerCase() === address.toLowerCase()) || null;
}

export function registerUser({
  address,
  name,
  storeName,
  email,
  businessType = "Retail & Digital Goods",
  preferredCurrency = "mUSD",
}) {
  if (!address) throw new Error("Alamat wallet wajib diisi!");
  if (!name) throw new Error("Nama penanggung jawab wajib diisi!");

  const users = getRegisteredUsers();
  const normalizedAddr = address.toLowerCase();

  const existingIdx = users.findIndex((u) => u.address.toLowerCase() === normalizedAddr);

  const userData = {
    address: normalizedAddr,
    displayAddress: address,
    name: name.trim(),
    storeName: (storeName || name).trim(),
    email: (email || "").trim(),
    businessType,
    preferredCurrency,
    updatedAt: Date.now(),
    createdAt: existingIdx >= 0 ? users[existingIdx].createdAt : Date.now(),
  };

  if (existingIdx >= 0) {
    users[existingIdx] = userData;
  } else {
    users.push(userData);
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  return userData;
}

export function loginUser(address) {
  if (!address) return null;
  const user = findUserByAddress(address);
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

export function getActiveSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
