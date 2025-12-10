# Ju Keramia

> Handcrafted ceramics e-commerce platform with a custom ceramic-inspired design system

A modern, artisanal ceramics business website built with Nuxt 3, featuring a full-featured admin dashboard for managing products and hero images. The project emphasizes craftsmanship, natural materials, and timeless design through its unique ceramic-inspired aesthetic.

## 🎨 Design Philosophy

Ju Keramia showcases a custom design system inspired by ceramic artistry:

- **Color Palette**: Earth-toned colors (clay, sage, stone, cream)
- **Typography**: Playfair Display for headers, Inter for body text
- **Aesthetic**: Organic, warm, and inviting with artisanal feel
- **UI Components**: Extensively customized Nuxt UI with ceramic theming

## ✨ Key Features

### Customer-Facing

- 🖼️ **Dynamic Hero Images**: Managed hero images for landing and about pages
- 🛍️ **Product Catalog**: Browseable ceramic product showcase with categories
- 📧 **Contact Form**: hCaptcha-protected contact form with email notifications
- 🎨 **Ceramic Design System**: Custom utility classes and color palette
- 📱 **Responsive Design**: Mobile-first approach with ceramic aesthetics

### Admin Dashboard

- 🔐 **Secure Authentication**: HttpOnly cookie-based auth with Supabase
- 🖼️ **Hero Image Management**: Upload and manage page hero images
- 📦 **Product Management**: Full CRUD operations for ceramic products
- 🖼️ **Image Upload**: Drag-and-drop upload with compression and WebP conversion
- 📊 **Bulk Actions**: Select and delete multiple products
- ⚡ **Auto-logout**: 30-minute inactivity timeout with activity tracking

## 🛠️ Technology Stack

### Core Framework

- **Nuxt 3** (v4.1.2) - Vue 3 framework with SSR
- **Vue 3** (v3.5.21) - Progressive JavaScript framework
- **TypeScript** (v5.9.2) - Type-safe development

### UI & Styling

- **Nuxt UI** (v3.3.4) - Comprehensive UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **Nuxt Icon** (v2.0.0) - Icon management with Heroicons
- **Nuxt Image** (v1.11.0) - Image optimization

### Backend & Database

- **Supabase** - PostgreSQL database and authentication
- **Cloudflare R2** - S3-compatible object storage for images
- **AWS SDK** - S3 client for R2 integration

### State Management

- **Pinia** (v3.0.3) - Vue state management
- **Pinia Persistedstate** - Local storage persistence

### Email & Security

- **Resend** - Email service for contact form
- **hCaptcha** - Bot protection for forms

### Code Quality

- **ESLint** (v9.35.0) - Code linting
- **Prettier** (v3.6.2) - Code formatting
- **Husky** (v9.1.7) - Git hooks
- **lint-staged** (v16.1.6) - Pre-commit linting

## 📁 Project Structure

```
ju_keramia/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── main.css              # Ceramic design system tokens
│   ├── components/
│   │   ├── admin/                    # Admin dashboard components
│   │   │   ├── DashboardContent.vue
│   │   │   ├── ImageUploader.vue
│   │   │   ├── ProductForm.vue
│   │   │   └── products/             # Product management components
│   │   ├── common/                   # Reusable UI components
│   │   └── layout/                   # Header, footer, navigation
│   ├── layouts/
│   │   ├── admin.vue                 # Admin layout (no header/footer)
│   │   └── default.vue               # Main layout
│   ├── pages/
│   │   ├── admin/                    # Admin dashboard pages
│   │   │   ├── index.vue             # Login & dashboard
│   │   │   ├── products.vue          # Product management
│   │   │   └── hero-images/          # Hero image management
│   │   ├── about/
│   │   ├── contact/
│   │   ├── shop/
│   │   └── index.vue                 # Landing page
│   └── app.config.ts                 # Nuxt UI customization
├── composables/                      # Reusable logic
│   ├── useCaptcha.ts                 # hCaptcha integration
│   ├── useHeroImages.ts              # Hero image management
│   ├── useImageUpload.ts             # Cloudflare R2 upload
│   ├── useProductList.ts             # Product fetching
│   ├── useProductMutations.ts        # Product CRUD
│   └── useNotifications.ts           # Toast notifications
├── config/
│   └── heroImagePages.ts             # Hero image configuration
├── plugins/
│   ├── auth-auto-logout.client.ts    # Activity tracking
│   └── auth-ssr.server.ts            # SSR auth hydration
├── server/
│   ├── api/
│   │   ├── auth/                     # Authentication endpoints
│   │   ├── admin/                    # Admin API routes
│   │   └── contact.post.ts           # Contact form handler
│   └── utils/                        # Server utilities
├── shared/                           # Shared validation schemas
├── stores/
│   └── auth.ts                       # Pinia auth store
├── types/
│   ├── admin.ts                      # Admin type definitions
│   └── supabase.ts                   # Database types
└── nuxt.config.ts                    # Nuxt configuration
```

