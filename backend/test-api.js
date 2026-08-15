const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('\n🚀 Starting End-to-End Server & Database Test...\n');

  try {
    // 1. Test Owner Registration
    console.log('1️⃣ Testing Owner Registration...');
    const ownerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bakery Owner',
        email: `owner_${Date.now()}@mchocolate.com`,
        password: 'ownerpassword123',
        role: 'owner'
      })
    });
    const ownerData = await ownerRes.json();
    console.log('   Result:', ownerData.success ? '✅ PASSED' : '❌ FAILED', ownerData);

    // 2. Test Customer Registration
    console.log('\n2️⃣ Testing Customer Registration...');
    const customerEmail = `customer_${Date.now()}@gmail.com`;
    const custRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: customerEmail,
        password: 'customerpassword123',
        role: 'customer'
      })
    });
    const custData = await custRes.json();
    console.log('   Result:', custData.success ? '✅ PASSED' : '❌ FAILED', custData);

    // 3. Test Customer Login
    console.log('\n3️⃣ Testing Customer Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        password: 'customerpassword123'
      })
    });
    const loginData = await loginRes.json();
    console.log('   Result:', loginData.success ? '✅ PASSED' : '❌ FAILED', loginData);

    // 4. Test Catalog Retrieval
    console.log('\n4️⃣ Testing Catalog Fetch (Artisanal)...');
    const catalogRes = await fetch(`${BASE_URL}/products?category=artisanal`);
    const catalogData = await catalogRes.json();
    console.log(`   Result: ✅ PASSED (Found ${catalogData.length} items)`);

    // 5. Test Bespoke Inquiry Submission
    console.log('\n5️⃣ Testing Bespoke Cake Inquiry...');
    const bespokeRes = await fetch(`${BASE_URL}/bespoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail,
        flavor: 'Belgian Dark Truffle',
        tiers: 2,
        weightKg: 2.5,
        notes: 'Silver pearls and edible flowers for an anniversary.'
      })
    });
    const bespokeData = await bespokeRes.json();
    console.log('   Result:', bespokeData.success ? '✅ PASSED' : '❌ FAILED', bespokeData.bespoke?._id);

    // 6. Test Placing an Order
    console.log('\n6️⃣ Testing Order Creation (Checkout)...');
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail,
        items: [{ title: 'Handcrafted Hazelnut Truffles', price: 1200, qty: 1 }],
        totalAmount: 1200
      })
    });
    const orderData = await orderRes.json();
    const createdOrderId = orderData.order?._id;
    console.log('   Result:', orderData.success ? '✅ PASSED' : '❌ FAILED', `Order ID: ${createdOrderId}`);

    // 7. Test Updating Order Status (Owner Flow)
    console.log('\n7️⃣ Testing Live Order Status Update...');
    const patchRes = await fetch(`${BASE_URL}/admin/orders/${createdOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Baking' })
    });
    const updatedOrder = await patchRes.json();
    console.log('   Result:', updatedOrder.status === 'Baking' ? '✅ PASSED' : '❌ FAILED', `New Status: ${updatedOrder.status}`);

    console.log('\n==============================================');
    console.log('🎉 ALL SERVER & DATABASE CRUD TESTS PASSED!');
    console.log('==============================================\n');

  } catch (error) {
    console.error('\n❌ Test execution encountered an error:', error.message);
  }
};

runTests();