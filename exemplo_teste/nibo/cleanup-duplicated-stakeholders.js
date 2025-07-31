/**
 * 🧹 Script para Identificar e Excluir Stakeholders Duplicados no NIBO
 * 
 * Este script:
 * 1. Lista todos os stakeholders (clientes, fornecedores, funcionários, sócios)
 * 2. Identifica duplicados por nome (case-insensitive)
 * 3. Permite excluir os duplicados, mantendo apenas um registro por nome
 */

// Configuração NIBO
const NIBO_CONFIG = {
  apiToken: '04A44D8D7EDE4F038871ECD294B2662D',
  organizationId: '9b27739d-9daf-4d21-ba70-1e9f67ee5dc6',
  baseUrl: 'https://api.nibo.com.br/empresas/v1'
};

class NiboDuplicateStakeholderCleaner {
  constructor() {
    this.allStakeholders = [];
    this.duplicatedGroups = [];
    this.stats = {
      total: 0,
      duplicates: 0,
      toDelete: 0,
      deleted: 0,
      errors: 0
    };
  }

  async fetchNiboData(endpoint, params = {}) {
    const url = new URL(`${NIBO_CONFIG.baseUrl}/${endpoint}`);
    url.searchParams.set('apitoken', NIBO_CONFIG.apiToken);
    
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

  async deleteStakeholder(stakeholderId, stakeholderType) {
    const endpoint = stakeholderType === 'Supplier' ? 'suppliers' : 'customers';
    const url = `${NIBO_CONFIG.baseUrl}/${endpoint}/${stakeholderId}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'apitoken': NIBO_CONFIG.apiToken
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Erro ao excluir stakeholder ${stakeholderId}:`, error.message);
      return false;
    }
  }

  async fetchAllStakeholders() {
    console.log('📄 Buscando todos os stakeholders...');
    
    const allStakeholders = [];

    // Buscar clientes
    console.log('👥 Buscando clientes...');
    try {
      const clientesResponse = await this.fetchNiboData('stakeholders', {
        '$filter': "type eq 'Customer'",
        '$top': 1000,
        '$orderby': 'name asc'
      });

      if (clientesResponse?.items) {
        allStakeholders.push(...clientesResponse.items);
        console.log(`  ✅ Clientes: ${clientesResponse.items.length} registros`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error.message);
    }

    // Buscar fornecedores (com paginação para contornar limite de 500)
    console.log('🏢 Buscando fornecedores...');
    try {
      // Primeira página
      const fornecedoresResponse1 = await this.fetchNiboData('stakeholders', {
        '$filter': "type eq 'Supplier'",
        '$orderby': 'name asc',
        '$top': 500
      });

      if (fornecedoresResponse1?.items) {
        allStakeholders.push(...fornecedoresResponse1.items);
        console.log(`  ✅ Fornecedores (página 1): ${fornecedoresResponse1.items.length} registros`);
        
        // Se há mais fornecedores, buscar páginas adicionais
        if (fornecedoresResponse1.count > fornecedoresResponse1.items.length) {
          let skip = 500;
          let hasMore = true;
          
          while (hasMore) {
            const fornecedoresResponseN = await this.fetchNiboData('stakeholders', {
              '$filter': "type eq 'Supplier'",
              '$orderby': 'name asc',
              '$top': 500,
              '$skip': skip
            });

            if (fornecedoresResponseN?.items && fornecedoresResponseN.items.length > 0) {
              allStakeholders.push(...fornecedoresResponseN.items);
              console.log(`  ✅ Fornecedores (página ${Math.floor(skip/500) + 2}): ${fornecedoresResponseN.items.length} registros`);
              skip += 500;
              
              // Se retornou menos que 500, chegou ao fim
              if (fornecedoresResponseN.items.length < 500) {
                hasMore = false;
              }
            } else {
              hasMore = false;
            }

            // Pausa para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar fornecedores:', error.message);
    }

    this.allStakeholders = allStakeholders;
    this.stats.total = allStakeholders.length;
    
    console.log(`📊 Total de stakeholders encontrados: ${allStakeholders.length}`);
    console.log(`  👥 Clientes: ${allStakeholders.filter(s => s.type === 'Customer').length}`);
    console.log(`  🏢 Fornecedores: ${allStakeholders.filter(s => s.type === 'Supplier').length}`);
    
    return allStakeholders;
  }

  identifyDuplicates() {
    console.log('\n🔍 Identificando duplicados...');
    
    // Agrupar por nome (case-insensitive e normalizado)
    const groupedByName = {};
    
    this.allStakeholders.forEach(stakeholder => {
      // Normalizar nome: remover espaços extras, converter para lowercase
      const normalizedName = stakeholder.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' '); // Substituir múltiplos espaços por um só
      
      if (!groupedByName[normalizedName]) {
        groupedByName[normalizedName] = [];
      }
      
      groupedByName[normalizedName].push(stakeholder);
    });

    // Encontrar grupos com mais de 1 stakeholder (duplicados)
    this.duplicatedGroups = Object.entries(groupedByName)
      .filter(([name, stakeholders]) => stakeholders.length > 1)
      .map(([name, stakeholders]) => ({
        normalizedName: name,
        originalName: stakeholders[0].name, // Nome original do primeiro registro
        stakeholders: stakeholders.sort((a, b) => {
          // Ordenar por: 1) Não deletado primeiro, 2) Tem documento, 3) Data de criação
          if (a.isDeleted !== b.isDeleted) return a.isDeleted ? 1 : -1;
          if (!!a.document?.number !== !!b.document?.number) return a.document?.number ? -1 : 1;
          return new Date(a.updateDate || 0) - new Date(b.updateDate || 0);
        })
      }));

    this.stats.duplicates = this.duplicatedGroups.reduce((sum, group) => sum + group.stakeholders.length - 1, 0);
    
    console.log(`📊 Encontrados ${this.duplicatedGroups.length} grupos de duplicados`);
    console.log(`📊 Total de registros duplicados: ${this.stats.duplicates}`);
    
    return this.duplicatedGroups;
  }

  displayDuplicates() {
    console.log('\n📋 RELATÓRIO DE DUPLICADOS:\n');
    
    this.duplicatedGroups.forEach((group, index) => {
      console.log(`\n🔸 Grupo ${index + 1}: "${group.originalName}"`);
      console.log(`   Total de registros: ${group.stakeholders.length}`);
      
      group.stakeholders.forEach((stakeholder, i) => {
        const keepFlag = i === 0 ? '✅ MANTER' : '❌ EXCLUIR';
        const docInfo = stakeholder.document?.number ? `Doc: ${stakeholder.document.number}` : 'Sem documento';
        const statusInfo = stakeholder.isDeleted ? 'DELETADO' : 'ATIVO';
        
        console.log(`     ${i + 1}. ${keepFlag} - ID: ${stakeholder.id}`);
        console.log(`        Tipo: ${stakeholder.type} | ${statusInfo} | ${docInfo}`);
        console.log(`        Nome exato: "${stakeholder.name}"`);
        console.log(`        Iniciais: ${stakeholder.initialsName || 'N/A'}`);
        console.log(`        Atualizado: ${stakeholder.updateDate || 'N/A'}`);
      });
    });

    // Resumo dos que serão excluídos
    const toDelete = this.duplicatedGroups.flatMap(group => group.stakeholders.slice(1));
    this.stats.toDelete = toDelete.length;
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de stakeholders: ${this.stats.total}`);
    console.log(`   Grupos duplicados: ${this.duplicatedGroups.length}`);
    console.log(`   Registros a excluir: ${this.stats.toDelete}`);
    console.log(`   Registros a manter: ${this.duplicatedGroups.length}`);
    
    return toDelete;
  }

  async deleteDuplicates(confirmDelete = false) {
    if (!confirmDelete) {
      console.log('\n⚠️  Para executar a exclusão, execute: await cleaner.deleteDuplicates(true)');
      return;
    }

    console.log('\n🗑️  Iniciando exclusão de duplicados...');
    
    for (const group of this.duplicatedGroups) {
      const toKeep = group.stakeholders[0];
      const toDelete = group.stakeholders.slice(1);
      
      console.log(`\n🔸 Processando grupo: "${group.originalName}"`);
      console.log(`   ✅ Mantendo: ${toKeep.name} (ID: ${toKeep.id})`);
      
      for (const stakeholder of toDelete) {
        console.log(`   🗑️  Excluindo: ${stakeholder.name} (ID: ${stakeholder.id})`);
        
        const success = await this.deleteStakeholder(stakeholder.id, stakeholder.type);
        
        if (success) {
          this.stats.deleted++;
          console.log(`      ✅ Excluído com sucesso`);
        } else {
          this.stats.errors++;
          console.log(`      ❌ Erro ao excluir`);
        }
        
        // Pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`\n🎉 Limpeza concluída!`);
    console.log(`   ✅ Excluídos: ${this.stats.deleted}`);
    console.log(`   ❌ Erros: ${this.stats.errors}`);
    console.log(`   📊 Total processado: ${this.stats.toDelete}`);
  }

  async run(executeDelete = false) {
    console.log('🚀 Iniciando limpeza de stakeholders duplicados...\n');

    try {
      // 1. Buscar todos os stakeholders
      await this.fetchAllStakeholders();
      
      if (this.allStakeholders.length === 0) {
        console.log('❌ Nenhum stakeholder encontrado');
        return;
      }

      // 2. Identificar duplicados
      this.identifyDuplicates();
      
      if (this.duplicatedGroups.length === 0) {
        console.log('🎉 Nenhum duplicado encontrado!');
        return;
      }

      // 3. Exibir duplicados
      this.displayDuplicates();
      
      // 4. Executar exclusão se solicitado
      if (executeDelete) {
        await this.deleteDuplicates(true);
      } else {
        console.log('\n💡 Para executar a exclusão, execute:');
        console.log('   cleaner.deleteDuplicates(true)');
      }

    } catch (error) {
      console.error('❌ Erro durante a execução:', error);
    }
  }
}

// Executar o script
console.log('🧹 NIBO Duplicate Stakeholder Cleaner\n');

const cleaner = new NiboDuplicateStakeholderCleaner();

// Verificar se foi passado parâmetro para executar exclusão
const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete') || args.includes('-d');

if (shouldDelete) {
  console.log('🚨 MODO EXCLUSÃO ATIVADO!\n');
  // Executar com exclusão
  cleaner.run(true).then(() => {
    console.log('\n🎉 Processo de limpeza concluído!');
  }).catch(error => {
    console.error('❌ Erro:', error);
  });
} else {
  // Primeiro, apenas identificar duplicados (sem excluir)
  cleaner.run(false).then(() => {
    console.log('\n✅ Análise concluída.');
    console.log('\n💡 Para executar a exclusão, rode:');
    console.log('node cleanup-duplicated-stakeholders.js --delete');
    console.log('\nOU entre no console Node.js:');
    console.log('node');
    console.log('const { cleaner } = require("./cleanup-duplicated-stakeholders.js");');
    console.log('await cleaner.deleteDuplicates(true);');
  }).catch(error => {
    console.error('❌ Erro:', error);
  });
}

// Exportar para uso manual se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NiboDuplicateStakeholderCleaner, cleaner };
}