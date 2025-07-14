export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-8 space-y-8">
            
            {/* Header */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                🔒 Política de Privacidade
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                <p><strong>Versão:</strong> 1.0</p>
                <p><strong>Lei aplicável:</strong> LGPD nº 13.709/2018</p>
              </div>
            </div>

            {/* Introdução */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                1. Introdução
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta Política de Privacidade descreve como o <strong>Sistema de Gestão de Bares (SGB)</strong> 
                  coleta, usa, armazena e protege suas informações pessoais, em conformidade com a 
                  <strong> Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
                </p>
                <p>
                  Nosso compromisso é garantir a transparência no tratamento dos seus dados pessoais 
                  e respeitar todos os seus direitos como titular de dados.
                </p>
              </div>
            </section>

            {/* Dados Coletados */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                2. Dados Pessoais Coletados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <h3 className="text-lg font-medium">2.1 Dados fornecidos diretamente por você:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de identificação:</strong> Nome completo, email, telefone</li>
                  <li><strong>Dados de acesso:</strong> Senha (criptografada), preferências de usuário</li>
                  <li><strong>Dados profissionais:</strong> Cargo, função, estabelecimento associado</li>
                  <li><strong>Dados de comunicação:</strong> Mensagens, suporte, feedback</li>
                </ul>

                <h3 className="text-lg font-medium">2.2 Dados coletados automaticamente:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de navegação:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
                  <li><strong>Dados de uso:</strong> Páginas acessadas, tempo de permanência, funcionalidades utilizadas</li>
                  <li><strong>Dados técnicos:</strong> Logs de sistema, dados de performance, métricas de uso</li>
                  <li><strong>Cookies:</strong> Conforme sua preferência (veja seção específica)</li>
                </ul>
              </div>
            </section>

            {/* Finalidades */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                3. Finalidades do Tratamento
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Tratamos seus dados pessoais para as seguintes finalidades:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      📋 Operacionais
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Autenticação e controle de acesso</li>
                      <li>• Gestão de checklists e operações</li>
                      <li>• Relatórios e análises de negócio</li>
                      <li>• Suporte técnico e atendimento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                      📊 Analytics
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Melhoria da experiência do usuário</li>
                      <li>• Desenvolvimento de novas funcionalidades</li>
                      <li>• Análise de performance do sistema</li>
                      <li>• Estatísticas de uso (anonimizadas)</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                      🔒 Segurança
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Prevenção de fraudes e abusos</li>
                      <li>• Monitoramento de segurança</li>
                      <li>• Backup e recuperação de dados</li>
                      <li>• Auditoria e compliance</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                      ⚖️ Legal
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Cumprimento de obrigações legais</li>
                      <li>• Defesa em processos judiciais</li>
                      <li>• Exercício regular de direitos</li>
                      <li>• Retenção para fins de auditoria</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Base Legal */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                4. Base Legal (Art. 7º LGPD)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>O tratamento dos seus dados pessoais está fundamentado nas seguintes bases legais:</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 text-xl">✓</span>
                      <div>
                        <strong>Consentimento (Art. 7º, I):</strong> Para cookies não essenciais, marketing personalizado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl">📋</span>
                      <div>
                        <strong>Execução de contrato (Art. 7º, V):</strong> Para prestação do serviço contratado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">⚖️</span>
                      <div>
                        <strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> Para retenção fiscal e trabalhista
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 text-xl">🎯</span>
                      <div>
                        <strong>Legítimo interesse (Art. 7º, IX):</strong> Para segurança, prevenção de fraudes e melhoria do serviço
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                5. Cookies e Tecnologias Similares
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência. 
                  Você pode gerenciar suas preferências a qualquer momento em 
                  <a href="/configuracoes/privacidade" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Configurações de Privacidade
                  </a>.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo</th>
                        <th className="px-4 py-2 text-left font-medium">Finalidade</th>
                        <th className="px-4 py-2 text-left font-medium">Obrigatório</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2 font-medium">Essenciais</td>
                        <td className="px-4 py-2">Autenticação, segurança</td>
                        <td className="px-4 py-2 text-green-600">Sim</td>
                        <td className="px-4 py-2">Sessão</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Analytics</td>
                        <td className="px-4 py-2">Análise de uso, métricas</td>
                        <td className="px-4 py-2 text-red-600">Não</td>
                        <td className="px-4 py-2">2 anos</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Marketing</td>
                        <td className="px-4 py-2">Publicidade personalizada</td>
                        <td className="px-4 py-2 text-red-600">Não</td>
                        <td className="px-4 py-2">1 ano</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Funcionais</td>
                        <td className="px-4 py-2">Recursos adicionais</td>
                        <td className="px-4 py-2 text-red-600">Não</td>
                        <td className="px-4 py-2">6 meses</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Direitos do Titular */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                6. Seus Direitos (Art. 18 LGPD)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Como titular de dados pessoais, você possui os seguintes direitos:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      👁️ Acesso e Informação
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Confirmação da existência de tratamento</li>
                      <li>• Acesso aos dados pessoais</li>
                      <li>• Informações sobre uso e compartilhamento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                      ✏️ Correção e Atualização
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Correção de dados incompletos</li>
                      <li>• Atualização de dados desatualizados</li>
                      <li>• Retificação de dados incorretos</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                      🗑️ Exclusão e Esquecimento
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Eliminação de dados desnecessários</li>
                      <li>• Anonimização quando possível</li>
                      <li>• Bloqueio de dados irregulares</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                      📤 Portabilidade e Controle
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Portabilidade dos dados</li>
                      <li>• Revogação do consentimento</li>
                      <li>• Oposição ao tratamento</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    ⚡ Como exercer seus direitos:
                  </h4>
                  <p className="text-sm">
                    Acesse o <a href="/configuracoes/privacidade" className="font-medium underline">Centro de Privacidade</a> ou 
                    entre em contato com nosso DPO através do email 
                    <a href="mailto:privacy@seusite.com" className="font-medium underline">privacy@seusite.com</a>
                  </p>
                </div>
              </div>
            </section>

            {/* Compartilhamento */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                7. Compartilhamento de Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  <strong>Não vendemos</strong> seus dados pessoais. Podemos compartilhar informações apenas nas seguintes situações:
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">🤝</span>
                    <div>
                      <strong>Prestadores de serviços:</strong> Empresas que nos auxiliam na prestação do serviço 
                      (hospedagem, analytics, suporte), sempre com contratos adequados de proteção.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 text-xl">⚖️</span>
                    <div>
                      <strong>Obrigações legais:</strong> Quando exigido por lei, ordem judicial ou órgãos reguladores.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">🔒</span>
                    <div>
                      <strong>Proteção de direitos:</strong> Para proteger nossos direitos, privacidade, segurança 
                      ou propriedade, ou de terceiros.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 text-xl">📊</span>
                    <div>
                      <strong>Dados anonimizados:</strong> Informações estatísticas e anonimizadas para fins de pesquisa e desenvolvimento.
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Segurança */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                8. Segurança dos Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados:</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-3xl mb-2">🔐</div>
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Criptografia</h4>
                    <p className="text-sm">Dados em trânsito e em repouso protegidos com criptografia AES-256</p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-3xl mb-2">🛡️</div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Controle de Acesso</h4>
                    <p className="text-sm">Autenticação multifator e princípio do menor privilégio</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-3xl mb-2">📊</div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Monitoramento</h4>
                    <p className="text-sm">Logs de auditoria e monitoramento contínuo de segurança</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Retenção */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                9. Retenção de Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Mantemos seus dados pessoais apenas pelo tempo necessário para as finalidades descritas:</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo de Dado</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo de Retenção</th>
                        <th className="px-4 py-2 text-left font-medium">Base Legal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2">Dados de cadastro</td>
                        <td className="px-4 py-2">Até solicitação de exclusão</td>
                        <td className="px-4 py-2">Consentimento</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Dados operacionais</td>
                        <td className="px-4 py-2">5 anos após término</td>
                        <td className="px-4 py-2">Obrigação legal</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Logs de segurança</td>
                        <td className="px-4 py-2">2 anos</td>
                        <td className="px-4 py-2">Legítimo interesse</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Cookies analytics</td>
                        <td className="px-4 py-2">26 meses</td>
                        <td className="px-4 py-2">Consentimento</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Contato DPO */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                10. Encarregado de Proteção de Dados (DPO)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Para exercer seus direitos, esclarecer dúvidas ou reportar incidentes relacionados 
                  à proteção de dados, entre em contato com nosso DPO:
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📧</div>
                      <strong>Email:</strong><br />
                      <a href="mailto:privacy@seusite.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                        privacy@seusite.com
                      </a>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">📞</div>
                      <strong>Telefone:</strong><br />
                      <a href="tel:+5511999999999" className="text-blue-600 dark:text-blue-400 hover:underline">
                        (11) 99999-9999
                      </a>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">📍</div>
                      <strong>Endereço:</strong><br />
                      Rua Exemplo, 123<br />
                      São Paulo - SP
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Alterações */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                11. Alterações na Política
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta Política de Privacidade pode ser atualizada periodicamente. Alterações significativas 
                  serão comunicadas através de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Notificação no sistema</li>
                  <li>Email para o endereço cadastrado</li>
                  <li>Aviso na página inicial</li>
                  <li>Novo banner de consentimento (se aplicável)</li>
                </ul>
                <p>
                  Recomendamos que revise esta política regularmente para se manter informado sobre 
                  como protegemos seus dados.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <p>📋 <strong>Documento:</strong> Política de Privacidade</p>
                <p>⚖️ <strong>Lei aplicável:</strong> LGPD nº 13.709/2018 e Marco Civil da Internet</p>
                <p>📅 <strong>Vigência:</strong> A partir de {new Date().toLocaleDateString('pt-BR')}</p>
                <p>
                  🔗 <strong>Links úteis:</strong> 
                  <a href="/configuracoes/privacidade" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                    Centro de Privacidade
                  </a> | 
                  <a href="mailto:privacy@seusite.com" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                    Contato DPO
                  </a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
} 