# Ad Manager - Staging Area

A high-fidelity React frontend for an Ad Manager 'Staging Area' featuring a node-based workflow UI with premium dark mode aesthetics and comprehensive accessibility features.

## Features

- **Node-Based Workflow UI**: Visual canvas connecting Sales Contract (Source) to Campaign Fields (Target) using React Flow
- **Premium Dark Mode**: Netflix/Disney+ inspired design with deep grays (#121212) and vibrant accent colors
- **Compliance Score Gauge**: Real-time radial gauge showing compliance score (1-100)
- **Audit Sidebar**: AI-generated flags with FAIL/WARN/PASS status indicators
- **Animated Connections**: Data pulses flowing from Contract to Fields with color-coded status
- **Remediation System**: One-click remediation with morph animations
- **Full Accessibility**: WCAG 2.1 AA compliant with keyboard navigation, screen reader support, and ARIA labels

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Flow (for node-based UI)
- Framer Motion (for animations)
- Lucide React (for icons)

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory with your API configuration:

```env
VITE_API_KEY=your-api-key-here
VITE_API_BASE_URL=http://localhost:3000/api
```

The API key is automatically included in all requests via the `Authorization` header and `X-API-Key` header.

**Note:** The `.env` file has already been created with your API key. Make sure your backend is running at the configured `VITE_API_BASE_URL`.

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build (Local Production Environment)

To test the production build locally:

```bash
# Build the production bundle
npm run build

# Preview the production build
npm run preview
# or with custom host/port
npm run serve
```

The production preview will be available at `http://localhost:4173` (or the port shown in terminal).

### Deploy to Production

The `dist` folder contains the production-ready files. You can deploy this to:

- **Static Hosting**: Netlify, Vercel, GitHub Pages, AWS S3
- **CDN**: Cloudflare Pages, AWS CloudFront
- **Server**: Any web server (nginx, Apache, etc.)

For example, with Vercel:
```bash
npm install -g vercel
vercel
```

Or with Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Accessibility Features

- **WCAG 2.1 AA Color Contrast**: All status badges meet minimum 4.5:1 ratio
- **Icon Indicators**: Status conveyed through icons (🚩, ⚠️, ✅) in addition to color
- **Keyboard Navigation**: All interactive elements are focusable via Tab with visible focus rings
- **Screen Reader Support**: ARIA live regions announce compliance score updates and remediation events
- **Labels**: All form inputs have persistent labels or aria-labels
- **Focus Management**: Visible focus rings on all focusable elements

## Component Structure

- `Header.jsx`: Breadcrumbs and Compliance Score gauge
- `AuditSidebar.jsx`: Vertical list of audit flags with remediation buttons
- `NodeWorkspace.jsx`: React Flow canvas with Contract and Field nodes
- `ContractNode.jsx`: Source node displaying contract data
- `FieldNode.jsx`: Target nodes for Budget, Genres, and Geos
- `PushToLiveButton.jsx`: Disabled until compliance score reaches 100

## Usage

1. **View Audit Flags**: Check the sidebar for AI-generated compliance issues
2. **Remediate Issues**: Click "Remediate" on FAIL flags to auto-fix field values
3. **Monitor Compliance**: Watch the compliance score update in real-time
4. **Push to Live**: Once compliance reaches 100%, the "Push to Live" button becomes enabled

## Color Palette

- Background: `#121212` (dark-bg)
- Surface: `#1e1e1e` (dark-surface)
- Border: `#2d2d2d` (dark-border)
- Accent Red (FAIL): `#e50914`
- Accent Amber (WARN): `#ffa500`
- Accent Green (PASS): `#00d4aa`

