# Development Prompts - Shiv Accounts Cloud
## Step-by-Step Implementation Tasks

### Phase 1: Project Setup & Foundation (Week 1)

#### 1.1 Initialize Next.js Project
- Set up Next.js 14+ with App Router
- Configure TypeScript with strict mode
- Initialize Tailwind CSS and Shadcn/ui
- Set up ESLint and Prettier
- Create basic project structure (components, lib, types, utils)

#### 1.2 Database Configuration
- Set up Neon PostgreSQL database
- Configure Drizzle ORM with connection
- Create database schema files
- Set up migration system
- Configure environment variables

#### 1.3 Authentication System
- Implement NextAuth.js configuration
- Create login/register pages
- Set up user roles (Admin, Accountant, Contact)
- Configure session management
- Create protected route middleware

#### 1.4 Basic UI Components
- Install and configure Shadcn/ui components
- Create layout components (Header, Sidebar, Footer)
- Set up navigation structure
- Create basic dashboard skeleton
- Implement responsive design system

### Phase 2: Core Database & API (Week 2)

#### 2.1 Database Schema Design
- Design and implement users table
- Create contacts table (customers/vendors)
- Design products table with HSN codes
- Create taxes and chart_of_accounts tables
- Set up relationships and constraints

#### 2.2 Master Data API Endpoints
- Implement contacts CRUD API (/api/contacts)
- Create products API with HSN validation (/api/products)
- Build taxes management API (/api/taxes)
- Create chart of accounts API (/api/accounts)
- Add proper validation and error handling

#### 2.3 Authentication API
- Complete NextAuth API routes
- Implement user registration endpoint
- Create role-based access control
- Add password reset functionality
- Set up API rate limiting

#### 2.4 Database Seeding
- Create seed data for development
- Populate chart of accounts with standard entries
- Add sample tax configurations
- Create test users with different roles
- Generate sample products with HSN codes

### Phase 3: Transaction Management (Week 3-4)

#### 3.1 Order Management System
- Design orders table schema
- Create purchase order API endpoints
- Implement sales order functionality
- Add order items management
- Build order status tracking

#### 3.2 Invoice & Bill Generation
- Create invoices table and API
- Implement vendor bill conversion from PO
- Build customer invoice generation from SO
- Add invoice numbering system
- Create PDF generation capability

#### 3.3 Payment Processing
- Design payments table schema
- Implement payment recording API
- Add payment methods (Cash, Bank, etc.)
- Create payment allocation logic
- Build payment status tracking

#### 3.4 Transaction Processing
- Create transactions table for ledger entries
- Implement double-entry bookkeeping
- Add automatic journal entries
- Create transaction validation rules
- Build transaction reconciliation

### Phase 4: Frontend Development (Week 5-6)

#### 4.1 Master Data Forms
- Create contact management forms
- Build product catalog interface with HSN search
- Implement tax configuration forms
- Design chart of accounts interface
- Add bulk import/export functionality

#### 4.2 Transaction Forms
- Build purchase order creation form
- Create sales order interface
- Implement invoice generation workflow
- Design payment recording forms
- Add form validation and auto-calculation

#### 4.3 Dashboard & Navigation
- Create role-based dashboard views
- Implement navigation sidebar
- Build overview widgets and KPIs
- Add quick action buttons
- Create responsive mobile layout

#### 4.4 Data Tables & Filtering
- Implement sortable data tables for all entities
- Add advanced filtering and search
- Create pagination for large datasets
- Build export functionality (CSV/Excel)
- Add bulk operations support

### Phase 5: Reporting System (Week 7-8)

#### 5.1 Basic Reports API
- Create balance sheet generation API
- Implement profit & loss statement
- Build stock statement reporting
- Add date range filtering
- Optimize report queries for performance

#### 5.2 Report Frontend
- Design report selection interface
- Create report viewer with charts
- Implement date picker components
- Add report export options (PDF/Excel)
- Build report scheduling features

#### 5.3 Advanced Analytics
- Create dashboard KPI widgets
- Implement trend analysis charts
- Add aged receivables/payables reports
- Build cash flow projections
- Create custom report builder

#### 5.4 Report Caching
- Implement report data caching
- Add background report generation
- Create report history and archiving
- Optimize large dataset handling
- Build report sharing capabilities

### Phase 6: HSN API Integration (Week 9)

#### 6.1 HSN API Setup
- Research and select HSN API provider
- Create API integration layer
- Implement HSN code validation
- Add tax rate auto-fetching
- Handle API rate limits and errors