## 🔒 Security

### Row Level Security (RLS)

All database tables are protected with PostgreSQL Row Level Security policies:

- ✅ **RLS Enabled**: All tables have RLS enabled
- ✅ **Admin-Only Write Access**: Only registered admin users can create/update/delete
- ✅ **Public Read Access**: Products and hero images are publicly viewable
- ✅ **Email-Based Admin Check**: Admin verification via `is_admin()` function

**Admin User Management:**

- Admin access is controlled by email whitelist in `is_admin()` function
- Default admin: `jukeramia@gmail.com`
- To add more admins, update `supabase/migrations/009_fix_hero_images_rls.sql`

**Protected Tables:**

- `hero_images` - Landing/About page hero images
- `products` - Product catalog
- `orders` - Customer orders (future feature)

**Documentation:** See [docs/RLS_SECURITY.md](docs/RLS_SECURITY.md) for complete details.

### Authentication Security

- 🔐 **HttpOnly Cookies**: Tokens stored in HttpOnly cookies (XSS protection)
- 🕒 **Auto-Logout**: 30-minute inactivity timeout
- 🔑 **Strong Password Policy**: Min 8 chars, uppercase, lowercase, number, special char
- 🛡️ **Leaked Password Check**: Client-side HIBP integration blocks compromised passwords
- 🚫 **CSRF Protection**: SameSite=lax cookie attribute

**Documentation:** See [docs/PASSWORD_LEAK_CHECK.md](docs/PASSWORD_LEAK_CHECK.md) for password security details.

### Applying RLS Migrations

**Important:** Before running migrations, update the admin email in the SQL files:

```bash
# 1. Edit the admin email
vim supabase/migrations/009_fix_hero_images_rls.sql
# Change 'jukeramia@gmail.com' to your admin email

# 2. Run migrations
supabase db push

# Or use the automated script
chmod +x scripts/apply-rls-migration.sh
./scripts/apply-rls-migration.sh
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Supabase** account and project
- **Cloudflare R2** bucket for image storage
- **Resend** account for email service
- **hCaptcha** site and secret keys

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/DeDe-code/ju_keramia.git
cd ju_keramia
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Configuration**

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase
NUXT_PUBLIC_SUPABASE_URL=your_supabase_url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2
NUXT_CLOUDFLARE_ACCOUNT_ID=your_account_id
NUXT_CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
NUXT_CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
NUXT_CLOUDFLARE_BUCKET_NAME=your_bucket_name
NUXT_PUBLIC_CLOUDFLARE_PUBLIC_URL=https://your-r2-public-url.com

# Email (Resend)
NUXT_RESEND_API_KEY=your_resend_api_key
NUXT_RESEND_TO_EMAIL=hello@jukeramia.com
NUXT_RESEND_FROM_EMAIL=contact@jukeramia.com

# hCaptcha
NUXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
NUXT_HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key

# Site URL
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Database Setup**

Run Supabase migrations to create the necessary tables:

```bash
# Navigate to supabase directory
cd supabase

# Run migrations (requires Supabase CLI)
supabase db push
```

**Database Tables:**

- `products`: Ceramic product catalog
- `orders`: Customer orders
- `hero_images`: Page hero images

5. **Start Development Server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎨 Ceramic Design System

### Color Palette

```css
/* Primary Colors */
--clay-50 to --clay-900     /* Earth browns */
--sage-50 to --sage-900     /* Natural greens */
--stone-50 to --stone-900   /* Cool grays */
--cream-25 to --cream-100   /* Warm off-whites */

/* Usage */
.bg-clay-700                /* Primary buttons */
.text-sage-600              /* Secondary text */
.border-stone-300           /* Borders */
```

### Typography

```css
/* Font Families */
font-ceramic-display        /* Playfair Display - Headers */
font-ceramic-sans           /* Inter - Body text */
font-ceramic-mono           /* Cutive Mono - Code */

