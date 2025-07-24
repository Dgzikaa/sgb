/**
 * 📊 Script para Popular Tabelas NIBO com Paginação
 * 
 * Este script busca dados reais da API do NIBO com paginação
 * e insere nas tabelas do banco de dados
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração NIBO
const NIBO_CONFIG = {
  apiToken: '02D8F9B964E74ADAA1A595909A67BA46',
  organizationId: '9b27739d-9daf-4d21-ba70-1e9f67ee5dc6',
  baseUrl: 'https://api.nibo.com.br/empresas/v1',
  barId: 3 // Ordinário Bar
};

class NiboDataPopulator {
  constructor() {
    this.stats = {
      stakeholders: { total: 0, inseridos: 0, erros: 0 },
      categorias: { total: 0, inseridos: 0, erros: 0 },
      agendamentos: { total: 0, inseridos: 0, erros: 0 },
      usuarios: { total: 0, inseridos: 0, erros: 0 },
      contas_bancarias: { total: 0, inseridos: 0, erros: 0 },
      centrosCusto: { total: 0, inseridos: 0, erros: 0 }
    };
  }

  async fetchNiboData(endpoint, params = {}) {
    const url = new URL(`${NIBO_CONFIG.baseUrl}/${endpoint}`);
    url.searchParams.set('apitoken', NIBO_CONFIG.apiToken);
    
    // Adicionar parâmetros OData
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apitoken': NIBO_CONFIG.apiToken
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Erro ao buscar ${endpoint}:`, error.message);
      return null;
    }
  }

  async fetchNiboDataPaginated(endpoint, params = {}) {
    const allItems = [];
    let skip = 0;
    const top = 100; // Limite por página
    let hasMore = true;

    console.log(`📄 Buscando ${endpoint} com paginação...`);

    while (hasMore) {
      const pageParams = {
        ...params,
        $top: top,
        $skip: skip
      };

      const data = await this.fetchNiboData(endpoint, pageParams);
      
      if (!data || !data.items || data.items.length === 0) {
        hasMore = false;
        break;
      }

      allItems.push(...data.items);
      console.log(`  📄 Página ${Math.floor(skip/top) + 1}: ${data.items.length} registros`);
      
      // Se retornou menos que o limite, chegou ao fim
      if (data.items.length < top) {
        hasMore = false;
      } else {
        skip += top;
      }

      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Total de ${allItems.length} registros encontrados para ${endpoint}`);
    return { items: allItems };
  }

  async populateStakeholders() {
    console.log('👥 Populando stakeholders (clientes, fornecedores, funcionários, sócios)...');
    
    // Buscar stakeholders por tipo usando $filter (já que $skip não funciona)
    const allStakeholders = [];

    // Buscar clientes (20 registros - todos de uma vez)
    console.log('📄 Buscando clientes...');
    try {
      const clientesResponse = await fetch(`${NIBO_CONFIG.baseUrl}/stakeholders?$filter=type eq 'Customer'&$top=1000`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apitoken': NIBO_CONFIG.apiToken
        }
      });

      if (clientesResponse.ok) {
        const clientesData = await clientesResponse.json();
        allStakeholders.push(...clientesData.items);
        console.log(`  ✅ Clientes: ${clientesData.items.length} registros`);
      } else {
        console.log(`❌ Erro ao buscar clientes: ${clientesResponse.status}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar clientes:`, error.message);
    }

    // Buscar fornecedores (640 registros) usando filtros por nome para contornar limite de 500
    console.log('📄 Buscando fornecedores...');
    try {
      // Primeira página: fornecedores ordenados por nome (primeiros 500)
      const fornecedoresResponse1 = await fetch(`${NIBO_CONFIG.baseUrl}/stakeholders?$filter=type eq 'Supplier'&$orderby=name asc&$top=500`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apitoken': NIBO_CONFIG.apiToken
        }
      });

      if (fornecedoresResponse1.ok) {
        const fornecedoresData1 = await fornecedoresResponse1.json();
        allStakeholders.push(...fornecedoresData1.items);
        console.log(`  ✅ Fornecedores (página 1): ${fornecedoresData1.items.length} registros`);
        
        // Se há mais fornecedores, buscar a segunda página
        if (fornecedoresData1.count > fornecedoresData1.items.length) {
          const ultimoNome = fornecedoresData1.items[fornecedoresData1.items.length - 1].name;
          console.log(`  📄 Buscando fornecedores com nome > "${ultimoNome}"...`);
          
          const fornecedoresResponse2 = await fetch(`${NIBO_CONFIG.baseUrl}/stakeholders?$filter=type eq 'Supplier' and name gt '${ultimoNome}'&$top=500`, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'apitoken': NIBO_CONFIG.apiToken
            }
          });

          if (fornecedoresResponse2.ok) {
            const fornecedoresData2 = await fornecedoresResponse2.json();
            allStakeholders.push(...fornecedoresData2.items);
            console.log(`  ✅ Fornecedores (página 2): ${fornecedoresData2.items.length} registros`);
          } else {
            console.log(`❌ Erro ao buscar segunda página de fornecedores: ${fornecedoresResponse2.status}`);
          }
        }
        
        console.log(`  📊 Total de fornecedores: ${allStakeholders.filter(s => s.type === 'Supplier').length} (de ${fornecedoresData1.count} total)`);
      } else {
        console.log(`❌ Erro ao buscar fornecedores: ${fornecedoresResponse1.status}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar fornecedores:`, error.message);
    }

    if (allStakeholders.length === 0) {
      console.log('❌ Nenhum stakeholder encontrado');
      return;
    }

    this.stats.stakeholders.total = allStakeholders.length;
    console.log(`📊 TOTAL: ${allStakeholders.length} stakeholders encontrados`);

    // Separar por tipo
    const clientes = allStakeholders.filter(s => s.type === 'Customer');
    const fornecedores = allStakeholders.filter(s => s.type === 'Supplier');

    console.log(`  👥 Clientes: ${clientes.length}`);
    console.log(`  🏢 Fornecedores: ${fornecedores.length}`);

    // Inserir todos os stakeholders na tabela unificada
    for (const stakeholder of allStakeholders) {
      try {
        const { error } = await supabase
          .from('nibo_stakeholders')
          .upsert({
            nibo_id: stakeholder.id,
            bar_id: NIBO_CONFIG.barId,
            nome: stakeholder.name,
            nome_iniciais: stakeholder.initialsName,
            documento_numero: stakeholder.document?.number || null,
            documento_tipo: stakeholder.document?.type || null,
            email: stakeholder.communication?.email || null,
            telefone: stakeholder.communication?.phone || null,
            endereco: stakeholder.address || {},
            informacoes_bancarias: stakeholder.bankAccountInformation || {},
            informacoes_empresa: stakeholder.companyInformation || {},
            tipo: stakeholder.type,
            deletado: stakeholder.isDeleted,
            arquivado: stakeholder.isArchived,
            empresa: stakeholder.isCompany,
            data_atualizacao: stakeholder.updateDate || new Date().toISOString(),
            usuario_atualizacao: stakeholder.updateUser || 'Sistema'
          }, {
            onConflict: 'nibo_id'
          });

        if (error) {
          console.error(`❌ Erro ao inserir stakeholder ${stakeholder.name}:`, error.message);
          this.stats.stakeholders.erros++;
        } else {
          this.stats.stakeholders.inseridos++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar stakeholder ${stakeholder.name}:`, error.message);
        this.stats.stakeholders.erros++;
      }
    }
  }

  async populateCategorias() {
    console.log('📊 Populando categorias...');
    
    const data = await this.fetchNiboDataPaginated('categories');
    if (!data || !data.items) {
      console.log('❌ Nenhum dado de categorias encontrado');
      return;
    }

    this.stats.categorias.total = data.items.length;
    console.log(`📊 Encontradas ${data.items.length} categorias`);

    for (const categoria of data.items) {
      try {
        const { error } = await supabase
          .from('nibo_categorias')
          .upsert({
            nibo_id: categoria.id,
            bar_id: NIBO_CONFIG.barId,
            nome: categoria.name,
            descricao: categoria.description,
            tipo: categoria.type,
            cor: categoria.color,
            icone: categoria.icon,
            ativo: !categoria.isDeleted,
            deletado: categoria.isDeleted,
            data_atualizacao: categoria.updateDate || new Date().toISOString(),
            usuario_atualizacao: categoria.updateUser || 'Sistema'
          }, {
            onConflict: 'nibo_id'
          });

        if (error) {
          console.error(`❌ Erro ao inserir categoria ${categoria.name}:`, error.message);
          this.stats.categorias.erros++;
        } else {
          this.stats.categorias.inseridos++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar categoria ${categoria.name}:`, error.message);
        this.stats.categorias.erros++;
      }
    }
  }

  async populateCentrosCusto() {
    console.log('🏢 Populando centros de custo...');

    // Buscar todos os centros de custo
    const data = await this.fetchNiboData('costcenters', {
      $orderby: "description asc"
    });

    if (!data || !data.items) {
      console.log('❌ Nenhum centro de custo encontrado');
      return;
    }

    this.stats.centrosCusto.total = data.items.length;
    console.log(`📊 Encontrados ${data.items.length} centros de custo`);

    for (const centroCusto of data.items) {
      try {
        const { error } = await supabase
          .from('nibo_centros_custo')
          .upsert({
            nibo_id: centroCusto.costCenterId,
            bar_id: NIBO_CONFIG.barId,
            nome: centroCusto.description,
            descricao: centroCusto.description,
            ativo: true,
            deletado: false,
            atualizado_em: centroCusto.updateDate || new Date().toISOString()
          }, {
            onConflict: 'nibo_id'
          });

        if (error) {
          console.error(`❌ Erro ao inserir centro de custo ${centroCusto.description}:`, error.message);
          this.stats.centrosCusto.erros++;
        } else {
          this.stats.centrosCusto.inseridos++;
          console.log(`  ✅ Centro de custo: ${centroCusto.description}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar centro de custo ${centroCusto.description}:`, error.message);
        this.stats.centrosCusto.erros++;
      }
    }
  }

  async populateAgendamentos() {
    console.log('💰 Populando agendamentos (schedules)...');
    
    // Buscar TODOS os agendamentos desde 2024 com paginação completa
    const allAgendamentos = [];
    let skip = 0;
    const top = 500; // NIBO tem limite de 500 por página
    let hasMore = true;
    let pageCount = 0;

    console.log('📄 Buscando agendamentos com paginação completa...');

    while (hasMore) {
      pageCount++;
      const pageParams = {
        $filter: "createDate ge 2024-01-01",
        $orderby: "createDate desc",
        $top: top,
        $skip: skip
      };

      console.log(`📄 Buscando página ${pageCount} (skip: ${skip}, top: ${top})...`);

      const data = await this.fetchNiboData('schedules', pageParams);
      
      if (!data || !data.items || data.items.length === 0) {
        console.log(`📄 Página ${pageCount}: Nenhum dado retornado`);
        hasMore = false;
        break;
      }

      allAgendamentos.push(...data.items);
      console.log(`📄 Página ${pageCount}: ${data.items.length} agendamentos`);
      
      skip += top;
      
      // Se retornou menos que o top, chegou ao fim
      if (data.items.length < top) {
        console.log(`📄 Página ${pageCount}: Última página (${data.items.length} < ${top})`);
        hasMore = false;
      }

      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.stats.agendamentos.total = allAgendamentos.length;
    console.log(`📊 Total de agendamentos encontrados: ${allAgendamentos.length}`);

    // Contar registros com centro de custo
    const comCentroCusto = allAgendamentos.filter(item => item.costCenters && item.costCenters.length > 0);
    console.log(`📊 Registros com centro de custo: ${comCentroCusto.length}`);

    for (const agendamento of allAgendamentos) {
      try {
        // Buscar categoria se existir
        let categoriaId = null;
        if (agendamento.category?.id) {
          const { data: categoria } = await supabase
            .from('nibo_categorias')
            .select('id')
            .eq('nibo_id', agendamento.category.id)
            .single();
          categoriaId = categoria?.id;
        }

        // Buscar stakeholder se existir
        let stakeholderId = null;
        if (agendamento.stakeholder?.id) {
          const { data: stakeholder } = await supabase
            .from('nibo_stakeholders')
            .select('id')
            .eq('nibo_id', agendamento.stakeholder.id)
            .single();
          stakeholderId = stakeholder?.id;
        }

        // Buscar conta bancária se existir
        let contaBancariaId = null;
        if (agendamento.bankAccount?.id) {
          const { data: contaBancaria } = await supabase
            .from('nibo_contas_bancarias')
            .select('id')
            .eq('nibo_id', agendamento.bankAccount.id)
            .single();
          contaBancariaId = contaBancaria?.id;
        }

        // Processar centro de custo
        let centroCustoId = null;
        let centroCustoNome = null;
        let centroCustoConfig = {};

        if (agendamento.costCenters && agendamento.costCenters.length > 0) {
          // Pegar o primeiro centro de custo (assumindo que é o principal)
          const primeiroCentroCusto = agendamento.costCenters[0];
          centroCustoId = primeiroCentroCusto.costCenterId;
          centroCustoNome = primeiroCentroCusto.costCenterDescription;
          centroCustoConfig = {
            costCenters: agendamento.costCenters,
            costCenterValueType: agendamento.costCenterValueType || 0
          };
        }

        const { error } = await supabase
          .from('nibo_agendamentos')
          .upsert({
            nibo_id: agendamento.scheduleId,
            bar_id: NIBO_CONFIG.barId,
            tipo: agendamento.type === 'Credit' ? 'Receivable' : 'Payable',
            titulo: agendamento.description,
            status: agendamento.isPaid ? 'Paid' : (agendamento.isDued ? 'Overdue' : 'Open'),
            valor: agendamento.value,
            valor_pago: agendamento.paidValue || 0,
            data_vencimento: agendamento.dueDate,
            data_pagamento: agendamento.isPaid ? agendamento.dueDate : null,
            descricao: agendamento.description,
            observacoes: agendamento.description,
            categoria_id: agendamento.category?.id || null,
            categoria_nome: agendamento.category?.name || null,
            stakeholder_id: agendamento.stakeholder?.id || null,
            stakeholder_nome: agendamento.stakeholder?.name || null,
            stakeholder_tipo: agendamento.stakeholder?.type || null,
            conta_bancaria_id: agendamento.bankAccount?.id || null,
            conta_bancaria_nome: agendamento.bankAccount?.name || null,
            centro_custo_id: centroCustoId,
            centro_custo_nome: centroCustoNome,
            centro_custo_config: centroCustoConfig,
            numero_documento: null,
            numero_parcela: null,
            total_parcelas: null,
            recorrente: agendamento.hasRecurrence || false,
            frequencia_recorrencia: null,
            anexos: [],
            tags: [],
            recorrencia_config: {},
            deletado: agendamento.isDeleted || false,
            stakeholder_id_interno: stakeholderId,
            conta_bancaria_id_interno: contaBancariaId,
            data_atualizacao: agendamento.updateDate || agendamento.createDate,
            usuario_atualizacao: agendamento.updateUser || agendamento.createUser
          }, {
            onConflict: 'nibo_id'
          });

        if (error) {
          console.error(`❌ Erro ao inserir agendamento ${agendamento.description}:`, error.message);
          this.stats.agendamentos.erros++;
        } else {
          this.stats.agendamentos.inseridos++;

          // Log para registros com centro de custo
          if (centroCustoId) {
            console.log(`  ✅ Agendamento com centro de custo: ${agendamento.description} -> ${centroCustoNome}`);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar agendamento ${agendamento.description}:`, error.message);
        this.stats.agendamentos.erros++;
      }
    }
  }

  async populateContasBancarias() {
    console.log('🏦 Populando contas bancárias...');
    
    // Buscar contas bancárias usando o endpoint correto 'accounts'
    const data = await this.fetchNiboData('accounts');
    if (!data || !data.items) {
      console.log('❌ Nenhum dado de contas bancárias encontrado');
      return;
    }

    this.stats.contas_bancarias.total = data.items.length;
    console.log(`📊 Encontradas ${data.items.length} contas bancárias`);

    for (const conta of data.items) {
      try {
        const { error } = await supabase
          .from('nibo_contas_bancarias')
          .upsert({
            nibo_id: conta.id,
            bar_id: NIBO_CONFIG.barId,
            nome: conta.name,
            tipo_conta: conta.type,
            banco: conta.bankNumber ? `Banco ${conta.bankNumber}` : null,
            agencia: conta.bankAgency || null,
            conta: conta.bankAccount || null,
            saldo_atual: conta.openBalance || 0,
            moeda: 'BRL',
            ativo: !conta.isArchived,
            deletado: conta.isArchived,
            data_atualizacao: conta.updateDate || new Date().toISOString(),
            usuario_atualizacao: conta.updateUser || 'Sistema'
          }, {
            onConflict: 'nibo_id'
          });

        if (error) {
          console.error(`❌ Erro ao inserir conta bancária ${conta.name}:`, error.message);
          this.stats.contas_bancarias.erros++;
        } else {
          this.stats.contas_bancarias.inseridos++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar conta bancária ${conta.name}:`, error.message);
        this.stats.contas_bancarias.erros++;
      }
    }
  }

  async populateUsuarios() {
    console.log('👤 Populando usuários...');
    
    const data = await this.fetchNiboData('users');
    if (!data || !data.items) {
      console.log('❌ Nenhum dado de usuários encontrado');
      return;
    }

    this.stats.usuarios.total = data.items.length;
    console.log(`📊 Encontrados ${data.items.length} usuários`);

    for (const usuario of data.items) {
      try {
        const { error } = await supabase
          .from('nibo_usuarios')
          .upsert({
            nibo_id: usuario.id,
            bar_id: NIBO_CONFIG.barId,
            email: usuario.email,
            nome: `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim(),
            primeiro_nome: usuario.firstName,
            ultimo_nome: usuario.lastName,
            telefone: usuario.phone || null,
            ddd: usuario.areaCode,
            cargo: usuario.isOrganizationOwner ? 'Proprietário' : 'Usuário',
            departamento: 'Administrativo',
            proprietario_organizacao: usuario.isOrganizationOwner,
            usuario_organizacao: usuario.isOrganizationUser,
            usuario_contador: usuario.isAccountantUser,
            data_criacao: usuario.createDate,
            data_aceitacao: usuario.acceptDate,
            roles_text: usuario.rolesText || null,
            ativo: true,
            deletado: false,
            data_atualizacao: new Date().toISOString(),
            usuario_atualizacao: 'Sistema'
          }, {
            onConflict: 'nibo_id'
          });

        if (error) {
          console.error(`❌ Erro ao inserir usuário ${usuario.email}:`, error.message);
          this.stats.usuarios.erros++;
        } else {
          this.stats.usuarios.inseridos++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${usuario.email}:`, error.message);
        this.stats.usuarios.erros++;
      }
    }
  }

  async populateAll() {
    console.log('🚀 Iniciando população completa das tabelas NIBO...\n');

    try {
      // Ordem de execução: primeiro as tabelas de referência
      await this.populateCategorias();
      await this.populateStakeholders();
      await this.populateContasBancarias();
      await this.populateCentrosCusto(); // Adicionado para popular centros de custo
      await this.populateAgendamentos();

      console.log('\n🎉 População concluída! Resumo:');
      console.log('📊 Categorias:', this.stats.categorias);
      console.log('👥 Stakeholders:', this.stats.stakeholders);
      console.log('🏦 Contas Bancárias:', this.stats.contas_bancarias);
      console.log('🏢 Centros de Custo:', this.stats.centrosCusto);
      console.log('💰 Agendamentos:', this.stats.agendamentos);

    } catch (error) {
      console.error('❌ Erro durante a população:', error);
    }
  }
}

// Executar o script
const populator = new NiboDataPopulator();
populator.populateAll(); 