# Meta Pixel Setup Guide

## Overview
The Meta Pixel has been properly configured with pixel ID: `1373360484073939`

## What's Been Implemented

### 1. **Proper Meta Pixel Script Loading**
- Split into two scripts for better loading control
- Base script loads the Facebook events.js library
- Init script initializes the pixel and tracks initial events
- Proper noscript fallback for users with JavaScript disabled

### 2. **Enhanced Tracking Functions**
- All tracking functions now include proper logging
- Better error handling and debugging capabilities
- Comprehensive event tracking for e-commerce and lead generation

### 3. **Meta Pixel Provider Component**
- Automatically initializes Meta Pixel on app load
- Tracks page views and visibility changes
- Provides centralized pixel management

### 4. **Debug Component (Development Only)**
- Visual debugger that shows pixel status
- Test buttons for all major events
- Real-time event logging
- Only appears in development mode

## Testing Your Meta Pixel

### Method 1: Facebook Pixel Helper (Recommended)
1. Install the [Facebook Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Visit your website
3. Click the extension icon to see all pixel events
4. Verify that events are firing correctly

### Method 2: Browser Developer Tools
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for Meta Pixel logs (they start with "Meta Pixel:")
4. Check Network tab for requests to facebook.com/tr

### Method 3: Use the Debug Component
1. Run the app in development mode (`npm run dev`)
2. Look for the debug panel in the bottom-right corner
3. Click test buttons to trigger events
4. Monitor the event log

### Method 4: Facebook Events Manager
1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Select your pixel (ID: 1373360484073939)
3. Go to "Test Events" tab
4. Use the "Test Browser Events" feature
5. Enter your website URL and test events

## Available Tracking Functions

### E-commerce Events
- `trackPageView()` - Page views
- `trackViewContent()` - Product views
- `trackAddToCart()` - Add to cart
- `trackRemoveFromCart()` - Remove from cart
- `trackInitiateCheckout()` - Checkout started
- `trackPurchase()` - Purchase completed

### Lead Generation Events
- `trackLead()` - Lead generation
- `trackCompleteRegistration()` - Registration completed

### Custom Events
- `trackCustomEvent()` - Custom events
- `trackButtonClick()` - Button clicks
- `trackScrollDepth()` - Scroll tracking
- `trackTimeOnPage()` - Time on page
- `trackFormStart()` - Form interactions
- `trackFormSubmit()` - Form submissions
- `trackSearch()` - Search events
- `trackVideoPlay()` - Video interactions

### Ethnic Package Events
- `trackEthnicPurchase()` - Ethnic package purchases
- `trackEthnicLead()` - Ethnic package leads
- `trackEthnicViewContent()` - Ethnic package views

## Testing Checklist

### ✅ Basic Setup
- [ ] Pixel ID is correct (1373360484073939)
- [ ] Script loads without errors
- [ ] PageView events fire on page load
- [ ] No JavaScript errors in console

### ✅ E-commerce Events
- [ ] ViewContent fires on product pages
- [ ] AddToCart fires when items are added
- [ ] InitiateCheckout fires on checkout start
- [ ] Purchase fires on successful payment

### ✅ Lead Generation
- [ ] Lead events fire on CTA clicks
- [ ] CompleteRegistration fires on signup
- [ ] Custom events work properly

### ✅ Debugging
- [ ] Debug component appears in development
- [ ] Test events work correctly
- [ ] Event logging is visible
- [ ] Facebook Pixel Helper shows events

## Common Issues & Solutions

### Issue: Events not showing in Facebook Events Manager
**Solution:** 
- Wait 5-10 minutes for events to appear
- Check if ad blockers are enabled
- Verify pixel ID is correct
- Use Facebook Pixel Helper to debug

### Issue: Test events not working
**Solution:**
- Clear browser cache
- Disable ad blockers temporarily
- Check console for JavaScript errors
- Verify pixel is loaded (use `isMetaPixelLoaded()`)

### Issue: Duplicate events
**Solution:**
- Check if pixel is initialized multiple times
- Ensure tracking functions aren't called multiple times
- Use the debug component to monitor events

## Production Deployment

### Before Going Live:
1. Remove or disable the debug component
2. Test all tracking functions thoroughly
3. Verify events in Facebook Events Manager
4. Set up conversion tracking in Facebook Ads Manager
5. Configure custom audiences based on pixel data

### Environment Variables:
The pixel ID is hardcoded, but you can make it configurable by adding:
```env
NEXT_PUBLIC_META_PIXEL_ID=1373360484073939
```

## Support
If you encounter issues:
1. Check the browser console for errors
2. Use Facebook Pixel Helper
3. Test with the debug component
4. Verify events in Facebook Events Manager
5. Check the Meta Pixel documentation

The implementation follows Facebook's best practices and should work reliably across all modern browsers.


