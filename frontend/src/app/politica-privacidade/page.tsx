export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-8 space-y-8">
            
            {/* Header */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ðŸ”’ Polá­tica de Privacidade
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>ášltima atualizaá§á£o:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                <p><strong>Versá£o:</strong> 1.0</p>
                <p><strong>Lei aplicá¡vel:</strong> LGPD nº 13.709/2018</p>
              </div>
            </div>

            {/* Introduá§á£o */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                1. Introduá§á£o
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta Polá­tica de Privacidade descreve como o <strong>Sistema de Gestá£o de Bares (SGB)</strong> 
                  coleta, usa, armazena e protege suas informaá§áµes pessoais, em conformidade com a 
                  <strong> Lei Geral de Proteá§á£o de Dados (LGPD - Lei nº 13.709/2018)</strong>.
                </p>
                <p>
                  Nosso compromisso á© garantir a transparáªncia no tratamento dos seus dados pessoais 
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
                <h3 className="text-lg font-medium">2.1 Dados fornecidos diretamente por vocáª:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de identificaá§á£o:</strong> Nome completo, email, telefone</li>
                  <li><strong>Dados de acesso:</strong> Senha (criptografada), preferáªncias de usuá¡rio</li>
                  <li><strong>Dados profissionais:</strong> Cargo, funá§á£o, estabelecimento associado</li>
                  <li><strong>Dados de comunicaá§á£o:</strong> Mensagens, suporte, feedback</li>
                </ul>

                <h3 className="text-lg font-medium">2.2 Dados coletados automaticamente:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de navegaá§á£o:</strong> Endereá§o IP, tipo de navegador, sistema operacional</li>
                  <li><strong>Dados de uso:</strong> Pá¡ginas acessadas, tempo de permanáªncia, funcionalidades utilizadas</li>
                  <li><strong>Dados tá©cnicos:</strong> Logs de sistema, dados de performance, má©tricas de uso</li>
                  <li><strong>Cookies:</strong> Conforme sua preferáªncia (veja seá§á£o especá­fica)</li>
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
                      ðŸ“‹ Operacionais
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>€¢ Autenticaá§á£o e controle de acesso</li>
                      <li>€¢ Gestá£o de checklists e operaá§áµes</li>
                      <li>€¢ Relatá³rios e aná¡lises de negá³cio</li>
                      <li>€¢ Suporte tá©cnico e atendimento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                      ðŸ“Š Analytics
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>€¢ Melhoria da experiáªncia do usuá¡rio</li>
                      <li>€¢ Desenvolvimento de novas funcionalidades</li>
                      <li>€¢ Aná¡lise de performance do sistema</li>
                      <li>€¢ Estatá­sticas de uso (anonimizadas)</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                      ðŸ”’ Seguraná§a
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>€¢ Prevená§á£o de fraudes e abusos</li>
                      <li>€¢ Monitoramento de seguraná§a</li>
                      <li>€¢ Backup e recuperaá§á£o de dados</li>
                      <li>€¢ Auditoria e compliance</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                      š–ï¸ Legal
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>€¢ Cumprimento de obrigaá§áµes legais</li>
                      <li>€¢ Defesa em processos judiciais</li>
                      <li>€¢ Exercá­cio regular de direitos</li>
                      <li>€¢ Retená§á£o para fins de auditoria</li>
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
                <p>O tratamento dos seus dados pessoais está¡ fundamentado nas seguintes bases legais:</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 text-xl">œ“</span>
                      <div>
                        <strong>Consentimento (Art. 7º, I):</strong> Para cookies ná£o essenciais, marketing personalizado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl">ðŸ“‹</span>
                      <div>
                        <strong>Execuá§á£o de contrato (Art. 7º, V):</strong> Para prestaá§á£o do serviá§o contratado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">š–ï¸</span>
                      <div>
                        <strong>Cumprimento de obrigaá§á£o legal (Art. 7º, II):</strong> Para retená§á£o fiscal e trabalhista
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 text-xl">ðŸŽ¯</span>
                      <div>
                        <strong>Legá­timo interesse (Art. 7º, IX):</strong> Para seguraná§a, prevená§á£o de fraudes e melhoria do serviá§o
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
                  Utilizamos cookies e tecnologias similares para melhorar sua experiáªncia. 
                  Vocáª pode gerenciar suas preferáªncias a qualquer momento em 
                  <a href="/configuracoes/privacidade" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Configuraá§áµes de Privacidade
                  </a>.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo</th>
                        <th className="px-4 py-2 text-left font-medium">Finalidade</th>
                        <th className="px-4 py-2 text-left font-medium">Obrigatá³rio</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2 font-medium">Essenciais</td>
                        <td className="px-4 py-2">Autenticaá§á£o, seguraná§a</td>
                        <td className="px-4 py-2 text-green-600">Sim</td>
                        <td className="px-4 py-2">Sessá£o</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Analytics</td>
                        <td className="px-4 py-2">Aná¡lise de uso, má©tricas</td>
                        <td className="px-4 py-2 text-red-600">Ná£o</td>
                        <td className="px-4 py-2">2 anos</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Marketing</td>
                        <td className="px-4 py-2">Publicidade personalizada</td>
                        <td className="px-4 py-2 text-red-600">Ná£o</td>
                        <td className="px-4 py-2">1 ano</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Funcionais</td>
                        <td className="px-4 py-2">Recursos adicionais</td>
                        <td className="px-4 py-2 text-red-600">Ná£o</td>
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
                <p>Como titular de dados pessoais, vocáª possui os seguintes direitos:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      ðŸ‘ï¸ Acesso e Informaá§á£o
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>€¢ Confirmaá§á£o da existáªncia de tratamento</li>
                      <li>€¢ Acesso aos dados pessoais</li>
                      <li>€¢ Informaá§áµes sobre uso e compartilhamento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                      œï¸ Correá§á£o e Atualizaá§á£o
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>€¢ Correá§á£o de dados incompletos</li>
                      <li>€¢ Atualizaá§á£o de dados desatualizados</li>
                      <li>€¢ Retificaá§á£o de dados incorretos</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                      ðŸ—‘ï¸ Exclusá£o e Esquecimento
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>€¢ Eliminaá§á£o de dados desnecessá¡rios</li>
                      <li>€¢ Anonimizaá§á£o quando possá­vel</li>
                      <li>€¢ Bloqueio de dados irregulares</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                      ðŸ“¤ Portabilidade e Controle
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>€¢ Portabilidade dos dados</li>
                      <li>€¢ Revogaá§á£o do consentimento</li>
                      <li>€¢ Oposiá§á£o ao tratamento</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    š¡ Como exercer seus direitos:
                  </h4>
                  <p className="text-sm">
                    Acesse o <a href="/configuracoes/privacidade" className="font-medium underline">Centro de Privacidade</a> ou 
                    entre em contato com nosso DPO atravá©s do email 
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
                  <strong>Ná£o vendemos</strong> seus dados pessoais. Podemos compartilhar informaá§áµes apenas nas seguintes situaá§áµes:
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">ðŸ¤</span>
                    <div>
                      <strong>Prestadores de serviá§os:</strong> Empresas que nos auxiliam na prestaá§á£o do serviá§o 
                      (hospedagem, analytics, suporte), sempre com contratos adequados de proteá§á£o.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 text-xl">š–ï¸</span>
                    <div>
                      <strong>Obrigaá§áµes legais:</strong> Quando exigido por lei, ordem judicial ou á³rgá£os reguladores.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">ðŸ”’</span>
                    <div>
                      <strong>Proteá§á£o de direitos:</strong> Para proteger nossos direitos, privacidade, seguraná§a 
                      ou propriedade, ou de terceiros.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 text-xl">ðŸ“Š</span>
                    <div>
                      <strong>Dados anonimizados:</strong> Informaá§áµes estatá­sticas e anonimizadas para fins de pesquisa e desenvolvimento.
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Seguraná§a */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                8. Seguraná§a dos Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Implementamos medidas tá©cnicas e organizacionais apropriadas para proteger seus dados:</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-3xl mb-2">ðŸ”</div>
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Criptografia</h4>
                    <p className="text-sm">Dados em trá¢nsito e em repouso protegidos com criptografia AES-256</p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-3xl mb-2">ðŸ›¡ï¸</div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Controle de Acesso</h4>
                    <p className="text-sm">Autenticaá§á£o multifator e princá­pio do menor privilá©gio</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-3xl mb-2">ðŸ“Š</div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Monitoramento</h4>
                    <p className="text-sm">Logs de auditoria e monitoramento contá­nuo de seguraná§a</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Retená§á£o */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                9. Retená§á£o de Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Mantemos seus dados pessoais apenas pelo tempo necessá¡rio para as finalidades descritas:</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo de Dado</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo de Retená§á£o</th>
                        <th className="px-4 py-2 text-left font-medium">Base Legal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2">Dados de cadastro</td>
                        <td className="px-4 py-2">Atá© solicitaá§á£o de exclusá£o</td>
                        <td className="px-4 py-2">Consentimento</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Dados operacionais</td>
                        <td className="px-4 py-2">5 anos apá³s tá©rmino</td>
                        <td className="px-4 py-2">Obrigaá§á£o legal</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Logs de seguraná§a</td>
                        <td className="px-4 py-2">2 anos</td>
                        <td className="px-4 py-2">Legá­timo interesse</td>
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
                10. Encarregado de Proteá§á£o de Dados (DPO)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Para exercer seus direitos, esclarecer dáºvidas ou reportar incidentes relacionados 
                  á  proteá§á£o de dados, entre em contato com nosso DPO:
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">ðŸ“§</div>
                      <strong>Email:</strong><br />
                      <a href="mailto:privacy@seusite.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                        privacy@seusite.com
                      </a>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">ðŸ“ž</div>
                      <strong>Telefone:</strong><br />
                      <a href="tel:+5511999999999" className="text-blue-600 dark:text-blue-400 hover:underline">
                        (11) 99999-9999
                      </a>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">ðŸ“</div>
                      <strong>Endereá§o:</strong><br />
                      Rua Exemplo, 123<br />
                      Sá£o Paulo - SP
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Alteraá§áµes */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                11. Alteraá§áµes na Polá­tica
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta Polá­tica de Privacidade pode ser atualizada periodicamente. Alteraá§áµes significativas 
                  será£o comunicadas atravá©s de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Notificaá§á£o no sistema</li>
                  <li>Email para o endereá§o cadastrado</li>
                  <li>Aviso na pá¡gina inicial</li>
                  <li>Novo banner de consentimento (se aplicá¡vel)</li>
                </ul>
                <p>
                  Recomendamos que revise esta polá­tica regularmente para se manter informado sobre 
                  como protegemos seus dados.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <p>ðŸ“‹ <strong>Documento:</strong> Polá­tica de Privacidade</p>
                <p>š–ï¸ <strong>Lei aplicá¡vel:</strong> LGPD nº 13.709/2018 e Marco Civil da Internet</p>
                <p>ðŸ“… <strong>Vigáªncia:</strong> A partir de {new Date().toLocaleDateString('pt-BR')}</p>
                <p>
                  ðŸ”— <strong>Links áºteis:</strong> 
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
