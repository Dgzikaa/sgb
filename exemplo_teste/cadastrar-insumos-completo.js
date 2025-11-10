#!/usr/bin/env node

/**
 * Script para cadastrar todos os insumos do Ordinário no sistema Zykor
 * 
 * Execução: node exemplo_teste/cadastrar-insumos-completo.js
 */

// Usar localhost por padrão, ou passar via argumento: node script.js https://zykor.vercel.app
const API_BASE_URL = process.argv[2] || 'http://localhost:3000';
const BAR_ID = 3; // Ordinário

console.log(`🌐 URL da API: ${API_BASE_URL}\n`);

// Função auxiliar para determinar unidade de medida
function determinarUnidadeMedida(nome, codigo) {
  const nomeLower = nome.toLowerCase();
  
  // Unidades explícitas no nome
  if (nomeLower.includes(' kg') || nomeLower.includes('/kg') || nomeLower.includes(' kg)')) return 'kg';
  if (nomeLower.includes(' g ') || nomeLower.includes('gramas')) return 'g';
  if (nomeLower.includes(' ml') || nomeLower.includes('mililitros')) return 'ml';
  if (nomeLower.includes(' l ') || nomeLower.includes('litros') || nomeLower.includes(' l)')) return 'l';
  if (nomeLower.includes(' und') || nomeLower.includes('unidade') || nomeLower.includes('bdj') || nomeLower.includes('caixa')) return 'unid';
  if (nomeLower.includes(' pct') || nomeLower.includes('pacote')) return 'pct';
  
  // Categorias específicas
  if (codigo.startsWith('pc')) return 'kg'; // Produtos de produção geralmente em kg
  
  // Bebidas (ml ou l)
  if (nomeLower.includes('chopp') || nomeLower.includes('barril')) return 'l';
  if (nomeLower.includes('cerveja') || nomeLower.includes('vinho') || nomeLower.includes('espumante')) return 'ml';
  if (nomeLower.includes('água') || nomeLower.includes('refrigerante') || nomeLower.includes('suco')) return 'ml';
  if (nomeLower.includes('refr.') || nomeLower.includes('tônica')) return 'ml';
  
  // Proteínas e carnes (kg)
  if (nomeLower.includes('carne') || nomeLower.includes('frango') || nomeLower.includes('peixe') || 
      nomeLower.includes('bacon') || nomeLower.includes('linguiça') || nomeLower.includes('filé') ||
      nomeLower.includes('costela') || nomeLower.includes('alcatra') || nomeLower.includes('picanha')) return 'kg';
  
  // Hortifruti
  if (nomeLower.includes('tomate') || nomeLower.includes('cebola') || nomeLower.includes('alho') ||
      nomeLower.includes('batata') || nomeLower.includes('cenoura') || nomeLower.includes('mandioca')) return 'kg';
  
  // Maço/unidade
  if (nomeLower.includes('mç') || nomeLower.includes('maço')) return 'unid';
  if (nomeLower.includes('pão') || nomeLower.includes('ovo')) return 'unid';
  
  // Padrão: kg para sólidos, unid para o resto
  return 'kg';
}

// Determinar se é cozinha ou bar
function determinarTipoLocal(categoria, nome) {
  const categoriaLower = categoria.toLowerCase();
  const nomeLower = nome.toLowerCase();
  
  // Bar (bebidas)
  if (categoriaLower.includes('artesanal') || 
      categoriaLower.includes('lata') || 
      categoriaLower.includes('long neck') ||
      categoriaLower.includes('não-alcóolicos') ||
      categoriaLower.includes('retornáveis') ||
      categoriaLower.includes('vinhos') ||
      nomeLower.includes('cerveja') ||
      nomeLower.includes('chopp') ||
      nomeLower.includes('vinho') ||
      nomeLower.includes('espumante')) {
    return 'bar';
  }
  
  // Cozinha (resto)
  return 'cozinha';
}

