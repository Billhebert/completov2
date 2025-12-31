import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. COMPANY & USERS
  // ============================================

  const company = await prisma.company.upsert({
    where: { domain: 'demo.omniplatform.com' },
    update: {},
    create: {
      name: 'Demo Company',
      domain: 'demo.omniplatform.com',
      active: true,
    },
  });

  console.log('✅ Company created:', company.name);

  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);

  const admin = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: 'admin@demo.com'
      }
    },
    update: {},
    create: {
      companyId: company.id,
      email: 'admin@demo.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'company_admin',
      active: true,
    },
  });

  const agent = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: 'agent@demo.com'
      }
    },
    update: {},
    create: {
      companyId: company.id,
      email: 'agent@demo.com',
      passwordHash: agentPassword,
      name: 'Agent User',
      role: 'agent',
      active: true,
    },
  });

  console.log('✅ Users created');

  // ============================================
  // 2. COMPANY POLICY (Gatekeeper)
  // ============================================

  await prisma.companyPolicy.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      maxAutonomy: {
        viewer: {
          create_zettel: 'SUGGEST',
          send_notification: 'BLOCK',
          send_external_message: 'BLOCK',
          create_reminder: 'SUGGEST'
        },
        agent: {
          create_zettel: 'EXECUTE',
          send_notification: 'SUGGEST',
          send_external_message: 'SUGGEST',
          create_reminder: 'EXECUTE'
        },
        supervisor: {
          create_zettel: 'EXECUTE',
          send_notification: 'EXECUTE',
          send_external_message: 'EXECUTE',
          create_reminder: 'EXECUTE'
        },
        company_admin: {
          create_zettel: 'EXECUTE',
          send_notification: 'EXECUTE',
          send_external_message: 'EXECUTE',
          create_reminder: 'EXECUTE'
        }
      },
      forbidden: [
        'delete_contact_auto',
        'modify_invoice_auto',
        'send_external_message_auto'
      ],
      auditRules: {
        retention_days: 365,
        immutable: true,
        export_allowed: false
      },
      rateLimits: {
        ai_calls_per_user_per_day: 100,
        ai_calls_per_company_per_day: 1000,
        automations_per_hour: 50
      }
    },
  });

  console.log('✅ Company Policy created');

  // ============================================
  // 3. ATTENTION PROFILES
  // ============================================

  await prisma.attentionProfile.upsert({
    where: { userId: agent.id },
    update: {},
    create: {
      userId: agent.id,
      level: 'BALANCED',
      quietHours: [
        {
          start: '22:00',
          end: '08:00',
          days: [0, 6], // Domingo e Sábado
          timezone: 'America/Sao_Paulo'
        }
      ],
      channels: {
        email: true,
        push: true,
        inapp: true,
        whatsapp: false,
        sms: false
      },
      vipList: {
        contacts: [],
        projects: [],
        deals: []
      },
      autonomy: {
        create_zettel: 'EXECUTE',
        create_reminder: 'EXECUTE',
        send_notification: 'EXECUTE',
        send_external_message: 'SUGGEST'
      }
    },
  });

  console.log('✅ Attention Profiles created');

  // ============================================
  // 4. WORKFLOWS (Exemplos)
  // ============================================

  const workflow1 = await prisma.workflow.create({
    data: {
      companyId: company.id,
      name: 'Auto-criar Zettel de Negociação',
      description: 'Quando uma conversa é criada, cria automaticamente um Zettel de negociação',
      status: 'ACTIVE',
      createdBy: admin.id,
      definition: {
        nodes: [
          {
            id: 'trigger1',
            type: 'trigger',
            config: { event: 'conversation.created' }
          },
          {
            id: 'action1',
            type: 'action',
            config: {
              action: 'create_zettel',
              params: {
                title: 'Negociação - {{trigger.data.contactName}}',
                content: 'Negociação iniciada via {{trigger.data.channel}}',
                nodeType: 'NEGOTIATION',
                tags: ['auto-created', 'negotiation']
              }
            }
          }
        ],
        edges: [
          { source: 'trigger1', target: 'action1' }
        ]
      }
    },
  });

  const workflow2 = await prisma.workflow.create({
    data: {
      companyId: company.id,
      name: 'Lembrete de Follow-up',
      description: 'Cria lembrete de follow-up 2 dias após primeira interação',
      status: 'ACTIVE',
      createdBy: admin.id,
      definition: {
        nodes: [
          {
            id: 'trigger1',
            type: 'trigger',
            config: { event: 'interaction.created' }
          },
          {
            id: 'delay1',
            type: 'delay',
            config: { duration: 172800 } // 2 dias em segundos
          },
          {
            id: 'action1',
            type: 'action',
            config: {
              action: 'send_notification',
              params: {
                userId: '{{trigger.data.userId}}',
                title: 'Follow-up Pendente',
                body: 'Lembre-se de fazer follow-up com {{trigger.data.contactName}}',
                type: 'follow_up'
              }
            }
          }
        ],
        edges: [
          { source: 'trigger1', target: 'delay1' },
          { source: 'delay1', target: 'action1' }
        ]
      }
    },
  });

  console.log('✅ Workflows created:', workflow1.name, workflow2.name);

  // ============================================
  // 5. SIMULATION SCENARIOS
  // ============================================

  const scenario1 = await prisma.simulationScenario.create({
    data: {
      companyId: company.id,
      title: 'Objeção de Preço',
      description: 'Cliente acha o preço muito alto e está considerando concorrente',
      type: 'OBJECTION',
      difficulty: 3,
      estimatedDuration: 15,
      persona: {
        name: 'João Silva',
        role: 'Diretor de Compras',
        company: 'ABC Corp',
        personality: 'Cético, focado em ROI, muito analítico',
        objection: 'Preço muito alto comparado ao concorrente X',
        budget: 'R$ 50.000',
        timeline: 'Precisa decidir em 1 semana'
      },
      rubric: {
        criteria: [
          { name: 'Escuta Ativa', weight: 20, description: 'Demonstrou entender a objeção' },
          { name: 'Argumentação de Valor', weight: 30, description: 'Apresentou valor além do preço' },
          { name: 'Controle da Conversa', weight: 20, description: 'Manteve controle sem ser agressivo' },
          { name: 'Fechamento', weight: 30, description: 'Propôs próximos passos claros' }
        ],
        passing_score: 70
      }
    },
  });

  const scenario2 = await prisma.simulationScenario.create({
    data: {
      companyId: company.id,
      title: 'Cliente Insatisfeito',
      description: 'Cliente teve problema com o produto e está muito insatisfeito',
      type: 'CRISIS',
      difficulty: 4,
      estimatedDuration: 20,
      persona: {
        name: 'Maria Santos',
        role: 'CEO',
        company: 'XYZ Ltda',
        personality: 'Impaciente, direta, com alta expectativa',
        problem: 'Produto não funciona como prometido',
        impact: 'Perdeu R$ 100k em receita',
        emotion: 'Muito irritada, considerando cancelar contrato'
      },
      rubric: {
        criteria: [
          { name: 'Empatia', weight: 25, description: 'Demonstrou genuína empatia' },
          { name: 'Ownership', weight: 25, description: 'Assumiu responsabilidade' },
          { name: 'Solução Prática', weight: 30, description: 'Propôs solução concreta' },
          { name: 'Recuperação do Relacionamento', weight: 20, description: 'Restaurou confiança' }
        ],
        passing_score: 75
      }
    },
  });

  console.log('✅ Simulation Scenarios created');

  // ============================================
  // 6. KNOWLEDGE NODES (SOPs e Playbooks)
  // ============================================

  const sop1 = await prisma.knowledgeNode.create({
    data: {
      companyId: company.id,
      title: 'SOP - Como tratar objeção de preço',
      content: `# SOP: Tratamento de Objeção de Preço

## Passo 1: Entender a Objeção
- Não seja defensivo
- Pergunte: "O que especificamente te parece caro?"
- Identifique se é objeção real ou negociação

## Passo 2: Isolar a Objeção
- "Se o preço estivesse alinhado, seguiríamos em frente?"
- Confirme que preço é a única objeção

## Passo 3: Reforçar Valor
- Reitere benefícios específicos
- Use casos de sucesso
- Calcule ROI juntos

## Passo 4: Opções
- Ofereça plano alternativo
- Remova features não essenciais
- Estenda prazo de pagamento

## Passo 5: Fechar
- "Qual dessas opções faz mais sentido?"
- Agende próxima reunião
- Envie proposta atualizada`,
      nodeType: 'SOP',
      createdById: admin.id,
      visibility: 'COMPANY',
      truthStatus: 'SOURCE_OF_TRUTH',
      freshnessScore: 1.0,
      tags: ['sop', 'vendas', 'objeção', 'preço']
    },
  });

  const playbook1 = await prisma.knowledgeNode.create({
    data: {
      companyId: company.id,
      title: 'Playbook - Primeira Reunião com Cliente',
      content: `# Playbook: Primeira Reunião

## Antes da Reunião
- [ ] Pesquisar empresa no LinkedIn
- [ ] Ver últimos posts/notícias
- [ ] Entender setor e desafios comuns
- [ ] Preparar 3 perguntas personalizadas

## Agenda (45min)
1. **Quebra-gelo** (5min)
2. **Entender contexto** (15min)
   - Situação atual
   - Desafios principais
   - O que já tentaram
3. **Apresentar solução** (15min)
   - Focar nos desafios mencionados
   - Mostrar casos similares
4. **Próximos passos** (10min)
   - Alinhar timeline
   - Definir próxima reunião
   - Enviar material

## Perguntas Chave
- "Qual o maior desafio hoje?"
- "O que acontece se não resolverem isso?"
- "Quem mais está envolvido na decisão?"
- "Qual o processo de aprovação?"

## Follow-up
- Enviar resumo em até 2h
- Conectar no LinkedIn
- Agendar próxima reunião antes de sair`,
      nodeType: 'PLAYBOOK',
      createdById: admin.id,
      visibility: 'COMPANY',
      truthStatus: 'SOURCE_OF_TRUTH',
      freshnessScore: 1.0,
      tags: ['playbook', 'vendas', 'primeira-reunião']
    },
  });

  console.log('✅ Knowledge Nodes (SOPs/Playbooks) created');

  // ============================================
  // 7. SKILLS & LEARNING PATHS
  // ============================================

  const skill1 = await prisma.skill.create({
    data: {
      companyId: company.id,
      name: 'Tratamento de Objeções',
      category: 'COMMERCIAL',
      description: 'Habilidade de tratar objeções de forma eficaz'
    },
  });

  const skill2 = await prisma.skill.create({
    data: {
      companyId: company.id,
      name: 'Gestão de Crises',
      category: 'MANAGEMENT',
      description: 'Lidar com clientes insatisfeitos e situações críticas'
    },
  });

  const learningPath1 = await prisma.learningPath.create({
    data: {
      companyId: company.id,
      title: 'Vendas Consultivas',
      description: 'Aprenda a vender valor, não preço',
      category: 'COMMERCIAL',
      difficulty: 'intermediate',
      estimatedHours: 20,
      targetSkills: [skill1.id],
      createdBy: admin.id,
      items: {
        create: [
          {
            order: 1,
            contentType: 'article',
            title: 'Fundamentos de Vendas Consultivas',
            description: 'Entenda a diferença entre venda transacional e consultiva',
            contentUrl: 'https://example.com/article1',
            estimatedMinutes: 30,
            required: true
          },
          {
            order: 2,
            contentType: 'video',
            title: 'Como fazer perguntas poderosas',
            description: 'Técnicas de questionamento SPIN',
            contentUrl: 'https://example.com/video1',
            estimatedMinutes: 45,
            required: true
          },
          {
            order: 3,
            contentType: 'course',
            title: 'Tratamento de Objeções - Prática',
            description: 'Pratique com simulações reais',
            estimatedMinutes: 120,
            required: true
          }
        ]
      }
    },
  });

  console.log('✅ Skills & Learning Paths created');

  // ============================================
  // FIM
  // ============================================

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@demo.com / admin123');
  console.log('   Agent: agent@demo.com / agent123');
  console.log('');
  console.log('✅ Created:');
  console.log('   - 1 Company');
  console.log('   - 2 Users');
  console.log('   - 1 Company Policy');
  console.log('   - 1 Attention Profile');
  console.log('   - 2 Workflows');
  console.log('   - 2 Simulation Scenarios');
  console.log('   - 2 Knowledge Nodes (SOPs/Playbooks)');
  console.log('   - 2 Skills');
  console.log('   - 1 Learning Path');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
