import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017?directConnection=true';
const DB_NAME = process.env.MONGODB_DB_NAME || 'janus';

async function seedDemoData() {
  console.log('🌱 Seeding demo data...\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.collection('events').deleteMany({});
    await db.collection('session_projections').deleteMany({});
    await db.collection('templates').deleteMany({});
    await db.collection('companies').deleteMany({});
    await db.collection('licensePools').deleteMany({});
    await db.collection('participants').deleteMany({});
    await db.collection('auditLogs').deleteMany({});

    console.log('✅ Data cleared\n');

    // Seed Companies
    console.log('🏢 Creating companies...');
    const companies = [
      {
        companyId: 'demo-org-1',
        name: 'Acme Corporation',
        industry: 'Technology',
        size: 'large',
        users: [
          { userId: 'user-1', email: 'admin@acme.com', role: 'admin', name: 'Alice Admin' },
          { userId: 'user-2', email: 'rep@acme.com', role: 'representative', name: 'Bob Representative' }
        ],
        branding: {
          logo: 'https://via.placeholder.com/150/0066cc/FFFFFF?text=ACME',
          primaryColor: '#0066cc',
          secondaryColor: '#FF6B6B'
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        companyId: 'demo-org-2',
        name: 'TechStart Solutions',
        industry: 'Consulting',
        size: 'medium',
        users: [
          { userId: 'user-3', email: 'contact@techstart.com', role: 'admin', name: 'Charlie Manager' }
        ],
        branding: {
          logo: 'https://via.placeholder.com/150/10b981/FFFFFF?text=TS',
          primaryColor: '#10b981',
          secondaryColor: '#3b82f6'
        },
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20')
      },
      {
        companyId: 'demo-org-3',
        name: 'Global Innovations Inc',
        industry: 'Manufacturing',
        size: 'large',
        users: [
          { userId: 'user-4', email: 'hr@globalinnovations.com', role: 'admin', name: 'Diana HR' },
          { userId: 'user-5', email: 'manager@globalinnovations.com', role: 'representative', name: 'Edward Manager' }
        ],
        branding: {
          logo: 'https://via.placeholder.com/150/f59e0b/FFFFFF?text=GI',
          primaryColor: '#f59e0b',
          secondaryColor: '#ef4444'
        },
        createdAt: new Date('2023-11-10'),
        updatedAt: new Date('2023-11-10')
      }
    ];

    await db.collection('companies').insertMany(companies);
    console.log(`✅ Created ${companies.length} companies\n`);

    // Seed Templates
    console.log('📚 Creating templates...');
    const templates = [
      {
        templateId: 'template-001',
        name: 'Cybersecurity Assessment',
        description: 'Comprehensive cybersecurity evaluation',
        version: '1.0',
        published: true,
        linkedProductId: 'prod-cyber-basic',
        pages: [
          { pageId: 'page-1', title: 'Network Security', questions: 15 },
          { pageId: 'page-2', title: 'Access Control', questions: 12 },
          { pageId: 'page-3', title: 'Data Protection', questions: 18 }
        ],
        totalPages: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        templateId: 'template-002',
        name: 'GDPR Compliance Check',
        description: 'GDPR compliance assessment',
        version: '2.1',
        published: true,
        linkedProductId: 'prod-gdpr-standard',
        pages: [
          { pageId: 'page-1', title: 'Data Processing', questions: 20 },
          { pageId: 'page-2', title: 'Privacy Rights', questions: 16 },
          { pageId: 'page-3', title: 'Security Measures', questions: 14 },
          { pageId: 'page-4', title: 'Documentation', questions: 10 }
        ],
        totalPages: 4,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        templateId: 'template-003',
        name: 'ISO 27001 Readiness',
        description: 'ISO 27001 certification readiness check',
        version: '1.5',
        published: true,
        linkedProductId: 'prod-iso-premium',
        pages: [
          { pageId: 'page-1', title: 'Context of Organization', questions: 8 },
          { pageId: 'page-2', title: 'Leadership', questions: 10 },
          { pageId: 'page-3', title: 'Planning', questions: 12 },
          { pageId: 'page-4', title: 'Support', questions: 15 },
          { pageId: 'page-5', title: 'Operations', questions: 20 }
        ],
        totalPages: 5,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2023-12-01')
      },
      {
        templateId: 'template-004',
        name: 'Technical Skills Assessment',
        description: 'Comprehensive technical skills evaluation for IT professionals',
        version: '1.0',
        published: true,
        linkedProductId: 'prod-tech-skills',
        pages: [
          { pageId: 'page-1', title: 'Programming Fundamentals', questions: 15 },
          { pageId: 'page-2', title: 'System Architecture', questions: 12 },
          { pageId: 'page-3', title: 'Database Management', questions: 10 },
          { pageId: 'page-4', title: 'Cloud Technologies', questions: 13 }
        ],
        totalPages: 4,
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15')
      },
      {
        templateId: 'template-005',
        name: 'Sales Aptitude Evaluation',
        description: 'Sales skills and aptitude assessment for sales professionals',
        version: '1.2',
        published: true,
        linkedProductId: 'prod-sales-eval',
        pages: [
          { pageId: 'page-1', title: 'Communication Skills', questions: 12 },
          { pageId: 'page-2', title: 'Customer Relationship', questions: 10 },
          { pageId: 'page-3', title: 'Negotiation Techniques', questions: 8 }
        ],
        totalPages: 3,
        createdAt: new Date('2024-04-20'),
        updatedAt: new Date('2024-04-20')
      }
    ];

    await db.collection('templates').insertMany(templates);
    console.log(`✅ Created ${templates.length} templates\n`);

    // Seed License Pools
    console.log('🎫 Creating license pools...');
    const licensePools = [
      {
        poolId: 'pool-001',
        organizationId: 'demo-org-1',
        templateId: 'template-001',
        totalLicenses: 100,
        availableLicenses: 73,
        consumedLicenses: 27,
        warningThreshold: 75,
        isWarning: false,
        isDepleted: false,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      },
      {
        poolId: 'pool-002',
        organizationId: 'demo-org-1',
        templateId: 'template-002',
        totalLicenses: 50,
        availableLicenses: 12,
        consumedLicenses: 38,
        warningThreshold: 75,
        isWarning: true,
        isDepleted: false,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date()
      },
      {
        poolId: 'pool-003',
        organizationId: 'demo-org-2',
        templateId: 'template-001',
        totalLicenses: 30,
        availableLicenses: 2,
        consumedLicenses: 28,
        warningThreshold: 75,
        isWarning: true,
        isDepleted: false,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date()
      },
      {
        poolId: 'pool-004',
        organizationId: 'demo-org-3',
        templateId: 'template-003',
        totalLicenses: 200,
        availableLicenses: 145,
        consumedLicenses: 55,
        warningThreshold: 75,
        isWarning: false,
        isDepleted: false,
        createdAt: new Date('2023-11-15'),
        updatedAt: new Date()
      }
    ];

    await db.collection('licensePools').insertMany(licensePools);
    console.log(`✅ Created ${licensePools.length} license pools\n`);

    // Seed Participants
    console.log('👥 Creating participants...');
    const participants = [
      {
        participantId: 'part-001',
        email: 'john.doe@acme.com',
        firstName: 'John',
        lastName: 'Doe',
        organizationId: 'demo-org-1',
        metadata: { department: 'IT Security', level: 'Senior' },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        participantId: 'part-002',
        email: 'jane.smith@acme.com',
        firstName: 'Jane',
        lastName: 'Smith',
        organizationId: 'demo-org-1',
        metadata: { department: 'Compliance', level: 'Manager' },
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      },
      {
        participantId: 'part-003',
        email: 'test@techstart.com',
        firstName: 'Test',
        lastName: 'User',
        organizationId: 'demo-org-2',
        metadata: { department: 'Operations', level: 'Staff' },
        createdAt: new Date('2024-02-22'),
        updatedAt: new Date('2024-02-22')
      },
      {
        participantId: 'part-004',
        email: 'mary.jones@globalinnovations.com',
        firstName: 'Mary',
        lastName: 'Jones',
        organizationId: 'demo-org-3',
        metadata: { department: 'Quality Assurance', level: 'Director' },
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05')
      },
      {
        participantId: 'part-005',
        email: 'sophie.martin@acme.com',
        firstName: 'Sophie',
        lastName: 'Martin',
        organizationId: 'demo-org-1',
        metadata: { department: 'IT Security', level: 'Senior' },
        createdAt: new Date('2024-04-10'),
        updatedAt: new Date('2024-04-10')
      },
      {
        participantId: 'part-006',
        email: 'lucas.bernard@techstart.com',
        firstName: 'Lucas',
        lastName: 'Bernard',
        organizationId: 'demo-org-2',
        metadata: { department: 'IT', level: 'Manager' },
        createdAt: new Date('2024-05-15'),
        updatedAt: new Date('2024-05-15')
      },
      {
        participantId: 'part-007',
        email: 'emma.wilson@globalinnovations.com',
        firstName: 'Emma',
        lastName: 'Wilson',
        organizationId: 'demo-org-3',
        metadata: { department: 'Security', level: 'Lead' },
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-01')
      },
      {
        participantId: 'part-008',
        email: 'michael.chen@acme.com',
        firstName: 'Michael',
        lastName: 'Chen',
        organizationId: 'demo-org-1',
        metadata: { department: 'Compliance', level: 'Analyst' },
        createdAt: new Date('2024-07-20'),
        updatedAt: new Date('2024-07-20')
      },
      {
        participantId: 'part-009',
        email: 'olivia.garcia@techstart.com',
        firstName: 'Olivia',
        lastName: 'Garcia',
        organizationId: 'demo-org-2',
        metadata: { department: 'Operations', level: 'Coordinator' },
        createdAt: new Date('2024-08-05'),
        updatedAt: new Date('2024-08-05')
      },
      {
        participantId: 'part-010',
        email: 'william.brown@globalinnovations.com',
        firstName: 'William',
        lastName: 'Brown',
        organizationId: 'demo-org-3',
        metadata: { department: 'IT', level: 'Specialist' },
        createdAt: new Date('2024-09-10'),
        updatedAt: new Date('2024-09-10')
      },
      {
        participantId: 'part-011',
        email: 'ava.taylor@acme.com',
        firstName: 'Ava',
        lastName: 'Taylor',
        organizationId: 'demo-org-1',
        metadata: { department: 'Security', level: 'Engineer' },
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date('2024-10-01')
      },
      {
        participantId: 'part-012',
        email: 'james.anderson@techstart.com',
        firstName: 'James',
        lastName: 'Anderson',
        organizationId: 'demo-org-2',
        metadata: { department: 'Compliance', level: 'Officer' },
        createdAt: new Date('2024-11-15'),
        updatedAt: new Date('2024-11-15')
      },
      {
        participantId: 'part-013',
        email: 'isabella.thomas@globalinnovations.com',
        firstName: 'Isabella',
        lastName: 'Thomas',
        organizationId: 'demo-org-3',
        metadata: { department: 'Audit', level: 'Manager' },
        createdAt: new Date('2024-12-05'),
        updatedAt: new Date('2024-12-05')
      },
      {
        participantId: 'part-014',
        email: 'ethan.white@acme.com',
        firstName: 'Ethan',
        lastName: 'White',
        organizationId: 'demo-org-1',
        metadata: { department: 'Risk Management', level: 'Analyst' },
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10')
      },
      {
        participantId: 'part-015',
        email: 'mia.harris@techstart.com',
        firstName: 'Mia',
        lastName: 'Harris',
        organizationId: 'demo-org-2',
        metadata: { department: 'Data Privacy', level: 'Specialist' },
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01')
      }
    ];

    await db.collection('participants').insertMany(participants);
    console.log(`✅ Created ${participants.length} participants\n`);

    // Seed Sessions
    console.log('📋 Creating assessment sessions...');
    const now = new Date();
    const sessions = [];

    // Helper function to create realistic session data
    const createSession = (id: number, orgId: string, templateId: string, email: string, status: string, completedPages: number, totalPages: number, daysAgo: number) => {
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const startedAt = status !== 'pending' ? new Date(createdAt.getTime() + 10 * 60 * 1000) : undefined;
      const completedAt = status === 'completed' ? new Date(startedAt!.getTime() + 90 * 60 * 1000) : undefined;

      const sessionId = `session-${String(id).padStart(3, '0')}`;

      // Generate realistic responses for completed sessions (template-001 has 9 questions)
      const generateResponses = () => {
        if (status !== 'completed') return {};
        return {
          q1: Math.floor(Math.random() * 3) + 4, // Scale 4-6
          q2: String(Math.floor(Math.random() * 4) + 6), // String "6"-"9"
          q3: [`q3-opt${Math.floor(Math.random() * 3) + 1}`], // Array with option
          q4: Math.floor(Math.random() * 3) + 4, // Scale 4-6
          q5: String(Math.floor(Math.random() * 4) + 5), // String "5"-"8"
          q6: ['Excellente capacité d\'analyse', 'Leadership naturel', 'Très communicatif'][Math.floor(Math.random() * 3)], // Text
          q7: Math.floor(Math.random() * 3) + 4, // Scale 4-6
          q8: String(Math.floor(Math.random() * 3) + 7), // String "7"-"9"
          q9: [`q9-opt${Math.floor(Math.random() * 2) + 1}`] // Array with option
        };
      };

      return {
        sessionId,
        organizationId: orgId,
        sessionToken: `sess_seed_${sessionId.substring(8)}_${id}${Date.now().toString(36)}`,
        templateId: templateId,
        participantEmail: email,
        consultantId: `consultant-${Math.floor(Math.random() * 3) + 1}`,
        status,
        currentPage: completedPages,
        totalPages,
        responses: generateResponses(),
        completionPercentage: Math.round((completedPages / totalPages) * 100),
        expiresAt: new Date(createdAt.getTime() + 72 * 60 * 60 * 1000),
        lastActivityAt: completedAt || startedAt || createdAt,
        version: completedPages > 0 ? completedPages * 3 : 1,
        createdAt,
        startedAt,
        completedAt,
        updatedAt: completedAt || startedAt || createdAt
      };
    };

    // 12 Completed sessions (40%)
    sessions.push(createSession(1, 'demo-org-1', 'template-001', 'john.doe@acme.com', 'completed', 3, 3, 30));
    sessions.push(createSession(2, 'demo-org-1', 'template-002', 'jane.smith@acme.com', 'completed', 4, 4, 25));
    sessions.push(createSession(3, 'demo-org-2', 'template-001', 'test@techstart.com', 'completed', 3, 3, 20));
    sessions.push(createSession(4, 'demo-org-3', 'template-003', 'mary.jones@globalinnovations.com', 'completed', 5, 5, 15));
    sessions.push(createSession(5, 'demo-org-1', 'template-001', 'sophie.martin@acme.com', 'completed', 3, 3, 12));
    sessions.push(createSession(6, 'demo-org-2', 'template-002', 'lucas.bernard@techstart.com', 'completed', 4, 4, 10));
    sessions.push(createSession(7, 'demo-org-3', 'template-001', 'emma.wilson@globalinnovations.com', 'completed', 3, 3, 8));
    sessions.push(createSession(8, 'demo-org-1', 'template-003', 'michael.chen@acme.com', 'completed', 5, 5, 6));
    sessions.push(createSession(9, 'demo-org-2', 'template-001', 'olivia.garcia@techstart.com', 'completed', 3, 3, 5));
    sessions.push(createSession(10, 'demo-org-3', 'template-002', 'william.brown@globalinnovations.com', 'completed', 4, 4, 4));
    sessions.push(createSession(11, 'demo-org-1', 'template-001', 'ava.taylor@acme.com', 'completed', 3, 3, 3));
    sessions.push(createSession(12, 'demo-org-2', 'template-003', 'james.anderson@techstart.com', 'completed', 5, 5, 2));

    // 8 Active sessions (27%)
    sessions.push(createSession(13, 'demo-org-1', 'template-001', 'ethan.white@acme.com', 'active', 2, 3, 1));
    sessions.push(createSession(14, 'demo-org-2', 'template-002', 'mia.harris@techstart.com', 'active', 2, 4, 1));
    sessions.push(createSession(15, 'demo-org-3', 'template-003', 'isabella.thomas@globalinnovations.com', 'active', 3, 5, 0));
    sessions.push(createSession(16, 'demo-org-1', 'template-002', 'john.doe@acme.com', 'active', 1, 4, 0));
    sessions.push(createSession(17, 'demo-org-2', 'template-001', 'lucas.bernard@techstart.com', 'active', 1, 3, 0));
    sessions.push(createSession(18, 'demo-org-3', 'template-001', 'mary.jones@globalinnovations.com', 'active', 2, 3, 1));
    sessions.push(createSession(19, 'demo-org-1', 'template-003', 'sophie.martin@acme.com', 'active', 4, 5, 0));
    sessions.push(createSession(20, 'demo-org-2', 'template-002', 'test@techstart.com', 'active', 3, 4, 1));

    // 7 Pending sessions (23%)
    sessions.push(createSession(21, 'demo-org-1', 'template-001', 'jane.smith@acme.com', 'pending', 0, 3, 0));
    sessions.push(createSession(22, 'demo-org-2', 'template-003', 'olivia.garcia@techstart.com', 'pending', 0, 5, 1));
    sessions.push(createSession(23, 'demo-org-3', 'template-002', 'emma.wilson@globalinnovations.com', 'pending', 0, 4, 0));
    sessions.push(createSession(24, 'demo-org-1', 'template-002', 'michael.chen@acme.com', 'pending', 0, 4, 2));
    sessions.push(createSession(25, 'demo-org-2', 'template-001', 'james.anderson@techstart.com', 'pending', 0, 3, 1));
    sessions.push(createSession(26, 'demo-org-3', 'template-003', 'william.brown@globalinnovations.com', 'pending', 0, 5, 0));
    sessions.push(createSession(27, 'demo-org-1', 'template-001', 'ava.taylor@acme.com', 'pending', 0, 3, 1));

    // 2 Expired sessions (7%)
    sessions.push({
      sessionId: 'session-028',
      organizationId: 'demo-org-2',
      templateId: 'template-002',
      participantEmail: 'expired-1@techstart.com',
      consultantId: 'consultant-002',
      status: 'expired',
      currentPage: 0,
      totalPages: 4,
      answers: {},
      completionPercentage: 0,
      expirationDate: new Date('2026-01-30T23:59:59Z'),
      createdAt: new Date('2025-12-30T10:00:00Z'),
      updatedAt: new Date('2026-01-30T23:59:59Z')
    });

    sessions.push({
      sessionId: 'session-029',
      organizationId: 'demo-org-3',
      templateId: 'template-001',
      participantEmail: 'expired-2@globalinnovations.com',
      consultantId: 'consultant-001',
      status: 'expired',
      currentPage: 1,
      totalPages: 3,
      answers: { 'page-1': { q1: 'yes' } },
      completionPercentage: 33,
      expirationDate: new Date('2026-01-28T23:59:59Z'),
      createdAt: new Date('2025-12-28T14:00:00Z'),
      startedAt: new Date('2025-12-28T14:15:00Z'),
      updatedAt: new Date('2026-01-28T23:59:59Z')
    });

    // 1 Suspended session (3%)
    sessions.push({
      sessionId: 'session-030',
      organizationId: 'demo-org-1',
      templateId: 'template-003',
      participantEmail: 'suspended@acme.com',
      consultantId: 'consultant-003',
      status: 'suspended',
      currentPage: 2,
      totalPages: 5,
      answers: { 'page-1': { q1: 'yes' }, 'page-2': { q1: 'no' } },
      completionPercentage: 40,
      suspensionReason: 'Compliance review required',
      createdAt: new Date('2026-01-20T10:00:00Z'),
      startedAt: new Date('2026-01-20T10:30:00Z'),
      suspendedAt: new Date('2026-02-03T14:00:00Z'),
      updatedAt: new Date('2026-02-03T14:00:00Z')
    });

    await db.collection('session_projections').insertMany(sessions);
    console.log(`✅ Created ${sessions.length} assessment sessions\n`);

    // Seed Audit Logs
    console.log('📝 Creating audit logs...');
    const auditLogs = [];

    for (let i = 0; i < 50; i++) {
      const eventTypes = ['SessionCreated', 'SessionStarted', 'PageSubmitted', 'SessionCompleted', 'SessionSuspended', 'LicenseConsumed', 'LicenseReleased'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const sessionIds = sessions.map(s => s.sessionId);

      auditLogs.push({
        eventId: `event-${String(i + 1).padStart(3, '0')}`,
        eventType,
        aggregateId: sessionIds[Math.floor(Math.random() * sessionIds.length)],
        aggregateType: 'Session',
        payload: { action: eventType, timestamp: new Date() },
        metadata: {
          userId: `user-${Math.floor(Math.random() * 5) + 1}`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
        },
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
        version: 1
      });
    }

    await db.collection('auditLogs').insertMany(auditLogs);
    console.log(`✅ Created ${auditLogs.length} audit log entries\n`);

    console.log('✨ Demo data seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Companies: ${companies.length}`);
    console.log(`   - Templates: ${templates.length}`);
    console.log(`   - License Pools: ${licensePools.length}`);
    console.log(`   - Participants: ${participants.length}`);
    console.log(`   - Sessions: ${sessions.length}`);
    console.log(`   - Audit Logs: ${auditLogs.length}`);
    console.log('\n🎉 Your demo environment is ready!\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedDemoData();
