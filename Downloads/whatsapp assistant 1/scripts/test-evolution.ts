/**
 * Evolution API Test Script
 * Run with: npx tsx scripts/test-evolution.ts
 * 
 * This script tests the Evolution API integration by:
 * 1. Checking if the API is accessible
 * 2. Creating a test instance
 * 3. Fetching the QR code for pairing
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'your-evolution-key-here';

interface ApiResponse {
    [key: string]: unknown;
}

async function request<T = ApiResponse>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
    const url = `${EVOLUTION_API_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
                ...options.headers,
            },
        });

        const data = await response.json() as T;
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        console.error(`❌ Request failed: ${error}`);
        throw error;
    }
}

async function testApiHealth(): Promise<boolean> {
    console.log('\n🔍 Testing API Health...');
    console.log(`   URL: ${EVOLUTION_API_URL}`);

    try {
        const response = await fetch(EVOLUTION_API_URL);
        if (response.ok) {
            console.log('   ✅ Evolution API is running!');
            return true;
        } else {
            console.log(`   ❌ API returned status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Cannot connect to Evolution API at ${EVOLUTION_API_URL}`);
        console.log('   💡 Make sure Docker is running: docker compose up -d');
        return false;
    }
}

async function listInstances(): Promise<void> {
    console.log('\n📋 Listing existing instances...');

    const { ok, data } = await request<Array<{ instance: { instanceName: string; state: string } }>>('/instance/fetchInstances');

    if (ok && Array.isArray(data)) {
        if (data.length === 0) {
            console.log('   No instances found.');
        } else {
            data.forEach((inst) => {
                console.log(`   - ${inst.instance.instanceName} (${inst.instance.state})`);
            });
        }
    }
}

async function createTestInstance(instanceName: string): Promise<boolean> {
    console.log(`\n🆕 Creating instance "${instanceName}"...`);

    const { ok, status, data } = await request('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
        }),
    });

    if (ok) {
        console.log('   ✅ Instance created successfully!');
        console.log(`   Instance ID: ${(data as { instance?: { instanceId?: string } }).instance?.instanceId || 'N/A'}`);
        return true;
    } else {
        if (status === 403) {
            console.log('   ⚠️  Instance may already exist');
        } else {
            console.log(`   ❌ Failed to create instance: ${JSON.stringify(data)}`);
        }
        return false;
    }
}

async function getConnectionState(instanceName: string): Promise<void> {
    console.log(`\n🔗 Checking connection state for "${instanceName}"...`);

    const { ok, data } = await request<{ instance: { state: string } }>(`/instance/connectionState/${instanceName}`);

    if (ok) {
        const state = (data as { instance?: { state?: string } }).instance?.state || 'unknown';
        console.log(`   State: ${state}`);

        if (state === 'open') {
            console.log('   ✅ WhatsApp is connected!');
        } else if (state === 'close') {
            console.log('   📱 WhatsApp is disconnected. Scan QR code to connect.');
        }
    }
}

async function fetchQRCode(instanceName: string): Promise<void> {
    console.log(`\n📲 Fetching QR code for "${instanceName}"...`);

    const { ok, data } = await request<{ code?: string; base64?: string }>(`/instance/connect/${instanceName}`);

    if (ok && data) {
        if (data.base64) {
            console.log('   ✅ QR Code available!');
            console.log('\n   📱 To pair WhatsApp:');
            console.log('   1. Open WhatsApp on your phone');
            console.log('   2. Go to Settings > Linked Devices');
            console.log('   3. Tap "Link a Device"');
            console.log('   4. Scan the QR code from the Swagger UI or dashboard');
            console.log(`\n   🌐 Swagger UI: ${EVOLUTION_API_URL}/docs`);
            console.log(`   📲 QR Code endpoint: ${EVOLUTION_API_URL}/instance/connect/${instanceName}`);
        } else if (data.code) {
            console.log(`   Pairing code: ${data.code}`);
        } else {
            console.log('   ⚠️  Already connected or QR not available');
        }
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('       Evolution API Integration Test');
    console.log('═══════════════════════════════════════════════════');

    // Check API health
    const isHealthy = await testApiHealth();
    if (!isHealthy) {
        console.log('\n💡 Quick Start:');
        console.log('   1. Run: docker compose up -d');
        console.log('   2. Wait a few seconds for startup');
        console.log('   3. Run this script again');
        process.exit(1);
    }

    // List existing instances
    await listInstances();

    // Create a test instance
    const testInstanceName = 'test-assistant';
    await createTestInstance(testInstanceName);

    // Check connection state
    await getConnectionState(testInstanceName);

    // Fetch QR code
    await fetchQRCode(testInstanceName);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('       Test Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('   1. Open your browser to the Swagger UI');
    console.log(`      ${EVOLUTION_API_URL}/docs`);
    console.log('   2. Scan the QR code with WhatsApp');
    console.log('   3. Start your Next.js app: npm run dev');
    console.log('   4. Test sending messages via the dashboard');
}

main().catch(console.error);
