// pt-BR Translation
export const ptBR = {
  // Common
  common: {
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    create: 'Criar',
    add: 'Adicionar',
    remove: 'Remover',
    search: 'Buscar',
    filter: 'Filtrar',
    loading: 'Carregando...',
    noData: 'Nenhum dado encontrado',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',
    info: 'Informação',
    confirm: 'Confirmar',
    yes: 'Sim',
    no: 'Não',
    close: 'Fechar',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
    submit: 'Enviar',
    reset: 'Resetar',
    clear: 'Limpar',
    all: 'Todos',
    none: 'Nenhum',
    other: 'Outro',
    actions: 'Ações',
    details: 'Detalhes',
    view: 'Visualizar',
    download: 'Baixar',
    upload: 'Enviar',
    export: 'Exportar',
    import: 'Importar',
    refresh: 'Atualizar',
    settings: 'Configurações',
    help: 'Ajuda',
    logout: 'Sair',
  },

  // Navigation
  nav: {
    dashboard: 'Painel',
    contacts: 'Contatos',
    conversations: 'Conversas',
    deals: 'Negócios',
    knowledge: 'Conhecimento',
    workflows: 'Fluxos de Trabalho',
    webhooks: 'Webhooks',
    fsm: 'Serviço de Campo',
    cmms: 'Manutenção',
    mcp: 'Servidores MCP',
    jobs: 'Vagas',
    services: 'Serviços',
    partnerships: 'Parcerias',
    rbac: 'Controle de Acesso',
    whatsapp: 'WhatsApp',
    aiChat: 'Chat IA',
    settings: 'Configurações',
  },

  // Auth
  auth: {
    login: 'Entrar',
    register: 'Cadastrar',
    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha',
    forgotPassword: 'Esqueceu a senha?',
    rememberMe: 'Lembrar-me',
    alreadyHaveAccount: 'Já tem uma conta?',
    dontHaveAccount: 'Não tem uma conta?',
    name: 'Nome',
    company: 'Empresa',
    loginSuccess: 'Login realizado com sucesso',
    registerSuccess: 'Cadastro realizado com sucesso',
    loginError: 'Erro ao fazer login',
    registerError: 'Erro ao cadastrar',
  },

  // Dashboard
  dashboard: {
    title: 'Painel de Controle',
    welcomeBack: 'Bem-vindo de volta',
    stats: {
      totalContacts: 'Total de Contatos',
      activeConversations: 'Conversas Ativas',
      openDeals: 'Negócios Abertos',
      dealsValue: 'Valor em Negócios',
      zettelsCreated: 'Zettels Criados',
      gapsIdentified: 'Gaps Identificados',
    },
    quickActions: {
      title: 'Ações Rápidas',
      newConversation: 'Nova Conversa',
      newContact: 'Novo Contato',
      newDeal: 'Novo Negócio',
      newZettel: 'Novo Zettel',
    },
  },

  // Contacts
  contacts: {
    title: 'Contatos',
    addContact: 'Adicionar Contato',
    editContact: 'Editar Contato',
    deleteContact: 'Excluir Contato',
    noContacts: 'Nenhum contato encontrado',
    getStarted: 'Comece criando seu primeiro contato',
    fields: {
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      company: 'Empresa',
      position: 'Cargo',
      tags: 'Tags',
      notes: 'Observações',
      isVIP: 'Contato VIP',
    },
    validation: {
      nameRequired: 'Nome é obrigatório',
      emailInvalid: 'E-mail inválido',
    },
    success: {
      created: 'Contato criado com sucesso',
      updated: 'Contato atualizado com sucesso',
      deleted: 'Contato excluído com sucesso',
    },
    error: {
      create: 'Erro ao criar contato',
      update: 'Erro ao atualizar contato',
      delete: 'Erro ao excluir contato',
    },
  },

  // Deals
  deals: {
    title: 'Negócios',
    newDeal: 'Novo Negócio',
    editDeal: 'Editar Negócio',
    noDeals: 'Nenhum negócio encontrado',
    getStarted: 'Comece criando seu primeiro negócio',
    fields: {
      title: 'Título',
      contact: 'Contato',
      value: 'Valor',
      currency: 'Moeda',
      stage: 'Etapa',
      expectedCloseDate: 'Data Prevista de Fechamento',
    },
    stages: {
      lead: 'Lead',
      qualification: 'Qualificação',
      proposal: 'Proposta',
      negotiation: 'Negociação',
      closedWon: 'Ganho',
      closedLost: 'Perdido',
    },
    validation: {
      titleRequired: 'Título é obrigatório',
      contactRequired: 'Por favor selecione um contato',
      valuePositive: 'O valor deve ser maior que 0',
    },
    success: {
      created: 'Negócio criado com sucesso',
      updated: 'Negócio atualizado com sucesso',
    },
    error: {
      create: 'Erro ao criar negócio',
      update: 'Erro ao atualizar negócio',
    },
  },

  // Conversations
  conversations: {
    title: 'Conversas',
    newConversation: 'Nova Conversa',
    noConversations: 'Nenhuma conversa encontrada',
    getStarted: 'Comece criando sua primeira conversa',
    fields: {
      contact: 'Contato',
      channel: 'Canal',
      status: 'Status',
      subject: 'Assunto',
      message: 'Mensagem',
    },
    channels: {
      whatsapp: 'WhatsApp',
      email: 'E-mail',
      sms: 'SMS',
      webChat: 'Chat Web',
    },
    status: {
      open: 'Aberta',
      pending: 'Pendente',
      closed: 'Fechada',
    },
    validation: {
      contactRequired: 'Por favor selecione um contato',
    },
    success: {
      created: 'Conversa criada com sucesso',
    },
    error: {
      create: 'Erro ao criar conversa',
    },
  },

  // Knowledge (Zettels)
  knowledge: {
    title: 'Base de Conhecimento',
    newZettel: 'Novo Zettel',
    editZettel: 'Editar Zettel',
    noZettels: 'Nenhum zettel encontrado',
    getStarted: 'Comece criando seu primeiro zettel',
    fields: {
      title: 'Título',
      content: 'Conteúdo',
      type: 'Tipo',
      tags: 'Tags',
      links: 'Links',
    },
    types: {
      fleeting: 'Passageiro',
      literature: 'Literatura',
      permanent: 'Permanente',
      hub: 'Hub',
      client: 'Cliente',
      negotiation: 'Negociação',
      task: 'Tarefa',
      learning: 'Aprendizado',
    },
    validation: {
      titleRequired: 'Título é obrigatório',
      contentRequired: 'Conteúdo é obrigatório',
    },
    success: {
      created: 'Zettel criado com sucesso',
      updated: 'Zettel atualizado com sucesso',
    },
    error: {
      create: 'Erro ao criar zettel',
      update: 'Erro ao atualizar zettel',
    },
  },

  // Jobs
  jobs: {
    title: 'Vagas',
    newJob: 'Nova Vaga',
    applyForJob: 'Candidatar-se',
    viewApplications: 'Ver Candidaturas',
    noJobs: 'Nenhuma vaga encontrada',
    fields: {
      title: 'Título',
      description: 'Descrição',
      requirements: 'Requisitos',
      location: 'Localização',
      type: 'Tipo',
      salary: 'Salário',
      status: 'Status',
    },
    types: {
      fullTime: 'Tempo Integral',
      partTime: 'Meio Período',
      contract: 'Contrato',
      freelance: 'Freelance',
    },
    status: {
      open: 'Aberta',
      closed: 'Fechada',
      draft: 'Rascunho',
    },
    success: {
      created: 'Vaga criada com sucesso',
      applied: 'Candidatura enviada com sucesso',
    },
    error: {
      create: 'Erro ao criar vaga',
      apply: 'Erro ao enviar candidatura',
    },
  },

  // Services
  services: {
    title: 'Serviços',
    newService: 'Novo Serviço',
    propose: 'Fazer Proposta',
    rate: 'Avaliar',
    noServices: 'Nenhum serviço encontrado',
    fields: {
      name: 'Nome',
      description: 'Descrição',
      category: 'Categoria',
      price: 'Preço',
      duration: 'Duração',
    },
    success: {
      created: 'Serviço criado com sucesso',
      proposed: 'Proposta enviada com sucesso',
      rated: 'Avaliação enviada com sucesso',
    },
    error: {
      create: 'Erro ao criar serviço',
      propose: 'Erro ao enviar proposta',
      rate: 'Erro ao avaliar serviço',
    },
  },

  // Partnerships
  partnerships: {
    title: 'Parcerias',
    newPartnership: 'Nova Parceria',
    sendInvite: 'Enviar Convite',
    myPartnerships: 'Minhas Parcerias',
    sentInvites: 'Convites Enviados',
    receivedInvites: 'Convites Recebidos',
    noPartnerships: 'Nenhuma parceria encontrada',
    fields: {
      name: 'Nome',
      company: 'Empresa',
      type: 'Tipo',
      status: 'Status',
      shareJobs: 'Compartilhar Vagas',
      shareServices: 'Compartilhar Serviços',
      shareResources: 'Compartilhar Recursos',
    },
    success: {
      created: 'Parceria criada com sucesso',
      inviteSent: 'Convite enviado com sucesso',
      accepted: 'Convite aceito com sucesso',
      rejected: 'Convite rejeitado',
    },
    error: {
      create: 'Erro ao criar parceria',
      invite: 'Erro ao enviar convite',
    },
  },

  // RBAC
  rbac: {
    title: 'Controle de Acesso',
    departments: 'Departamentos',
    roles: 'Funções',
    permissions: 'Permissões',
    audit: 'Auditoria',
    newDepartment: 'Novo Departamento',
    newRole: 'Nova Função',
    noDepartments: 'Nenhum departamento encontrado',
    noRoles: 'Nenhuma função encontrada',
    fields: {
      name: 'Nome',
      description: 'Descrição',
      parent: 'Departamento Pai',
      level: 'Nível',
    },
    success: {
      departmentCreated: 'Departamento criado com sucesso',
      roleCreated: 'Função criada com sucesso',
    },
    error: {
      departmentCreate: 'Erro ao criar departamento',
      roleCreate: 'Erro ao criar função',
    },
  },

  // WhatsApp
  whatsapp: {
    title: 'WhatsApp',
    accounts: 'Contas',
    newAccount: 'Nova Conta',
    connectAccount: 'Conectar Conta',
    scanQRCode: 'Escanear QR Code',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    connecting: 'Conectando...',
    noAccounts: 'Nenhuma conta encontrada',
    fields: {
      name: 'Nome',
      phoneNumber: 'Número de Telefone',
      status: 'Status',
    },
    success: {
      created: 'Conta criada com sucesso',
      connected: 'WhatsApp conectado com sucesso!',
      messageSent: 'Mensagem enviada com sucesso',
    },
    error: {
      create: 'Erro ao criar conta',
      connect: 'Erro ao conectar',
      sendMessage: 'Erro ao enviar mensagem',
    },
  },

  // AI Chat
  aiChat: {
    title: 'Chat com IA',
    ragMode: 'Modo RAG',
    semanticSearch: 'Busca Semântica',
    sources: 'Fontes',
    exportChat: 'Exportar Chat',
    placeholderRAGOff: 'Digite sua mensagem...',
    placeholderRAGOn: 'Pergunte sobre seus documentos...',
    send: 'Enviar',
  },

  // Settings
  settings: {
    title: 'Configurações do Sistema',
    serviceFee: 'Taxa de Serviço',
    feePercentage: 'Porcentagem da Taxa',
    minFee: 'Taxa Mínima',
    maxFee: 'Taxa Máxima',
    currency: 'Moeda',
    preview: 'Prévia do Cálculo',
    success: {
      saved: 'Configurações salvas com sucesso',
    },
    error: {
      save: 'Erro ao salvar configurações',
    },
  },

  // Workflows
  workflows: {
    title: 'Fluxos de Trabalho',
    newWorkflow: 'Novo Fluxo',
    noWorkflows: 'Nenhum fluxo de trabalho encontrado',
  },

  // Webhooks
  webhooks: {
    title: 'Webhooks',
    endpoints: 'Endpoints',
    events: 'Eventos',
    newEndpoint: 'Novo Endpoint',
    newEvent: 'Novo Evento',
  },

  // Field Service (FSM)
  fsm: {
    title: 'Serviço de Campo',
    workOrders: 'Ordens de Serviço',
    technicians: 'Técnicos',
    newWorkOrder: 'Nova Ordem',
  },

  // CMMS
  cmms: {
    title: 'Gerenciamento de Manutenção',
    assets: 'Ativos',
    maintenancePlans: 'Planos de Manutenção',
    records: 'Registros',
    spareParts: 'Peças de Reposição',
  },

  // MCP
  mcp: {
    title: 'Servidores MCP',
    servers: 'Servidores',
    tools: 'Ferramentas',
    resources: 'Recursos',
  },

  // Errors
  errors: {
    generic: 'Ocorreu um erro. Por favor, tente novamente.',
    network: 'Erro de conexão. Verifique sua internet.',
    unauthorized: 'Não autorizado. Faça login novamente.',
    notFound: 'Recurso não encontrado.',
    validation: 'Erro de validação. Verifique os campos.',
    server: 'Erro no servidor. Tente novamente mais tarde.',
  },
};

export type Translation = typeof ptBR;
