
# SCHUPA — Student Sponsorship Tracking Platform

## Brand Identity
- **Logo**: "SCHUPA" text logo
- **Tagline**: "Shaping brighter minds for a brighter world"
- **Colors**: Dark green primary (#1B5E20), warm orange accent (#E65100), white backgrounds, dark text
- **Style**: Modern, futuristic, clean with rounded cards and smooth transitions
- **Photo**: The uploaded beneficiary group photo will be used on the landing page

## Pages & Features

### 1. Landing Page
- **Hero section** with semi-transparent green overlay on a background image, tagline, and CTA buttons (Sign Up / Log In)
- **About section** describing SCHUPA's mission
- **Program cards** with icons, descriptions, and "Learn More" buttons
- **Beneficiary photo section** using the uploaded group photo
- **Contact form** for submitting queries (name, email, message)
- **Footer** with links, social icons, copyright

### 2. Navigation & Footer
- Sticky top navbar with SCHUPA logo, nav links (Home, About, Programs, Contact), and Login/Sign Up buttons
- Responsive hamburger menu on mobile
- Footer with site links, contact info, social media icons

### 3. Authentication Pages
- **Sign Up** form: name, email, password, confirm password, agree to terms
- **Sign In** form: email, password, "Forgot Password" link
- **Forgot Password** page: email input to request reset
- **Terms & Conditions** page: auto-generated policy content
- After signup: "Awaiting admin approval" status screen — users cannot access dashboard until approved

### 4. Demo Accounts
- **Admin**: admin@schupa.org / Admin@2026
- **Student**: student@schupa.org / Student@2026
- Mock data for 5-6 demo students with profiles, results, fee statements

### 5. Student Dashboard
- **Welcome banner**: "Welcome back, [Name]!" with profile summary
- **Profile section**: Photo upload, name, course, institution, year joined, current year
- **Academic progress timeline**: Visual Year 1 → Year 2 → ... → Graduation checklist
- **Results section**: Upload transcripts, view uploaded results, responsive chart/graph showing grades over time
- **Fee statement section**: Upload fee statements, view current balance, payment history
- **Edit profile** functionality with success/error feedback and loading spinners

### 6. Admin Dashboard
- **Overview cards**: Total students, pending approvals, total fee balances, enrollment stats
- **Analytics charts**: Fee collection trends, enrollment stats, performance distribution
- **Student management table**: Searchable, filterable by course, year, fee balance — click a student row to view their full profile
- **Approve/reject** pending student registrations
- **Add remarks** on individual student profiles
- **Export options**: Download student data as CSV/PDF

### 7. UX & Design Details
- Fully responsive (mobile-first)
- Loading spinners on data fetches
- Success toasts on save, error messages on failures
- Smooth page transitions
- All data is mock/demo data stored in local state (no backend yet)
- Futuristic card-based UI with subtle shadows and hover effects