/* Font Sizes */
text-ceramic-xs to text-ceramic-hero  /* xs, sm, base, lg, xl, 2xl, 3xl, 4xl, hero, title */
```

### Spacing

```css
/* Custom Spacing Scale */
*-ceramic-xs    /* 8px */
*-ceramic-sm    /* 16px */
*-ceramic-md    /* 24px */
*-ceramic-lg    /* 32px */
*-ceramic-xl    /* 48px */
*-ceramic-2xl   /* 64px */
*-ceramic-3xl   /* 96px */
```

## 🧩 Key Components & Composables

### Composables

- **`useImageUpload`**: Cloudflare R2 upload with compression and WebP conversion
- **`useHeroImages`**: 5-minute smart caching for hero images
- **`useProductList`**: Product fetching with loading states
- **`useProductMutations`**: CRUD operations for products
- **`useNotifications`**: Centralized toast notification system
- **`useCaptcha`**: Clean hCaptcha integration

### Admin Components

- **`AdminImageUploader`**: Full-featured image uploader with drag-and-drop
- **`AdminProductForm`**: Comprehensive product creation/editing form
- **`AdminProductsProductCard`**: Product card with actions
- **`AdminHeroImageContent`**: Hero image management interface

## 📝 Development Workflow

### Code Quality Tools

```bash
# Linting
npm run lint              # Check for linting errors
npm run lint:fix          # Auto-fix linting errors

# Formatting
npm run format            # Format code with Prettier
```

### Pre-commit Hooks

The project uses Husky and lint-staged to enforce code quality:

- **Auto-formatting**: Prettier formats on commit
- **Auto-linting**: ESLint fixes issues on commit
- **Type checking**: TypeScript validation

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with ceramic design patterns
3. Commit changes (hooks run automatically)
4. Push and create pull request

## 🧪 Testing

### Testing Approach

- **Component Testing**: Focus on admin components
- **API Testing**: Test server endpoints
- **E2E Testing**: Critical user flows

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 🔒 Security Features

- **HttpOnly Cookies**: Secure token storage (XSS protection)
- **CSRF Protection**: SameSite cookie policy
- **hCaptcha**: Bot protection on forms
- **Auto-logout**: 30-minute inactivity timeout
- **Input Validation**: Zod schemas for all forms
- **SQL Injection Protection**: Supabase parameterized queries

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Environment Variables for Production

Ensure all environment variables are set in your production environment:

- Configure Cloudflare R2 bucket CORS settings
- Set up Supabase production database
- Configure custom domain for R2 public URL
- Set up email domain verification in Resend

## 🤝 Contributing

### Code Standards

1. **Component Naming**
   - Layout: `Layout*` prefix (e.g., `LayoutAppHeader`)
   - Common: `Common*` prefix (e.g., `CommonHeroImageWrapper`)
   - Admin: `Admin*` prefix (e.g., `AdminProductForm`)

2. **Styling Conventions**
   - Use ceramic design tokens (`*-ceramic-*`)
   - Mobile-first responsive design
   - Prefer utility classes over custom CSS

3. **TypeScript**
   - Strict mode enabled
   - Proper typing for all props and functions
   - Use type imports from `types/` directory

4. **State Management**
   - Use composables for reusable logic
   - Pinia stores for global state
   - Local `ref()`/`reactive()` for component state

### Code Exemplars

See comprehensive component examples in `.github/copilot-instructions.md`:

- Admin dashboard components
- Image upload patterns
- Form validation with Nuxt UI
- Ceramic design system integration

## 📚 Documentation

- **[Copilot Instructions](.github/copilot-instructions.md)**: Comprehensive development guide
- **[Cloudflare R2 Setup](docs/CLOUDFLARE_R2_SETUP.md)**: R2 configuration guide
- **[Image Upload Composable](docs/IMAGE_UPLOAD_COMPOSABLE.md)**: Upload system documentation
- **[Pinia Auth Migration](docs/PINIA_AUTH_MIGRATION.md)**: Auth implementation guide

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🙏 Acknowledgments

- **Nuxt Team**: For the excellent framework
- **Nuxt UI**: For the comprehensive component library
- **Supabase**: For the backend infrastructure
- **Cloudflare**: For R2 object storage

---

**Built with ❤️ and 🏺 by dede-code**
