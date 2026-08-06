# 🛰️ Starlink Reseller Platform

A complete mobile money payment platform for Starlink internet resellers in DRC/Kenya.

## Features

- 🌐 **Internet Plans** - Browse and select from 5 different packages
- 📱 **Airtel Money Integration** - Secure payments via Airtel Money
- 🟧 **Orange Money Integration** - Alternative payment method
- 📊 **Real-time Dashboard** - View service status, speed, and data usage
- 📋 **Order History** - Track all your purchases
- ⚙️ **User Settings** - Account management and preferences
- 📲 **Mobile Responsive** - Works on all devices
- 🔒 **Secure Payments** - SSL encryption and secure transactions

## Packages

| Package | Data | Price (CDF) | Original Price |
|---------|------|-------------|----------------|
| Basic   | 5 GB/month | 3,000 | 5,000 |
| Standard | 15 GB/month | 5,000 | 8,000 |
| Premium | 30 GB/month | 8,000 | 12,000 |
| Pro | 60 GB/month | 12,000 | 15,000 |
| Business | 100 GB/month | 20,000 | 30,000 |

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps

1. Clone the repository
```bash
git clone https://github.com/yourusername/starlink-reseller.git
cd starlink-reseller
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Or start in production
```bash
npm start
```

5. Open your browser
```
http://localhost:3000
```

## Project Structure

```
starlink-reseller/
├── index.html          # Main application
├── css/
│   ├── style.css       # Core styles
│   └── components.css  # Component styles
├── js/
│   ├── app.js          # Application logic
│   ├── payments.js     # Payment processing
│   └── orders.js       # Order management
├── backend/
│   ├── server.js       # Express server
│   ├── routes/         # API routes
│   ├── models/         # Data models
│   └── controllers/    # Business logic
├── package.json
└── README.md
```

## API Endpoints

### GET /api/packages
Get all available internet packages

### POST /api/payment
Process a payment
```json
{
  "packageId": "basic",
  "method": "airtel",
  "phone": "254712345678",
  "amount": 3000
}
```

### GET /api/orders/:phone
Get orders by phone number

### POST /api/webhook/airtel
Airtel Money webhook

### POST /api/webhook/orange
Orange Money webhook

## Payment Flow

1. User selects a package
2. Chooses payment method (Airtel Money or Orange Money)
3. Enters phone number and PIN
4. Receives OTP for verification
5. Completes payment
6. Order is created and service activated

## Customization

### Add New Package
Edit the `packages` array in `js/app.js`:
```javascript
{
    id: 'custom',
    name: 'Custom Package',
    data: '50 GB/month',
    price: 10000,
    originalPrice: 15000,
    features: ['Unlimited data', 'Custom feature']
}
```

### Change Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --primary: #1a1a2e;
    --highlight: #e94560;
    --success: #2ecc71;
}
```

## Technologies Used

- HTML5, CSS3, JavaScript
- Express.js (Backend)
- Font Awesome / Emoji Icons
- Custom CSS with Glassmorphism

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

## Support

For support, email support@starlink.reseller or contact your local reseller.

---

**Built with ❤️ for the Starlink Community**