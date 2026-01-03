import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // ============================================
  // 1. CREATE DEMO COMPANY
  // ============================================
  console.log('📦 Creating company...');
  const company = await prisma.company.upsert({
    where: { domain: 'demo.omni.com' },
    create: {
      name: 'Demo Company Inc.',
      domain: 'demo.omni.com',
      active: true,
    },
    update: {},
  });
  console.log(`✅ Company: ${company.name} (${company.id})`);

  // ============================================
  // 2. CREATE USERS
  // ============================================
  console.log('\n👥 Creating users...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'admin@demo.omni.com' } },
    create: {
      companyId: company.id,
      email: 'admin@demo.omni.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'admin',
      active: true,
    },
    update: {},
  });
  console.log(`✅ Admin: ${admin.email}`);

  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'manager@demo.omni.com' } },
    create: {
      companyId: company.id,
      email: 'manager@demo.omni.com',
      passwordHash: managerPassword,
      name: 'Manager User',
      role: 'manager',
      active: true,
    },
    update: {},
  });
  console.log(`✅ Manager: ${manager.email}`);

  const agentPassword = await bcrypt.hash('agent123', 10);
  const agent = await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'agent@demo.omni.com' } },
    create: {
      companyId: company.id,
      email: 'agent@demo.omni.com',
      passwordHash: agentPassword,
      name: 'Agent User',
      role: 'agent',
      active: true,
    },
    update: {},
  });
  console.log(`✅ Agent: ${agent.email}`);

  // ============================================
  // 3. COMPANY SETTINGS
  // ============================================
  console.log('\n⚙️  Creating company settings...');
  await prisma.companySettings.upsert({
    where: { companyId: company.id },
    create: {
      companyId: company.id,
      industry: 'technology',
      enabledModules: ['auth', 'chat', 'crm', 'erp', 'knowledge', 'ai', 'omnichannel', 'learning'],
      customSkillCategories: ['technical', 'soft_skills', 'leadership', 'sales'],
      zettelAutoGeneration: { enabled: true, minImportance: 0.7 },
      aiSettings: { provider: 'ollama', model: 'llama2', maxTokens: 1000 },
    },
    update: {},
  });
  console.log('✅ Company settings created');

  // ============================================
  // 4. CREATE SKILLS
  // ============================================
  console.log('\n📚 Creating skills...');
  const skillsData = [
    { name: 'TypeScript', category: 'technical', description: 'TypeScript programming' },
    { name: 'React', category: 'technical', description: 'React.js framework' },
    { name: 'Node.js', category: 'technical', description: 'Node.js backend' },
    { name: 'Python', category: 'technical', description: 'Python programming' },
    { name: 'SQL', category: 'technical', description: 'SQL databases' },
    { name: 'Communication', category: 'soft_skills', description: 'Effective communication' },
    { name: 'Leadership', category: 'leadership', description: 'Team leadership' },
    { name: 'Problem Solving', category: 'soft_skills', description: 'Analytical thinking' },
    { name: 'Sales', category: 'sales', description: 'Sales techniques' },
    { name: 'Customer Success', category: 'sales', description: 'CS best practices' },
  ];

  const skills: any = {};
  for (const skillData of skillsData) {
    skills[skillData.name] = await prisma.skill.upsert({
      where: { companyId_name: { companyId: company.id, name: skillData.name } },
      create: { companyId: company.id, ...skillData },
      update: {},
    });
  }
  console.log(`✅ ${Object.keys(skills).length} skills created`);

  // ============================================
  // 5. EMPLOYEE SKILLS
  // ============================================
  console.log('\n🎯 Assigning skills to users...');
  await prisma.employeeSkill.createMany({
    data: [
      { userId: admin.id, skillId: skills['TypeScript'].id, proficiency: 5 },
      { userId: admin.id, skillId: skills['React'].id, proficiency: 4 },
      { userId: admin.id, skillId: skills['Leadership'].id, proficiency: 5 },
      { userId: manager.id, skillId: skills['Communication'].id, proficiency: 4 },
      { userId: manager.id, skillId: skills['Leadership'].id, proficiency: 3 },
      { userId: agent.id, skillId: skills['Customer Success'].id, proficiency: 4 },
      { userId: agent.id, skillId: skills['Sales'].id, proficiency: 3 },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Skills assigned');

  // ============================================
  // 6. LEARNING PATHS
  // ============================================
  console.log('\n🎓 Creating learning paths...');
  const learningPath = await prisma.learningPath.create({
    data: {
      companyId: company.id,
      title: 'Full Stack Developer Track',
      description: 'Become a full-stack developer with TypeScript and React',
      category: 'technical',
      difficulty: 'intermediate',
      estimatedHours: 80,
      targetSkills: [skills['TypeScript'].id, skills['React'].id, skills['Node.js'].id],
      createdBy: admin.id,
      items: {
        create: [
          {
            order: 1,
            contentType: 'video',
            title: 'TypeScript Fundamentals',
            description: 'Learn TypeScript basics',
            estimatedMinutes: 180,
            required: true,
          },
          {
            order: 2,
            contentType: 'article',
            title: 'React Hooks Deep Dive',
            description: 'Master React hooks',
            estimatedMinutes: 120,
            required: true,
          },
          {
            order: 3,
            contentType: 'project',
            title: 'Build a REST API',
            description: 'Create a Node.js REST API',
            estimatedMinutes: 300,
            required: true,
          },
        ],
      },
    },
  });
  console.log(`✅ Learning path: ${learningPath.title}`);

  // ============================================
  // 7. CRM - CONTACTS
  // ============================================
  console.log('\n👥 Creating CRM contacts...');
  const contacts = await prisma.contact.createMany({
    data: [
      {
        companyId: company.id,
        name: 'John Smith',
        email: 'john.smith@acmecorp.com',
        phone: '+1-555-0101',
        companyName: 'Acme Corp',
        position: 'CTO',
        ownerId: manager.id,
        leadStatus: 'qualified',
        rating: 4,
        tags: ['enterprise', 'tech'],
      },
      {
        companyId: company.id,
        name: 'Sarah Johnson',
        email: 'sarah@techstart.io',
        phone: '+1-555-0102',
        companyName: 'TechStart',
        position: 'CEO',
        ownerId: agent.id,
        leadStatus: 'new',
        rating: 5,
        tags: ['startup'],
      },
      {
        companyId: company.id,
        name: 'Mike Wilson',
        email: 'mike.wilson@bigco.com',
        phone: '+1-555-0103',
        companyName: 'BigCo Inc',
        position: 'VP Sales',
        ownerId: manager.id,
        leadStatus: 'contacted',
        rating: 3,
        tags: ['enterprise'],
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ ${contacts.count} contacts created`);

  // Get contacts for deals
  const contactList = await prisma.contact.findMany({
    where: { companyId: company.id },
    take: 3,
  });

  // ============================================
  // 8. CRM - DEALS
  // ============================================
  console.log('\n💼 Creating deals...');
  if (contactList.length > 0) {
    await prisma.deal.create({
      data: {
        companyId: company.id,
        title: 'Enterprise Plan - Acme Corp',
        contactId: contactList[0].id,
        value: 50000,
        currency: 'USD',
        stage: 'proposal',
        probability: 70,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ownerId: manager.id,
        products: {
          create: [
            {
              productId: 'product-1',
              productName: 'Enterprise License',
              quantity: 100,
              unitPrice: 500,
              total: 50000,
            },
          ],
        },
      },
    });
    console.log('✅ 1 deal created');
  }

  // ============================================
  // 9. ERP - PRODUCTS
  // ============================================
  console.log('\n📦 Creating products...');
  const products = await prisma.product.createMany({
    data: [
      {
        companyId: company.id,
        sku: 'PROD-001',
        name: 'Enterprise License',
        description: 'Annual enterprise software license',
        category: 'Software',
        unitPrice: 500,
        costPrice: 200,
        stock: 1000,
        minStock: 100,
        isActive: true,
      },
      {
        companyId: company.id,
        sku: 'PROD-002',
        name: 'Professional Support',
        description: '24/7 professional support package',
        category: 'Services',
        unitPrice: 200,
        costPrice: 80,
        stock: 500,
        minStock: 50,
        isActive: true,
      },
      {
        companyId: company.id,
        sku: 'PROD-003',
        name: 'Training Package',
        description: 'Onboarding training for teams',
        category: 'Services',
        unitPrice: 1000,
        costPrice: 300,
        stock: 100,
        minStock: 10,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ ${products.count} products created`);

  // ============================================
  // 10. CHAT - CHANNELS
  // ============================================
  console.log('\n💬 Creating chat channels...');
  const channel = await prisma.channel.create({
    data: {
      companyId: company.id,
      name: 'general',
      description: 'General discussion channel',
      type: 'public',
      createdBy: admin.id,
      members: {
        create: [
          { companyId: company.id, userId: admin.id, role: 'admin' },
          { companyId: company.id, userId: manager.id, role: 'member' },
          { companyId: company.id, userId: agent.id, role: 'member' },
        ],
      },
    },
  });
  console.log(`✅ Channel created: ${channel.name}`);

  // ============================================
  // 11. CHAT - MESSAGES
  // ============================================
  console.log('\n📨 Creating sample messages...');
  await prisma.message.createMany({
    data: [
      {
        companyId: company.id,
        channelId: channel.id,
        authorId: admin.id,
        content: 'Welcome to OMNI Platform! 🚀',
        status: 'sent',
      },
      {
        companyId: company.id,
        channelId: channel.id,
        authorId: manager.id,
        content: 'Excited to start using this!',
        status: 'sent',
      },
      {
        companyId: company.id,
        channelId: channel.id,
        authorId: agent.id,
        content: 'Looking forward to the new features',
        status: 'sent',
      },
    ],
  });
  console.log('✅ 3 messages created');

  // ============================================
  // 12. KNOWLEDGE NODES
  // ============================================
  console.log('\n🧠 Creating knowledge nodes...');
  const node1 = await prisma.knowledgeNode.create({
    data: {
      companyId: company.id,
      title: 'OMNI Platform Architecture',
      content: 'The OMNI Platform uses a modular, multi-tenant architecture with PostgreSQL, Redis, and TypeScript.',
      nodeType: 'documentation',
      tags: ['architecture', 'technical'],
      importanceScore: 0.9,
      createdById: admin.id,
    },
  });

  const node2 = await prisma.knowledgeNode.create({
    data: {
      companyId: company.id,
      title: 'Module System',
      content: 'Each module in OMNI Platform is self-contained and can be enabled/disabled per tenant.',
      nodeType: 'documentation',
      tags: ['modules', 'architecture'],
      importanceScore: 0.8,
      createdById: admin.id,
    },
  });

  // Link nodes
  await prisma.knowledgeLink.create({
    data: {
      companyId: company.id,
      sourceId: node1.id,
      targetId: node2.id,
      linkType: 'related',
      strength: 0.9,
    },
  });
  console.log('✅ 2 knowledge nodes + 1 link created');

  // ============================================
  // 13. NOTIFICATIONS
  // ============================================
  console.log('\n🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        companyId: company.id,
        userId: admin.id,
        type: 'system',
        title: 'Welcome to OMNI Platform',
        body: 'Your account has been created successfully',
      },
      {
        companyId: company.id,
        userId: manager.id,
        type: 'deal',
        title: 'New deal assigned',
        body: 'Enterprise Plan - Acme Corp has been assigned to you',
      },
    ],
  });
  console.log('✅ 2 notifications created');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n');
  console.log('='.repeat(50));
  console.log('✨ SEED COMPLETE! ✨');
  console.log('='.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   • 1 Company: ${company.name}`);
  console.log(`   • 3 Users: admin, manager, agent`);
  console.log(`   • 10 Skills`);
  console.log(`   • 1 Learning Path with 3 items`);
  console.log(`   • 3 Contacts`);
  console.log(`   • 1 Deal`);
  console.log(`   • 3 Products`);
  console.log(`   • 1 Chat channel with 3 messages`);
  console.log(`   • 2 Knowledge nodes`);
  console.log(`   • 2 Notifications`);
  console.log('\n🔐 Test Credentials:');
  console.log('   Admin:   admin@demo.omni.com / admin123');
  console.log('   Manager: manager@demo.omni.com / manager123');
  console.log('   Agent:   agent@demo.omni.com / agent123');
  console.log('\n🚀 Ready to start: npm run dev');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
