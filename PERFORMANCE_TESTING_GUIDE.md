# Performance Testing Guide

## Quick Verification Steps

### 1. Bundle Size Analysis
```bash
# Build the app and see bundle size
npm run build

# Look for output like:
# - Increased bundle size (check for regressions)
# - Page size changes
```

### 2. Lighthouse Audit (Chrome DevTools)
1. Open your app in Chrome
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Select "Desktop" for main audit
5. Click "Analyze page load"
6. Compare with baseline:
   - Performance should be 75+
   - Check Core Web Vitals

### 3. Core Web Vitals Check
```javascript
// Paste in browser console to see real metrics:
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
  });
}).observe({entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']});
```

### 4. Network Throttling Test
1. Open DevTools Network tab
2. Click throttle dropdown (normally says "No throttling")
3. Select "Slow 3G"
4. Refresh page
5. Observe load times - should be acceptable (< 5-8s for FCP)

### 5. Mobile Performance Test
1. Open DevTools
2. Click Device Toolbar (Ctrl+Shift+M)
3. Select "Moto G4" or similar low-end device
4. Set CPU to 4x slowdown
5. Record performance:
   - Interactions should feel smooth
   - No layout jank
   - Animations shouldn't cause stuttering

### 6. Image Optimization Verification
1. Open DevTools → Network tab
2. Filter by "Images"
3. Reload page
4. Check:
   - Images should be served in WebP format (check "Type" column)
   - Image sizes should be reasonable
   - No unexpectedly large images

### 7. Animation Performance Check
1. Open DevTools → Performance tab
2. Click record button
3. Scroll or interact with animations
4. Stop recording
5. Look for:
   - Consistent 60 FPS (green line in FPS graph)
   - No red markers (dropped frames)
   - Smooth frame rate graph

---

## Expected Performance Improvements

### Page Load Times
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| FCP | ~1.8s | ~1.4s | 22% faster |
| LCP | ~2.5s | ~1.8s | 28% faster |
| TTI | ~3.2s | ~2.4s | 25% faster |
| Total JS | ~450KB | ~350KB | 22% lighter |

### Lighthouse Scores (Expected)
| Category | Before | After | Change |
|----------|--------|-------|--------|
| Performance | 60-70 | 75-85 | +15-25 |
| Best Practices | 85-90 | 90-95 | +5-10 |
| Accessibility | 90+ | 90+ | No change |
| SEO | 90+ | 90+ | No change |

---

## Testing on Different Devices

### Desktop (Chrome)
1. Latest Chrome on Windows/Mac
2. 4G connection
3. No CPU throttling
4. **Expected FCP:** < 1.5s

### Mobile (Android)
1. Chrome on Pixel 3+ device
2. 4G/LTE connection
3. No CPU throttling
4. **Expected FCP:** < 2.0s

### Low-End Mobile (Moto G4 Simulation)
1. Chrome DevTools device simulation
2. Slow 3G throttling
3. 4x CPU slowdown
4. **Expected FCP:** < 3.5s
5. **Expected Smooth Interactions:** Yes

---

## Metrics to Monitor

### Performance Metrics
- [ ] First Contentful Paint (FCP) < 2.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] First Input Delay (FID) < 100ms

### Bundle Metrics
- [ ] Total JS: < 400KB (gzipped)
- [ ] CSS: < 50KB (gzipped)
- [ ] HTML: < 30KB
- [ ] Images: Optimized with WebP

### Animation Metrics
- [ ] FPS: Consistently 60fps
- [ ] No dropped frames during animations
- [ ] Sidebar open/close smooth on mobile
- [ ] Dashboard charts render without jank

---

## Potential Issues and Fixes

### Issue: Animations feeling sluggish
**Solution:** Check DevTools Performance tab for dropped frames
- Look for red indicators in FPS graph
- May indicate GPU overload
- Reduce animation complexity if needed

### Issue: Images not optimizing
**Solution:** Verify Next.js image optimization in network tab
- Images should be in WebP format
- Check DevTools → Network → Filter by "Images"
- May need to clear browser cache

### Issue: Bundle size hasn't improved
**Solution:** Verify the changes were applied
```bash
npm run build
# Check console output for bundle sizes
```

### Issue: Animations not working
**Solution:** Verify CSS animations file was imported
- Check `styles/globals.css` has import for `animations.css`
- Verify `styles/animations.css` exists and has content
- Check browser console for errors

---

## Using Web Vitals Library (Optional)

Add to `app/layout.tsx` for production monitoring:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

This automatically tracks Core Web Vitals and sends to Vercel.

---

## Lighthouse Best Practices

### Before Audit
- Clear browser cache (DevTools → ⋮ → Clear site data)
- Disable browser extensions
- Close other tabs/applications
- Use incognito mode

### Running Audit
- Test both Desktop and Mobile modes
- Run multiple times and average results
- Test before deployment
- Test after deployment

### Interpreting Results
- **Green (90-100):** Good, no action needed
- **Yellow (50-89):** Room for improvement
- **Red (0-49):** Critical issues

---

## Regression Testing

After each deployment:
1. Run Lighthouse audit on:
   - Home page (login)
   - Admin dashboard
   - Employee page
   - Reports page
2. Compare with baseline
3. Alert if scores drop > 5 points
4. Investigate any regressions

---

## Performance Budget

Suggested budgets for this app:
- JavaScript: < 400KB (gzipped)
- CSS: < 50KB (gzipped)
- Images: < 30KB per image (avg)
- Fonts: < 100KB total
- **Total Page Load:** < 3s on 4G

---

## Tools Needed

- Chrome DevTools (Built-in)
- Lighthouse CI (Optional, for automation)
- WebPageTest.org (Free, detailed analysis)
- GTmetrix (Free tier available)

---

## Quick Command Reference

```bash
# Build and check bundle size
npm run build

# Analyze JavaScript bundle
npm run build -- --analyze
# (if using @next/bundle-analyzer)

# Development build for testing
npm run dev

# Production build locally
npm run build && npm start
```

---

**Test regularly, monitor metrics, and stay performance-conscious!**