#### 6.2 Product HSN Enhancement
- Update product forms with HSN search
- Implement auto tax calculation based on HSN
- Add HSN code suggestions
- Create HSN compliance reporting
- Build HSN code bulk update tools

#### 6.3 GST Compliance Features
- Implement GST filing support
- Create GSTR report generation
- Add HSN-wise sales/purchase reports
- Build GST return preparation
- Integrate with GSTN API (future)

#### 6.4 HSN Data Management
- Create HSN master database
- Implement offline HSN lookup
- Add HSN code categorization
- Build HSN update notifications
- Create data synchronization

### Phase 7: Advanced Features (Week 10)

#### 7.1 User Management
- Implement user invitation system
- Create role assignment interface
- Add user permissions matrix
- Build user activity logging
- Implement user profile management

#### 7.2 Notification System
- Set up email/SMS notifications
- Create overdue payment alerts
- Implement invoice reminders
- Add approval workflow notifications
- Build notification preferences

#### 7.3 Integration APIs
- Create external API endpoints
- Implement webhook system
- Add API key management
- Build integration documentation
- Create API rate limiting

#### 7.4 Audit & Security
- Implement audit logging for all changes
- Add data backup/restore functionality
- Create user activity monitoring
- Implement security best practices
- Add compliance reporting

### Phase 8: Testing & Optimization (Week 11)

#### 8.1 Unit Testing
- Write tests for utility functions
- Create component unit tests
- Test API validation logic
- Implement database operation tests
- Add authentication flow tests

#### 8.2 Integration Testing
- Test complete transaction workflows
- Validate API endpoint integration
- Test database relationships
- Create payment flow integration tests
- Build report generation tests

#### 8.3 Performance Optimization
- Optimize database queries
- Implement API response caching
- Add database indexing
- Optimize bundle size
- Create performance monitoring

#### 8.4 End-to-End Testing
- Set up Playwright configuration
- Create critical user journey tests
- Test multi-role scenarios
- Validate report generation
- Build cross-browser testing

### Phase 9: Production Deployment (Week 12)

#### 9.1 Environment Setup
- Configure production Neon database
- Set up Vercel deployment
- Configure environment variables
- Set up monitoring tools
- Create staging environment

#### 9.2 CI/CD Pipeline
- Set up GitHub Actions
- Configure automated testing
- Implement deployment automation
- Add database migration scripts
- Create rollback procedures

#### 9.3 Security Hardening
- Implement security headers
- Configure CORS properly
- Add rate limiting
- Set up SSL certificates
- Create security monitoring

#### 9.4 Documentation & Training
- Create user documentation
- Build API documentation
- Write deployment guides
- Create admin training materials
- Set up support processes

### Phase 10: Post-Launch Support (Ongoing)

#### 10.1 Monitoring & Maintenance
- Set up error tracking (Sentry)
- Implement performance monitoring
- Create database monitoring
- Set up backup verification
- Build health check endpoints

#### 10.2 Feature Enhancements
- Collect user feedback
- Prioritize feature requests
- Plan enhancement roadmap
- Implement A/B testing framework
- Create feature flag system

#### 10.3 Support & Bug Fixes
- Set up user support channels
- Create bug tracking system
- Implement hotfix procedures
- Build user communication channels
- Establish SLA commitments

### Development Guidelines

#### Code Quality Standards
- Follow TypeScript best practices
- Maintain consistent code formatting
- Write meaningful commit messages
- Create comprehensive documentation
- Implement proper error handling

#### Testing Requirements
- Maintain >80% test coverage
- Write tests before implementation (TDD)
- Create integration tests for workflows
- Perform cross-browser testing
- Validate accessibility compliance

#### Performance Benchmarks
- API response time <500ms
- Page load time <2 seconds
- Database query optimization
- Bundle size monitoring
- Memory usage optimization

#### Security Checklist
- Input validation and sanitization
- Authentication and authorization
- SQL injection prevention
- XSS protection
- Secure data transmission

### Risk Mitigation Tasks

#### Technical Risks
- Database migration testing
- API integration reliability
- Performance bottleneck identification
- Security vulnerability assessment
- Scalability planning

#### Business Risks
- Feature scope management
- Timeline adherence
- Budget tracking
- User acceptance testing
- Change management

### Success Metrics Tracking

#### Development Metrics
- Sprint velocity tracking
- Bug fix rate monitoring
- Code quality metrics
- Test coverage reporting
- Performance benchmark results

#### Business Metrics
- User adoption rates
- Feature usage analytics
- Customer satisfaction scores
- System uptime monitoring
- Support ticket resolution time
