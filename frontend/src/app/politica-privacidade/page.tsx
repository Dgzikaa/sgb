export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-8 space-y-8">
            
            {/* Header */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                üîí Pol·≠tica de Privacidade
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>·öltima atualiza·ß·£o:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                <p><strong>Vers·£o:</strong> 1.0</p>
                <p><strong>Lei aplic·°vel:</strong> LGPD n∫ 13.709/2018</p>
              </div>
            </div>

            {/* Introdu·ß·£o */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                1. Introdu·ß·£o
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta Pol·≠tica de Privacidade descreve como o <strong>Sistema de Gest·£o de Bares (SGB)</strong> 
                  coleta, usa, armazena e protege suas informa·ß·µes pessoais, em conformidade com a 
                  <strong> Lei Geral de Prote·ß·£o de Dados (LGPD - Lei n∫ 13.709/2018)</strong>.
                </p>
                <p>
                  Nosso compromisso ·© garantir a transpar·™ncia no tratamento dos seus dados pessoais 
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
                <h3 className="text-lg font-medium">2.1 Dados fornecidos diretamente por voc·™:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de identifica·ß·£o:</strong> Nome completo, email, telefone</li>
                  <li><strong>Dados de acesso:</strong> Senha (criptografada), prefer·™ncias de usu·°rio</li>
                  <li><strong>Dados profissionais:</strong> Cargo, fun·ß·£o, estabelecimento associado</li>
                  <li><strong>Dados de comunica·ß·£o:</strong> Mensagens, suporte, feedback</li>
                </ul>

                <h3 className="text-lg font-medium">2.2 Dados coletados automaticamente:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de navega·ß·£o:</strong> Endere·ßo IP, tipo de navegador, sistema operacional</li>
                  <li><strong>Dados de uso:</strong> P·°ginas acessadas, tempo de perman·™ncia, funcionalidades utilizadas</li>
                  <li><strong>Dados t·©cnicos:</strong> Logs de sistema, dados de performance, m·©tricas de uso</li>
                  <li><strong>Cookies:</strong> Conforme sua prefer·™ncia (veja se·ß·£o espec·≠fica)</li>
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
                      üìã Operacionais
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>Ä¢ Autentica·ß·£o e controle de acesso</li>
                      <li>Ä¢ Gest·£o de checklists e opera·ß·µes</li>
                      <li>Ä¢ Relat·≥rios e an·°lises de neg·≥cio</li>
                      <li>Ä¢ Suporte t·©cnico e atendimento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                      üìä Analytics
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>Ä¢ Melhoria da experi·™ncia do usu·°rio</li>
                      <li>Ä¢ Desenvolvimento de novas funcionalidades</li>
                      <li>Ä¢ An·°lise de performance do sistema</li>
                      <li>Ä¢ Estat·≠sticas de uso (anonimizadas)</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                      üîí Seguran·ßa
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>Ä¢ Preven·ß·£o de fraudes e abusos</li>
                      <li>Ä¢ Monitoramento de seguran·ßa</li>
                      <li>Ä¢ Backup e recupera·ß·£o de dados</li>
                      <li>Ä¢ Auditoria e compliance</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                      öñÔ∏è Legal
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>Ä¢ Cumprimento de obriga·ß·µes legais</li>
                      <li>Ä¢ Defesa em processos judiciais</li>
                      <li>Ä¢ Exerc·≠cio regular de direitos</li>
                      <li>Ä¢ Reten·ß·£o para fins de auditoria</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Base Legal */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                4. Base Legal (Art. 7∫ LGPD)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>O tratamento dos seus dados pessoais est·° fundamentado nas seguintes bases legais:</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 text-xl">úì</span>
                      <div>
                        <strong>Consentimento (Art. 7∫, I):</strong> Para cookies n·£o essenciais, marketing personalizado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl">üìã</span>
                      <div>
                        <strong>Execu·ß·£o de contrato (Art. 7∫, V):</strong> Para presta·ß·£o do servi·ßo contratado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">öñÔ∏è</span>
                      <div>
                        <strong>Cumprimento de obriga·ß·£o legal (Art. 7∫, II):</strong> Para reten·ß·£o fiscal e trabalhista
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 text-xl">üéØ</span>
                      <div>
                        <strong>Leg·≠timo interesse (Art. 7∫, IX):</strong> Para seguran·ßa, preven·ß·£o de fraudes e melhoria do servi·ßo
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
                  Utilizamos cookies e tecnologias similares para melhorar sua experi·™ncia. 
                  Voc·™ pode gerenciar suas prefer·™ncias a qualquer momento em 
                  <a href="/configuracoes/privacidade" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Configura·ß·µes de Privacidade
                  </a>.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo</th>
                        <th className="px-4 py-2 text-left font-medium">Finalidade</th>
                        <th className="px-4 py-2 text-left font-medium">Obrigat·≥rio</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2 font-medium">Essenciais</td>
                        <td className="px-4 py-2">Autentica·ß·£o, seguran·ßa</td>
                        <td className="px-4 py-2 text-green-600">Sim</td>
                        <td className="px-4 py-2">Sess·£o</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Analytics</td>
                        <td className="px-4 py-2">An·°lise de uso, m·©tricas</td>
                        <td className="px-4 py-2 text-red-600">N·£o</td>
                        <td className="px-4 py-2">2 anos</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Marketing</td>
                        <td className="px-4 py-2">Publicidade personalizada</td>
                        <td className="px-4 py-2 text-red-600">N·£o</td>
                        <td className="px-4 py-2">1 ano</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Funcionais</td>
                        <td className="px-4 py-2">Recursos adicionais</td>
                        <td className="px-4 py-2 text-red-600">N·£o</td>
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
                <p>Como titular de dados pessoais, voc·™ possui os seguintes direitos:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      üëÅÔ∏è Acesso e Informa·ß·£o
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>Ä¢ Confirma·ß·£o da exist·™ncia de tratamento</li>
                      <li>Ä¢ Acesso aos dados pessoais</li>
                      <li>Ä¢ Informa·ß·µes sobre uso e compartilhamento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                      úèÔ∏è Corre·ß·£o e Atualiza·ß·£o
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>Ä¢ Corre·ß·£o de dados incompletos</li>
                      <li>Ä¢ Atualiza·ß·£o de dados desatualizados</li>
                      <li>Ä¢ Retifica·ß·£o de dados incorretos</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                      üóëÔ∏è Exclus·£o e Esquecimento
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>Ä¢ Elimina·ß·£o de dados desnecess·°rios</li>
                      <li>Ä¢ Anonimiza·ß·£o quando poss·≠vel</li>
                      <li>Ä¢ Bloqueio de dados irregulares</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                      üì§ Portabilidade e Controle
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>Ä¢ Portabilidade dos dados</li>
                      <li>Ä¢ Revoga·ß·£o do consentimento</li>
                      <li>Ä¢ Oposi·ß·£o ao tratamento</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    ö° Como exercer seus direitos:
                  </h4>
                  <p className="text-sm">
                    Acesse o <a href="/configuracoes/privacidade" className="font-medium underline">Centro de Privacidade</a> ou 
                    entre em contato com nosso DPO atrav·©s do email 
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
                  <strong>N·£o vendemos</strong> seus dados pessoais. Podemos compartilhar informa·ß·µes apenas nas seguintes situa·ß·µes:
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">ü§ù</span>
                    <div>
                      <strong>Prestadores de servi·ßos:</strong> Empresas que nos auxiliam na presta·ß·£o do servi·ßo 
                      (hospedagem, analytics, suporte), sempre com contratos adequados de prote·ß·£o.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 text-xl">öñÔ∏è</span>
                    <div>
                      <strong>Obriga·ß·µes legais:</strong> Quando exigido por lei, ordem judicial ou ·≥rg·£os reguladores.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">üîí</span>
                    <div>
                      <strong>Prote·ß·£o de direitos:</strong> Para proteger nossos direitos, privacidade, seguran·ßa 
                      ou propriedade, ou de terceiros.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 text-xl">üìä</span>
                    <div>
                      <strong>Dados anonimizados:</strong> Informa·ß·µes estat·≠sticas e anonimizadas para fins de pesquisa e desenvolvimento.
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Seguran·ßa */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                8. Seguran·ßa dos Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Implementamos medidas t·©cnicas e organizacionais apropriadas para proteger seus dados:</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-3xl mb-2">üîê</div>
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Criptografia</h4>
                    <p className="text-sm">Dados em tr·¢nsito e em repouso protegidos com criptografia AES-256</p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-3xl mb-2">üõ°Ô∏è</div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Controle de Acesso</h4>
                    <p className="text-sm">Autentica·ß·£o multifator e princ·≠pio do menor privil·©gio</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-3xl mb-2">üìä</div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Monitoramento</h4>
                    <p className="text-sm">Logs de auditoria e monitoramento cont·≠nuo de seguran·ßa</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Reten·ß·£o */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                9. Reten·ß·£o de Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Mantemos seus dados pessoais apenas pelo tempo necess·°rio para as finalidades descritas:</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo de Dado</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo de Reten·ß·£o</th>
                        <th className="px-4 py-2 text-left font-medium">Base Legal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2">Dados de cadastro</td>
                        <td className="px-4 py-2">At·© solicita·ß·£o de exclus·£o</td>
                        <td className="px-4 py-2">Consentimento</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Dados operacionais</td>
                        <td className="px-4 py-2">5 anos ap·≥s t·©rmino</td>
                        <td className="px-4 py-2">Obriga·ß·£o legal</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Logs de seguran·ßa</td>
                        <td className="px-4 py-2">2 anos</td>
                        <td className="px-4 py-2">Leg·≠timo interesse</td>
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
                10. Encarregado de Prote·ß·£o de Dados (DPO)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Para exercer seus direitos, esclarecer d·∫vidas ou reportar incidentes relacionados 
                  ·† prote·ß·£o de dados, entre em contato com nosso DPO:
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">üìß</div>
                      <strong>Email:</strong><br />
                      <a href="mailto:privacy@seusite.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                        privacy@seusite.com
                      </a>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">üìû</div>
                      <strong>Telefone:</strong><br />
                      <a href="tel:+5511999999999" className="text-blue-600 dark:text-blue-400 hover:underline">
                        (11) 99999-9999
                      </a>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">üìç</div>
                      <strong>Endere·ßo:</strong><br />
                      Rua Exemplo, 123<br />
                      S·£o Paulo - SP
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Altera·ß·µes */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                11. Altera·ß·µes na Pol·≠tica
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta Pol·≠tica de Privacidade pode ser atualizada periodicamente. Altera·ß·µes significativas 
                  ser·£o comunicadas atrav·©s de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Notifica·ß·£o no sistema</li>
                  <li>Email para o endere·ßo cadastrado</li>
                  <li>Aviso na p·°gina inicial</li>
                  <li>Novo banner de consentimento (se aplic·°vel)</li>
                </ul>
                <p>
                  Recomendamos que revise esta pol·≠tica regularmente para se manter informado sobre 
                  como protegemos seus dados.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <p>üìã <strong>Documento:</strong> Pol·≠tica de Privacidade</p>
                <p>öñÔ∏è <strong>Lei aplic·°vel:</strong> LGPD n∫ 13.709/2018 e Marco Civil da Internet</p>
                <p>üìÖ <strong>Vig·™ncia:</strong> A partir de {new Date().toLocaleDateString('pt-BR')}</p>
                <p>
                  üîó <strong>Links ·∫teis:</strong> 
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