// Lista de todos os insumos
const insumos = [
  // ============= COZINHA - ARMAZÉM =============
  { preco: 12.99, codigo: 'i0093', categoria: 'ARMAZÉM (C)', nome: 'Açafrão kg' },
  { preco: 6.99, codigo: 'i0490', categoria: 'ARMAZÉM (C)', nome: 'Açucar Mascavo kg' },
  { preco: 11.99, codigo: 'i0097', categoria: 'ARMAZÉM (C)', nome: 'Alho em pó kg' },
  { preco: 27.99, codigo: 'i0211', categoria: 'ARMAZÉM (C)', nome: 'Alho Frito kg' },
  { preco: 11.89, codigo: 'i0228', categoria: 'ARMAZÉM (C)', nome: 'Amendoin sem pele kg' },
  { preco: 27.43, codigo: 'i0247', categoria: 'ARMAZÉM (C)', nome: 'Canela em pó kg' },
  { preco: 62.40, codigo: 'i0225', categoria: 'ARMAZÉM (C)', nome: 'Castanha de caju Torrada c/sal kg' },
  { preco: 25.90, codigo: 'i0112', categoria: 'ARMAZÉM (C)', nome: 'Cebola em pó kg' },
  { preco: 22.00, codigo: 'i0339', categoria: 'ARMAZÉM (C)', nome: 'Coco Ralado Em Flocos und 500g' },
  { preco: 18.90, codigo: 'i0162', categoria: 'ARMAZÉM (C)', nome: 'Coentro em grão kg' },
  { preco: 48.99, codigo: 'i0448', categoria: 'ARMAZÉM (C)', nome: 'Cream Cheese und 1,2kg' },
  { preco: 25.00, codigo: 'i0129', categoria: 'ARMAZÉM (C)', nome: 'Folha de louro kg' },
  { preco: 27.40, codigo: 'i0535', categoria: 'ARMAZÉM (C)', nome: 'Fumaça Líquida' },
  { preco: 39.00, codigo: 'i0227', categoria: 'ARMAZÉM (C)', nome: 'Gergelim Preto kg' },
  { preco: 22.90, codigo: 'i0134', categoria: 'ARMAZÉM (C)', nome: 'Manteiga de garrafa und 450g' },
  { preco: 27.28, codigo: 'i0133', categoria: 'ARMAZÉM (C)', nome: 'Manteiga kg (Barra)' },
  { preco: 84.95, codigo: 'i0079', categoria: 'ARMAZÉM (C)', nome: 'Noz moscada moída kg' },
  { preco: 7.52, codigo: 'i0292', categoria: 'ARMAZÉM (C)', nome: 'Orégano Flocos kg' },
  { preco: 22.60, codigo: 'i0258', categoria: 'ARMAZÉM (C)', nome: 'Páprica Defumada kg' },
  { preco: 54.79, codigo: 'i0149', categoria: 'ARMAZÉM (C)', nome: 'Pimenta do reino Grão kg' },
  { preco: 57.25, codigo: 'i0151', categoria: 'ARMAZÉM (C)', nome: 'Pimenta malagueta desidratada kg' },
  { preco: 40.23, codigo: 'i0491', categoria: 'ARMAZÉM (C)', nome: 'Queijo Cheddar Fatiado Kg' },
  { preco: 4.50, codigo: 'i0575', categoria: 'ARMAZÉM (C)', nome: 'Queijo Coalho - Espetinho und' },
  { preco: 39.90, codigo: 'i0153', categoria: 'ARMAZÉM (C)', nome: 'Queijo coalho kg' },
  { preco: 92.90, codigo: 'i0154', categoria: 'ARMAZÉM (C)', nome: 'Queijo do reino kg' },
  { preco: 69.90, codigo: 'i0155', categoria: 'ARMAZÉM (C)', nome: 'Queijo gorgonzola kg' },
  { preco: 34.49, codigo: 'i0156', categoria: 'ARMAZÉM (C)', nome: 'Queijo mussarela Kg' },
  { preco: 13.75, codigo: 'i0163', categoria: 'ARMAZÉM (C)', nome: 'Tapioca granulada kg' },

  // ============= COZINHA - HORTIFRUTI =============
  { preco: 9.50, codigo: 'i0031', categoria: 'HORTIFRUTI (C)', nome: 'Abacaxi Graudo und' },
  { preco: 30.00, codigo: 'i0095', categoria: 'HORTIFRUTI (C)', nome: 'Alho Com Casca kg' },
  { preco: 18.50, codigo: 'i0092', categoria: 'HORTIFRUTI (C)', nome: 'Alho descascado kg' },
  { preco: 4.00, codigo: 'i0098', categoria: 'HORTIFRUTI (C)', nome: 'Alho-poró mç' },
  { preco: 2.20, codigo: 'i0221', categoria: 'HORTIFRUTI (C)', nome: 'Batata inglesa Kg' },
  { preco: 1.75, codigo: 'i0111', categoria: 'HORTIFRUTI (C)', nome: 'Cebola nacional Kg' },
  { preco: 4.90, codigo: 'i0113', categoria: 'HORTIFRUTI (C)', nome: 'Cebola roxa kg' },
  { preco: 2.20, codigo: 'i0114', categoria: 'HORTIFRUTI (C)', nome: 'Cebolinha und mç' },
  { preco: 3.50, codigo: 'i0224', categoria: 'HORTIFRUTI (C)', nome: 'Cenoura kg' },
  { preco: 2.20, codigo: 'i0035', categoria: 'HORTIFRUTI (C)', nome: 'Coentro und mç' },
  { preco: 2.50, codigo: 'i0125', categoria: 'HORTIFRUTI (C)', nome: 'Hortelã und mç' },
  { preco: 2.67, codigo: 'i0041', categoria: 'HORTIFRUTI (C)', nome: 'Laranja Pêra kg' },
  { preco: 4.50, codigo: 'i0043', categoria: 'HORTIFRUTI (C)', nome: 'Limão Taihti (saco)' },
  { preco: 8.70, codigo: 'i0445', categoria: 'HORTIFRUTI (C)', nome: 'Maça Nacional kg' },
  { preco: 5.70, codigo: 'i0131', categoria: 'HORTIFRUTI (C)', nome: 'Mandioca kg' },
  { preco: 2.50, codigo: 'i0132', categoria: 'HORTIFRUTI (C)', nome: 'Manjericão mç und' },
  { preco: 8.25, codigo: 'i0338', categoria: 'HORTIFRUTI (C)', nome: 'Morango BDJ' },
  { preco: 18.00, codigo: 'i0139', categoria: 'HORTIFRUTI (C)', nome: 'Ovo Grande und (bdj c/ 30)' },
  { preco: 10.00, codigo: 'i0454', categoria: 'HORTIFRUTI (C)', nome: 'Pimenta de Cheiro kg' },
  { preco: 20.00, codigo: 'i0047', categoria: 'HORTIFRUTI (C)', nome: 'Pimenta dedo-de-moça kg' },
  { preco: 19.00, codigo: 'i0521', categoria: 'HORTIFRUTI (C)', nome: 'Pimentão Amarelo kg' },
  { preco: 7.50, codigo: 'i0293', categoria: 'HORTIFRUTI (C)', nome: 'Pimentão Verde Kg' },
  { preco: 19.00, codigo: 'i0522', categoria: 'HORTIFRUTI (C)', nome: 'Pimentão Vermelho kg' },
  { preco: 2.50, codigo: 'i0443', categoria: 'HORTIFRUTI (C)', nome: 'Rúcula mç' },
  { preco: 2.50, codigo: 'i0161', categoria: 'HORTIFRUTI (C)', nome: 'Salsa und mç' },
  { preco: 9.00, codigo: 'i0159', categoria: 'HORTIFRUTI (C)', nome: 'Salsão und mç' },
  { preco: 3.00, codigo: 'i0488', categoria: 'HORTIFRUTI (C)', nome: 'Tomate Cereja' },
  { preco: 5.00, codigo: 'i0489', categoria: 'HORTIFRUTI (C)', nome: 'Tomate Italiano Maduro' },
  { preco: 4.00, codigo: 'i0294', categoria: 'HORTIFRUTI (C)', nome: 'Tomilho und mç' },

  // ============= COZINHA - MERCADO =============
  { preco: 15.99, codigo: 'i0059', categoria: 'MERCADO (C)', nome: 'Açúcar und 5kg' },
  { preco: 5.33, codigo: 'i0099', categoria: 'MERCADO (C)', nome: 'Amido de milho und 1kg' },
  { preco: 197.65, codigo: 'i0100', categoria: 'MERCADO (C)', nome: 'Azeite und 5L' },
  { preco: 15.11, codigo: 'i0104', categoria: 'MERCADO (C)', nome: 'Batata frita Mccain 7mm und (pct 2kg)' },
  { preco: 15.29, codigo: 'i0517', categoria: 'MERCADO (C)', nome: 'Caldo de Carne und 1kg' },
  { preco: 17.04, codigo: 'i0106', categoria: 'MERCADO (C)', nome: 'Caldo de Galinha und 1kg' },
  { preco: 28.98, codigo: 'i0295', categoria: 'MERCADO (C)', nome: 'Catchup Galão 3,5kg' },
  { preco: 139.99, codigo: 'i0218', categoria: 'MERCADO (C)', nome: 'Chocolate em Barra Meio Amargo und 2kg' },
  { preco: 44.47, codigo: 'i0219', categoria: 'MERCADO (C)', nome: 'Chocolate em pó und 1kg' },
  { preco: 15.92, codigo: 'i0116', categoria: 'MERCADO (C)', nome: 'Creme de leite und 1kg' },
  { preco: 24.97, codigo: 'i0250', categoria: 'MERCADO (C)', nome: 'Demi glace und 500g' },
  { preco: 12.80, codigo: 'i0117', categoria: 'MERCADO (C)', nome: 'Extrato de tomate 1,7kg' },
  { preco: 2.99, codigo: 'i0119', categoria: 'MERCADO (C)', nome: 'Farinha de Trigo und 1kg' },
  { preco: 16.29, codigo: 'i0120', categoria: 'MERCADO (C)', nome: 'Farinha Panko und 1kg' },
  { preco: 5.99, codigo: 'i0121', categoria: 'MERCADO (C)', nome: 'Feijão preto und 1kg' },
  { preco: 10.84, codigo: 'i0217', categoria: 'MERCADO (C)', nome: 'Fermento em pó und 250g' },
  { preco: 3.41, codigo: 'i0124', categoria: 'MERCADO (C)', nome: 'Fubá und 1kg' },
  { preco: 3.10, codigo: 'i0220', categoria: 'MERCADO (C)', nome: 'Iogurte Natural 170g' },
  { preco: 5.17, codigo: 'i0126', categoria: 'MERCADO (C)', nome: 'Leite 1L' },
  { preco: 5.93, codigo: 'i0214', categoria: 'MERCADO (C)', nome: 'Leite Condensado und 395g' },
  { preco: 19.90, codigo: 'i0073', categoria: 'MERCADO (C)', nome: 'Leite de coco und 1L' },
  { preco: 41.99, codigo: 'i0130', categoria: 'MERCADO (C)', nome: 'Maionese Hellmanns und 2,8kg' },
  { preco: 6.45, codigo: 'i0449', categoria: 'MERCADO (C)', nome: 'Massa de Pastel und 500g' },
  { preco: 7.44, codigo: 'i0136', categoria: 'MERCADO (C)', nome: 'Molho Inglês und 1L' },
  { preco: 49.69, codigo: 'i0512', categoria: 'MERCADO (C)', nome: 'Molho Shoyo und 1L' },
  { preco: 42.00, codigo: 'i0135', categoria: 'MERCADO (C)', nome: 'Mortadela Ouro kg' },
  { preco: 156.86, codigo: 'i0240', categoria: 'MERCADO (C)', nome: 'Óleo Balde und 15,8L' },
  { preco: 7.50, codigo: 'i0138', categoria: 'MERCADO (C)', nome: 'Oléo de soja und 900ml' },
  { preco: 86.32, codigo: 'i0147', categoria: 'MERCADO (C)', nome: 'Picles Inteiro (Pote Grande)' },
  { preco: 63.52, codigo: 'i0459', categoria: 'MERCADO (C)', nome: 'Requeijão Cremoso und 1,5kg' },
  { preco: 1.74, codigo: 'i0158', categoria: 'MERCADO (C)', nome: 'Sal Fino und 1kg' },
  { preco: 1.99, codigo: 'i0243', categoria: 'MERCADO (C)', nome: 'Sal grosso und 1kg' },
  { preco: 19.99, codigo: 'i0480', categoria: 'MERCADO (C)', nome: 'Sorvete de Creme 1L' },
  { preco: 34.90, codigo: 'i0340', categoria: 'MERCADO (C)', nome: 'Trigo para kibe und 5kg' },
  { preco: 16.80, codigo: 'i0168', categoria: 'MERCADO (C)', nome: 'Vinagre de Álcool und 5L' },
  { preco: 76.15, codigo: 'i0223', categoria: 'MERCADO (C)', nome: 'Vinho Tinto Seco und 4,5L' },

  // ============= COZINHA - PÃES =============
  { preco: 2.38, codigo: 'i0506', categoria: 'PÃES', nome: 'Pão Francês Baguete und' },
  { preco: 1.46, codigo: 'i0141', categoria: 'PÃES', nome: 'Pão Francês und' },
  { preco: 2.42, codigo: 'i0507', categoria: 'PÃES', nome: 'Pão Pretzel und' },
  { preco: 1.46, codigo: 'i0508', categoria: 'PÃES', nome: 'Pão Smash und' },

  // ============= COZINHA - PEIXE =============
  { preco: 37.00, codigo: 'i0235', categoria: 'PEIXE', nome: 'Filé de Peixe - Tilapia kg' },

  // ============= COZINHA - PROTEÍNA =============
  { preco: 24.24, codigo: 'i0101', categoria: 'PROTEÍNA', nome: 'Bacon Manta kg' },
  { preco: 24.99, codigo: 'i0103', categoria: 'PROTEÍNA', nome: 'Barriga de porco (Panceta) kg' },
  { preco: 3.19, codigo: 'i0493', categoria: 'PROTEÍNA', nome: 'Blend APF 100g und' },
  { preco: 4.04, codigo: 'i0492', categoria: 'PROTEÍNA', nome: 'Blend APF 150g und' },
  { preco: 45.39, codigo: 'i0115', categoria: 'PROTEÍNA', nome: 'Carne de sol de Coxão Duro kg' },
  { preco: 49.90, codigo: 'i0107', categoria: 'PROTEÍNA', nome: 'Carne de sol de Coxão Mole kg' },
  { preco: 29.90, codigo: 'i0455', categoria: 'PROTEÍNA', nome: 'Carne moída (Acem) Kg' },
  { preco: 35.90, codigo: 'i0108', categoria: 'PROTEÍNA', nome: 'Carne moída (Patinho) kg' },
  { preco: 40.00, codigo: 'i0109', categoria: 'PROTEÍNA', nome: 'Charque Traseiro kg' },
  { preco: 19.59, codigo: 'i0266', categoria: 'PROTEÍNA', nome: 'Copa Lombo kg' },
  { preco: 24.62, codigo: 'i0531', categoria: 'PROTEÍNA', nome: 'Coração de Frango kg' },
  { preco: 37.99, codigo: 'i0447', categoria: 'PROTEÍNA', nome: 'Cupim kg' },
  { preco: 16.80, codigo: 'i0143', categoria: 'PROTEÍNA', nome: 'Filé de Peito kg' },
  { preco: 68.00, codigo: 'i0122', categoria: 'PROTEÍNA', nome: 'Filé mignon 3/4 kg' },
  { preco: 9.33, codigo: 'i0123', categoria: 'PROTEÍNA', nome: 'Frango a passarinho (Seara)kg' },
  { preco: 21.71, codigo: 'i0513', categoria: 'PROTEÍNA', nome: 'Linguiça Toscana Suína (Seara/Perdigão)Kg' },
  { preco: 49.90, codigo: 'i0261', categoria: 'PROTEÍNA', nome: 'Linguiça Fina Apimentada kg' },
  { preco: 20.00, codigo: 'i0128', categoria: 'PROTEÍNA', nome: 'Linguiça Fina kg' },
  { preco: 8.60, codigo: 'i0574', categoria: 'PROTEÍNA', nome: 'Moela Kg' },

  // ============= SALÃO/BAR - ARTESANAL =============
  { preco: 11.60, codigo: 'i0203', categoria: 'Artesanal', nome: 'Colorado Appia 600ml' },
  { preco: 11.60, codigo: 'i0176', categoria: 'Artesanal', nome: 'Colorado Cauim 600mL' },
  { preco: 11.60, codigo: 'i0177', categoria: 'Artesanal', nome: 'Colorado Indica 600mL' },
  { preco: 12.50, codigo: 'i0178', categoria: 'Artesanal', nome: 'Colorado Ribeirão 600mL' },
  { preco: 8.99, codigo: 'i0180', categoria: 'Artesanal', nome: 'Goose Island IPA 330mL' },
  { preco: 8.00, codigo: 'i0181', categoria: 'Artesanal', nome: 'Goose Island Midway 330mL' },
  { preco: 6.35, codigo: 'i0184', categoria: 'Artesanal', nome: 'Hoegaarden 330ml' },
  { preco: 11.60, codigo: 'i0241', categoria: 'Artesanal', nome: 'Patagonia Bohemian 740ml' },
  { preco: 12.50, codigo: 'i0255', categoria: 'Artesanal', nome: 'Patagônia Ipa 740ml' },

  // ============= SALÃO/BAR - LATA =============
  { preco: 5.59, codigo: 'i0170', categoria: 'Lata', nome: 'Beats 269ml - Lata (Todos Juntos)' },
  { preco: 5.26, codigo: 'i0315', categoria: 'Lata', nome: 'Corona 350ml - Lata' },
  { preco: 6.18, codigo: 'i0533', categoria: 'Lata', nome: 'Corona 350ml Zero - Lata' },
  { preco: 4.18, codigo: 'i0483', categoria: 'Lata', nome: 'Spaten 350ml - Lata' },
  { preco: 4.52, codigo: 'i0537', categoria: 'Lata', nome: 'Stella Artois 330mL Pure Gold - Lata' },
  { preco: 7.09, codigo: 'i0208', categoria: 'Lata', nome: 'Xeque Mate 355mL - Lata' },

  // ============= SALÃO/BAR - LONG NECK =============
  { preco: 5.31, codigo: 'i0543', categoria: 'Long Neck', nome: 'Michelob Ultra 330ml - LN' },
  { preco: 6.27, codigo: 'i0542', categoria: 'Long Neck', nome: 'Colorado Ribeirão 355ml - LN' },
  { preco: 6.79, codigo: 'i0290', categoria: 'Long Neck', nome: 'Beats Gt 269ml - LN' },
  { preco: 6.79, codigo: 'i0251', categoria: 'Long Neck', nome: 'Beats 269ml - LN (todas juntas)' },
  { preco: 6.79, codigo: 'i0556', categoria: 'Long Neck', nome: 'Beats Tropical 269ml - LN' },
  { preco: 5.05, codigo: 'i0200', categoria: 'Long Neck', nome: 'Budweiser 330ml - LN' },
  { preco: 4.19, codigo: 'i0173', categoria: 'Long Neck', nome: 'Budweiser 330ml Zero - LN' },
  { preco: 5.84, codigo: 'i0179', categoria: 'Long Neck', nome: 'Corona 330ml - LN' },
  { preco: 6.18, codigo: 'i0234', categoria: 'Long Neck', nome: 'Corona 330ml Zero - LN' },
  { preco: 5.10, codigo: 'i0197', categoria: 'Long Neck', nome: 'Spaten 330ml - LN' },
  { preco: 5.70, codigo: 'i0199', categoria: 'Long Neck', nome: 'Stella Artois 330mL Pure Gold - LN' },

  // ============= SALÃO/BAR - MERCADO (S) =============
  { preco: 16.30, codigo: 'i0345', categoria: 'Mercado (S)', nome: 'Azeite Extra Virgem 500ml' },
  { preco: 7.00, codigo: 'i0438', categoria: 'Mercado (S)', nome: 'Gelo 11kg' },
  { preco: 4.00, codigo: 'i0327', categoria: 'Mercado (S)', nome: 'Molho de Pimenta 150ml' },

  // ============= SALÃO/BAR - NÃO-ALCÓOLICOS =============
  { preco: 1.69, codigo: 'i0084', categoria: 'Não-alcóolicos', nome: 'Água com gás 350ml' },
  { preco: 1.48, codigo: 'i0060', categoria: 'Não-alcóolicos', nome: 'Água sem gás 350ml' },
  { preco: 3.33, codigo: 'i0086', categoria: 'Não-alcóolicos', nome: 'Água Tônica 350ml - Lata' },
  { preco: 2.69, codigo: 'i0229', categoria: 'Não-alcóolicos', nome: 'Água Tônica 350ml Zero - Lata' },
  { preco: 2.61, codigo: 'i0182', categoria: 'Não-alcóolicos', nome: 'Refr. Guaraná 350ml' },
  { preco: 2.61, codigo: 'i0183', categoria: 'Não-alcóolicos', nome: 'Refr. Guaraná 350ml Zero' },
  { preco: 2.54, codigo: 'i0188', categoria: 'Não-alcóolicos', nome: 'Refr. Pepsi 350ml' },
  { preco: 2.54, codigo: 'i0189', categoria: 'Não-alcóolicos', nome: 'Refr. Pepsi 350ml Black' },
  { preco: 2.61, codigo: 'i0190', categoria: 'Não-alcóolicos', nome: 'Refr. Pepsi 350ml Twist' },
  { preco: 2.54, codigo: 'i0289', categoria: 'Não-alcóolicos', nome: 'Refr. Soda 350ml' },

  // ============= SALÃO/BAR - RETORNÁVEIS =============
  { preco: 10.99, codigo: 'i0252', categoria: 'Retornáveis', nome: 'Beck\'s 600mL' },
  { preco: 4.03, codigo: 'i0231', categoria: 'Retornáveis', nome: 'Bohemia 600mL' },
  { preco: 5.99, codigo: 'i0253', categoria: 'retornáveis', nome: 'Brahma Chopp 600ml' },
  { preco: 7.49, codigo: 'i0267', categoria: 'retornáveis', nome: 'Brahma Duplo Malte 600ml' },
  { preco: 6.42, codigo: 'i0232', categoria: 'Retornáveis', nome: 'Budweiser 600ml' },
  { preco: 363.12, codigo: 'i0254', categoria: 'Retornáveis', nome: 'Chopp Brahma 30L (cheio)' },
  { preco: 605.20, codigo: 'i0302', categoria: 'Retornáveis', nome: 'Chopp Brahma 50L (cheio)' },
  { preco: 150.00, codigo: 'i0332', categoria: 'Retornáveis', nome: 'Cilindro de CO2 (Cheio)' },
  { preco: 150.00, codigo: 'i0331', categoria: 'Retornáveis', nome: 'Cilindro de Nitrogênio (Cheio)' },
  { preco: 9.00, codigo: 'i0286', categoria: 'Retornáveis', nome: 'Corona 600ml' },
  { preco: 2.66, codigo: 'i0311', categoria: 'Retornáveis', nome: 'Original 300ml' },
  { preco: 7.24, codigo: 'i0186', categoria: 'Retornáveis', nome: 'Original 600mL' },
  { preco: 7.24, codigo: 'i0198', categoria: 'Retornáveis', nome: 'Spaten 600mL' },
  { preco: 8.00, codigo: 'i0201', categoria: 'Retornáveis', nome: 'Stella Artois 600ml' },

  // ============= SALÃO/BAR - VINHOS =============
  { preco: 39.69, codigo: 'i0317', categoria: 'Vinhos', nome: 'Esp. 1913 Sparkling Branco - Chardonay' },
  { preco: 39.69, codigo: 'i0318', categoria: 'Vinhos', nome: 'Esp. 1913 Sparkling Rosé - Malbec' },
  { preco: 52.90, codigo: 'i0278', categoria: 'Vinhos', nome: 'Espumante Unus Brut 750ml' },
  { preco: 170.00, codigo: 'i0464', categoria: 'Vinhos', nome: 'V. Angelica Zapata Carb. Sauv. 750ml' },
  { preco: 60.94, codigo: 'i0321', categoria: 'Vinhos', nome: 'V. Aradon Branco - Blend' },
  { preco: 60.94, codigo: 'i0324', categoria: 'Vinhos', nome: 'V. Aradon Tinto - Blend' },
  { preco: 88.00, codigo: 'i0462', categoria: 'Vinhos', nome: 'V. Basco Loco Rose 750ml' },
  { preco: 129.00, codigo: 'i0439', categoria: 'Vinhos', nome: 'V. Caure Syrah Rose 750ml' },
  { preco: 38.89, codigo: 'i0322', categoria: 'Vinhos', nome: 'V. Donoso Tinto - Carb. Sauvignon' },
  { preco: 68.00, codigo: 'i0463', categoria: 'Vinhos', nome: 'V. La Paloma Rose 750ml' },
  { preco: 64.33, codigo: 'i0325', categoria: 'Vinhos', nome: 'V. Pavillon La Tourelle Tinto - Merlot e Carb. Souv.' },
  { preco: 36.54, codigo: 'i0320', categoria: 'Vinhos', nome: 'V. 4 Estaciones Branco - Torrontés' },
  { preco: 36.54, codigo: 'i0319', categoria: 'Vinhos', nome: 'V. 4 Estaciones Rosé - Malbec' },
  { preco: 61.88, codigo: 'i0451', categoria: 'Vinhos', nome: 'V. 4 Estaciones Tinto - Malbec' },
  { preco: 41.99, codigo: 'i0323', categoria: 'Vinhos', nome: 'V. Toscanini Tinto - Merlot' },

  // ============= FUNCIONÁRIOS - HORTIFRUTI (F) =============
  { preco: 2.35, codigo: 'i0549', categoria: 'HORTIFRUTI (F)', nome: 'Abóbora Japonesa' },
  { preco: 6.00, codigo: 'i0446', categoria: 'HORTIFRUTI (F)', nome: 'Acelga mç' },
  { preco: 4.00, codigo: 'i0442', categoria: 'HORTIFRUTI (F)', nome: 'Agrião mç' },
  { preco: 2.00, codigo: 'i0453', categoria: 'HORTIFRUTI (F)', nome: 'Alface Crespa und' },
  { preco: 10.00, codigo: 'i0481', categoria: 'HORTIFRUTI (F)', nome: 'Banana Kg' },
  { preco: 29.90, codigo: 'i0455', categoria: 'HORTIFRUTI (F)', nome: 'Beterraba kg' },
  { preco: 5.00, codigo: 'i0474', categoria: 'HORTIFRUTI (F)', nome: 'Brócolis mç' },
  { preco: 3.50, codigo: 'i0224', categoria: 'HORTIFRUTI (F)', nome: 'Cenoura kg' },
  { preco: 3.50, codigo: 'i0475', categoria: 'HORTIFRUTI (F)', nome: 'Couve Picada pct' },
  { preco: 6.00, codigo: 'i0560', categoria: 'HORTIFRUTI (F)', nome: 'Couve Flor und' },
  { preco: 7.00, codigo: 'i0473', categoria: 'HORTIFRUTI (F)', nome: 'Jiló kg' },
  { preco: 6.00, codigo: 'i0044', categoria: 'HORTIFRUTI (F)', nome: 'Manga Tommy MaduraKg' },
  { preco: 4.30, codigo: 'i0046', categoria: 'HORTIFRUTI (F)', nome: 'Pepino Japones kg' },
  { preco: 70.00, codigo: 'i0540', categoria: 'HORTIFRUTI (F)', nome: 'Pimenta Biquinho' },
  { preco: 10.00, codigo: 'i0454', categoria: 'HORTIFRUTI (F)', nome: 'Pimenta de Cheiro kg' },
  { preco: 7.50, codigo: 'i0293', categoria: 'HORTIFRUTI (F)', nome: 'Pimentão Verde kg' },
  { preco: 10.50, codigo: 'i0550', categoria: 'HORTIFRUTI (F)', nome: 'Quiabo kg' },
  { preco: 3.00, codigo: 'i0316', categoria: 'HORTIFRUTI (F)', nome: 'Repolho Branco und' },
  { preco: 2.50, codigo: 'i0443', categoria: 'HORTIFRUTI (F)', nome: 'Rúcula mç' },
  { preco: 3.80, codigo: 'i0166', categoria: 'HORTIFRUTI (F)', nome: 'Tomate Extra kg' },

  // ============= FUNCIONÁRIOS - MERCADO (F) =============
  { preco: 20.69, codigo: 'i0467', categoria: 'MERCADO (F)', nome: 'Arroz 5kg' },
  { preco: 44.49, codigo: 'i0547', categoria: 'MERCADO (F)', nome: 'Azeitona verde Inteira 1,8kg' },
  { preco: 18.16, codigo: 'i0485', categoria: 'MERCADO (F)', nome: 'Batata Palha 800g' },
  { preco: 34.52, codigo: 'i0062', categoria: 'MERCADO (F)', nome: 'Café pó 500g' },
  { preco: 2.14, codigo: 'i0564', categoria: 'MERCADO (F)', nome: 'Cuscuz Flocão' },
  { preco: 27.04, codigo: 'i0546', categoria: 'MERCADO (F)', nome: 'Ervilha kg' },
  { preco: 12.80, codigo: 'i0117', categoria: 'MERCADO (F)', nome: 'Extrato de tomate 1,7kg' },
  { preco: 4.75, codigo: 'i0118', categoria: 'MERCADO (F)', nome: 'Farinha de mandioca amarela und 1kg' },
  { preco: 5.72, codigo: 'i0299', categoria: 'MERCADO (F)', nome: 'Feijão Carioca 1kg' },
  { preco: 5.50, codigo: 'i0544', categoria: 'MERCADO (F)', nome: 'Macarrão Parafuso' },
  { preco: 3.74, codigo: 'i0545', categoria: 'MERCADO (F)', nome: 'Macarrão Penne' },
  { preco: 1.95, codigo: 'i0477', categoria: 'MERCADO (F)', nome: 'Macarrão Semola Espaguete 1kg' },
  { preco: 13.37, codigo: 'i0510', categoria: 'MERCADO (F)', nome: 'Margarina S/sal 1Kg' },
  { preco: 20.62, codigo: 'i0478', categoria: 'MERCADO (F)', nome: 'Milho lata grande' },
  { preco: 27.90, codigo: 'i0297', categoria: 'MERCADO (F)', nome: 'Mostarda und 3,3kg' },
  { preco: 22.13, codigo: 'i0554', categoria: 'MERCADO (F)', nome: 'Presunto kg' },
  { preco: 5.39, codigo: 'i0569', categoria: 'MERCADO (F)', nome: 'Sardinha Lata' },

  // ============= FUNCIONÁRIOS - PROTEÍNA (F) =============
  { preco: 26.00, codigo: 'i0573', categoria: 'PROTEÍNA (F)', nome: 'Acém inteiro kg' },
  { preco: 26.50, codigo: 'i0552', categoria: 'PROTEÍNA (F)', nome: 'Alcatra - Aranha Kg' },
  { preco: 15.99, codigo: 'i0470', categoria: 'PROTEÍNA (F)', nome: 'Bistequa kg' },
  { preco: 29.00, codigo: 'i0486', categoria: 'PROTEÍNA (F)', nome: 'Calabresa Kg' },
  { preco: 29.90, codigo: 'i0455', categoria: 'PROTEÍNA (F)', nome: 'Carne moída kg' },
  { preco: 24.62, codigo: 'i0531', categoria: 'PROTEÍNA (F)', nome: 'Coração Kg' },
  { preco: 19.99, codigo: 'i0498', categoria: 'PROTEÍNA (F)', nome: 'Costela Bovina kg' },
  { preco: 11.70, codigo: 'i0468', categoria: 'PROTEÍNA (F)', nome: 'Coxa Sobrecoxa Sem Dorso' },
  { preco: 45.39, codigo: 'i0115', categoria: 'PROTEÍNA (F)', nome: 'Coxão Duro Kg' },
  { preco: 12.99, codigo: 'i0471', categoria: 'PROTEÍNA (F)', nome: 'Coxinha da Asa kg' },
  { preco: 11.50, codigo: 'i0555', categoria: 'PROTEÍNA (F)', nome: 'Filé de Peito com Osso kg' },
  { preco: 16.80, codigo: 'i0143', categoria: 'PROTEÍNA (F)', nome: 'Filé de Peito kg' },
  { preco: 24.99, codigo: 'i0572', categoria: 'PROTEÍNA (F)', nome: 'Filezinho Suino Kg' },
  { preco: 31.50, codigo: 'i0553', categoria: 'PROTEÍNA (F)', nome: 'Fraldinha (Diafragma) Bovina Kg' },
  { preco: 19.89, codigo: 'i0516', categoria: 'PROTEÍNA (F)', nome: 'Linguiça Toscana Frango kg' },
  { preco: 13.00, codigo: 'i0557', categoria: 'PROTEÍNA (F)', nome: 'Meio da Asa Kg' },
  { preco: 18.49, codigo: 'i0570', categoria: 'PROTEÍNA (F)', nome: 'Paleta Suína Kg' },
  { preco: 25.99, codigo: 'i0548', categoria: 'PROTEÍNA (F)', nome: 'Peito Bovino Kg' },
  { preco: 26.99, codigo: 'i0571', categoria: 'PROTEÍNA (F)', nome: 'Picanha Suína Kg' },
  { preco: 7.50, codigo: 'i0538', categoria: 'PROTEÍNA (F)', nome: 'Salsicha Kg' },
];

