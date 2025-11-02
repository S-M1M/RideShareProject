import api from "./api.js";

/**
 * Quick test to verify API connectivity and authentication
 * Run this in browser console after importing or copy-paste functions
 */

// Test 1: Health Check (Public)
export async function testHealthCheck() {
  try {
    const response = await fetch(
      "https://rideshareproject-vyu1.onrender.com/api/health"
    );
    const data = await response.json();
    console.log("✅ Health Check:", data);
    return true;
  } catch (error) {
    console.error("❌ Health Check Failed:", error);
    return false;
  }
}

// Test 2: Login (Get Token)
export async function testLogin(email, password) {
  try {
    const response = await api.post("/auth/login", { email, password });
    console.log("✅ Login Successful:", response.data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      console.log("Token saved to localStorage");
    }
    return response.data;
  } catch (error) {
    console.error("❌ Login Failed:", error.response?.data || error.message);
    return null;
  }
}

// Test 3: Get Stars Balance (Requires Auth)
export async function testGetBalance() {
  try {
    const response = await api.get("/users/stars/balance");
    console.log("✅ Stars Balance:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Get Balance Failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Test 4: Buy Stars (Requires Auth)
export async function testBuyStars(amount = 100) {
  try {
    const response = await api.post("/users/stars/buy", { amount });
    console.log("✅ Buy Stars Successful:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Buy Stars Failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Test 5: Get Transactions (Requires Auth)
export async function testGetTransactions() {
  try {
    const response = await api.get("/users/stars/transactions");
    console.log("✅ Transactions:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Get Transactions Failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Run all tests in sequence
export async function runAllTests(email, password) {
  console.log("🧪 Starting API Tests...\n");

  // Test 1: Health Check
  console.log("Test 1: Health Check");
  await testHealthCheck();
  console.log("\n");

  // Test 2: Login
  console.log("Test 2: Login");
  const loginResult = await testLogin(email, password);
  if (!loginResult) {
    console.log("⚠️ Skipping remaining tests (login required)");
    return;
  }
  console.log("\n");

  // Test 3: Get Balance
  console.log("Test 3: Get Stars Balance");
  await testGetBalance();
  console.log("\n");

  // Test 4: Buy Stars
  console.log("Test 4: Buy Stars");
  await testBuyStars(50);
  console.log("\n");

  // Test 5: Get Transactions
  console.log("Test 5: Get Transactions");
  await testGetTransactions();
  console.log("\n");

  console.log("✅ All tests completed!");
}

// Quick test function to copy-paste in browser console
export function quickTest() {
  console.log("Paste this in console after logging in:");
  console.log(`
// Test buy stars
fetch('/api/users/stars/buy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ amount: 100 })
})
.then(r => r.json())
.then(d => console.log('✅ Success:', d))
.catch(e => console.error('❌ Error:', e));
  `);
}

// Instructions
console.log(`
🧪 API Test Suite Loaded!

Usage in browser console:

1. Test without login:
   testHealthCheck()

2. Test with login:
   runAllTests('your@email.com', 'password')

3. Individual tests:
   testLogin('your@email.com', 'password')
   testGetBalance()
   testBuyStars(100)
   testGetTransactions()

4. Show quick test:
   quickTest()
`);