// Função para cadastrar um insumo
async function cadastrarInsumo(insumo) {
  const unidade = determinarUnidadeMedida(insumo.nome, insumo.codigo);
  const tipo_local = determinarTipoLocal(insumo.categoria, insumo.nome);

  const payload = {
    codigo: insumo.codigo,
    nome: insumo.nome,
    categoria: insumo.categoria,
    tipo_local: tipo_local,
    unidade_medida: unidade,
    custo_unitario: insumo.preco,
    observacoes: `Área: ${insumo.categoria}`,
    bar_id: BAR_ID,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/operacional/receitas/insumos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ ${insumo.codigo} - ${insumo.nome} (${unidade}) - ${tipo_local}`);
      return { success: true, insumo: payload };
    } else {
      console.error(`❌ ${insumo.codigo} - ${result.error || 'Erro desconhecido'}`);
      return { success: false, error: result.error, insumo: payload };
    }
  } catch (error) {
    console.error(`❌ ${insumo.codigo} - Erro de rede: ${error.message}`);
    return { success: false, error: error.message, insumo: payload };
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando cadastro de insumos no Zykor...\n');
  console.log(`📊 Total de insumos a cadastrar: ${insumos.length}\n`);

  const resultados = {
    sucesso: 0,
    erro: 0,
    erros: [],
  };

  // Processar em lotes para não sobrecarregar
  const BATCH_SIZE = 10;
  for (let i = 0; i < insumos.length; i += BATCH_SIZE) {
    const batch = insumos.slice(i, i + BATCH_SIZE);
    const promises = batch.map(insumo => cadastrarInsumo(insumo));
    const results = await Promise.all(promises);

    results.forEach(result => {
      if (result.success) {
        resultados.sucesso++;
      } else {
        resultados.erro++;
        resultados.erros.push(result);
      }
    });

    // Aguardar um pouco entre lotes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO CADASTRO');
  console.log('='.repeat(60));
  console.log(`✅ Sucesso: ${resultados.sucesso}`);
  console.log(`❌ Erros: ${resultados.erro}`);
  console.log(`📦 Total: ${insumos.length}`);

  if (resultados.erros.length > 0) {
    console.log('\n❌ Insumos com erro:');
    resultados.erros.forEach(erro => {
      console.log(`   - ${erro.insumo.codigo}: ${erro.error}`);
    });
  }

  console.log('\n✅ Cadastro concluído!\n');
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

