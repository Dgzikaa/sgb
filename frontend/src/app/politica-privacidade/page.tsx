export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-8 space-y-8">
            
            {/* Header */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ðŸ”’ PolÃ­tica de Privacidade
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Ãšltima atualizaÃ§Ã£o:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                <p><strong>VersÃ£o:</strong> 1.0</p>
                <p><strong>Lei aplicÃ¡vel:</strong> LGPD nÂº 13.709/2018</p>
              </div>
            </div>

            {/* IntroduÃ§Ã£o */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                1. IntroduÃ§Ã£o
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta PolÃ­tica de Privacidade descreve como o <strong>Sistema de GestÃ£o de Bares (SGB)</strong> 
                  coleta, usa, armazena e protege suas informaÃ§Ãµes pessoais, em conformidade com a 
                  <strong> Lei Geral de ProteÃ§Ã£o de Dados (LGPD - Lei nÂº 13.709/2018)</strong>.
                </p>
                <p>
                  Nosso compromisso Ã© garantir a transparÃªncia no tratamento dos seus dados pessoais 
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
                <h3 className="text-lg font-medium">2.1 Dados fornecidos diretamente por vocÃª:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de identificaÃ§Ã£o:</strong> Nome completo, email, telefone</li>
                  <li><strong>Dados de acesso:</strong> Senha (criptografada), preferÃªncias de usuÃ¡rio</li>
                  <li><strong>Dados profissionais:</strong> Cargo, funÃ§Ã£o, estabelecimento associado</li>
                  <li><strong>Dados de comunicaÃ§Ã£o:</strong> Mensagens, suporte, feedback</li>
                </ul>

                <h3 className="text-lg font-medium">2.2 Dados coletados automaticamente:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de navegaÃ§Ã£o:</strong> EndereÃ§o IP, tipo de navegador, sistema operacional</li>
                  <li><strong>Dados de uso:</strong> PÃ¡ginas acessadas, tempo de permanÃªncia, funcionalidades utilizadas</li>
                  <li><strong>Dados tÃ©cnicos:</strong> Logs de sistema, dados de performance, mÃ©tricas de uso</li>
                  <li><strong>Cookies:</strong> Conforme sua preferÃªncia (veja seÃ§Ã£o especÃ­fica)</li>
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
                      <li>â€¢ AutenticaÃ§Ã£o e controle de acesso</li>
                      <li>â€¢ GestÃ£o de checklists e operaÃ§Ãµes</li>
                      <li>â€¢ RelatÃ³rios e anÃ¡lises de negÃ³cio</li>
                      <li>â€¢ Suporte tÃ©cnico e atendimento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                      ðŸ“Š Analytics
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â€¢ Melhoria da experiÃªncia do usuÃ¡rio</li>
                      <li>â€¢ Desenvolvimento de novas funcionalidades</li>
                      <li>â€¢ AnÃ¡lise de performance do sistema</li>
                      <li>â€¢ EstatÃ­sticas de uso (anonimizadas)</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                      ðŸ”’ SeguranÃ§a
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â€¢ PrevenÃ§Ã£o de fraudes e abusos</li>
                      <li>â€¢ Monitoramento de seguranÃ§a</li>
                      <li>â€¢ Backup e recuperaÃ§Ã£o de dados</li>
                      <li>â€¢ Auditoria e compliance</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                      âš–ï¸ Legal
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â€¢ Cumprimento de obrigaÃ§Ãµes legais</li>
                      <li>â€¢ Defesa em processos judiciais</li>
                      <li>â€¢ ExercÃ­cio regular de direitos</li>
                      <li>â€¢ RetenÃ§Ã£o para fins de auditoria</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Base Legal */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                4. Base Legal (Art. 7Âº LGPD)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>O tratamento dos seus dados pessoais estÃ¡ fundamentado nas seguintes bases legais:</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 text-xl">âœ“</span>
                      <div>
                        <strong>Consentimento (Art. 7Âº, I):</strong> Para cookies nÃ£o essenciais, marketing personalizado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl">ðŸ“‹</span>
                      <div>
                        <strong>ExecuÃ§Ã£o de contrato (Art. 7Âº, V):</strong> Para prestaÃ§Ã£o do serviÃ§o contratado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">âš–ï¸</span>
                      <div>
                        <strong>Cumprimento de obrigaÃ§Ã£o legal (Art. 7Âº, II):</strong> Para retenÃ§Ã£o fiscal e trabalhista
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 text-xl">ðŸŽ¯</span>
                      <div>
                        <strong>LegÃ­timo interesse (Art. 7Âº, IX):</strong> Para seguranÃ§a, prevenÃ§Ã£o de fraudes e melhoria do serviÃ§o
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
                  Utilizamos cookies e tecnologias similares para melhorar sua experiÃªncia. 
                  VocÃª pode gerenciar suas preferÃªncias a qualquer momento em 
                  <a href="/configuracoes/privacidade" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    ConfiguraÃ§Ãµes de Privacidade
                  </a>.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo</th>
                        <th className="px-4 py-2 text-left font-medium">Finalidade</th>
                        <th className="px-4 py-2 text-left font-medium">ObrigatÃ³rio</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2 font-medium">Essenciais</td>
                        <td className="px-4 py-2">AutenticaÃ§Ã£o, seguranÃ§a</td>
                        <td className="px-4 py-2 text-green-600">Sim</td>
                        <td className="px-4 py-2">SessÃ£o</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Analytics</td>
                        <td className="px-4 py-2">AnÃ¡lise de uso, mÃ©tricas</td>
                        <td className="px-4 py-2 text-red-600">NÃ£o</td>
                        <td className="px-4 py-2">2 anos</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Marketing</td>
                        <td className="px-4 py-2">Publicidade personalizada</td>
                        <td className="px-4 py-2 text-red-600">NÃ£o</td>
                        <td className="px-4 py-2">1 ano</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Funcionais</td>
                        <td className="px-4 py-2">Recursos adicionais</td>
                        <td className="px-4 py-2 text-red-600">NÃ£o</td>
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
                <p>Como titular de dados pessoais, vocÃª possui os seguintes direitos:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      ðŸ‘ï¸ Acesso e InformaÃ§Ã£o
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â€¢ ConfirmaÃ§Ã£o da existÃªncia de tratamento</li>
                      <li>â€¢ Acesso aos dados pessoais</li>
                      <li>â€¢ InformaÃ§Ãµes sobre uso e compartilhamento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                      âœï¸ CorreÃ§Ã£o e AtualizaÃ§Ã£o
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â€¢ CorreÃ§Ã£o de dados incompletos</li>
                      <li>â€¢ AtualizaÃ§Ã£o de dados desatualizados</li>
                      <li>â€¢ RetificaÃ§Ã£o de dados incorretos</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                      ðŸ—‘ï¸ ExclusÃ£o e Esquecimento
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â€¢ EliminaÃ§Ã£o de dados desnecessÃ¡rios</li>
                      <li>â€¢ AnonimizaÃ§Ã£o quando possÃ­vel</li>
                      <li>â€¢ Bloqueio de dados irregulares</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                      ðŸ“¤ Portabilidade e Controle
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â€¢ Portabilidade dos dados</li>
                      <li>â€¢ RevogaÃ§Ã£o do consentimento</li>
                      <li>â€¢ OposiÃ§Ã£o ao tratamento</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    âš¡ Como exercer seus direitos:
                  </h4>
                  <p className="text-sm">
                    Acesse o <a href="/configuracoes/privacidade" className="font-medium underline">Centro de Privacidade</a> ou 
                    entre em contato com nosso DPO atravÃ©s do email 
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
                  <strong>NÃ£o vendemos</strong> seus dados pessoais. Podemos compartilhar informaÃ§Ãµes apenas nas seguintes situaÃ§Ãµes:
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">ðŸ¤</span>
                    <div>
                      <strong>Prestadores de serviÃ§os:</strong> Empresas que nos auxiliam na prestaÃ§Ã£o do serviÃ§o 
                      (hospedagem, analytics, suporte), sempre com contratos adequados de proteÃ§Ã£o.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 text-xl">âš–ï¸</span>
                    <div>
                      <strong>ObrigaÃ§Ãµes legais:</strong> Quando exigido por lei, ordem judicial ou Ã³rgÃ£os reguladores.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">ðŸ”’</span>
                    <div>
                      <strong>ProteÃ§Ã£o de direitos:</strong> Para proteger nossos direitos, privacidade, seguranÃ§a 
                      ou propriedade, ou de terceiros.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 text-xl">ðŸ“Š</span>
                    <div>
                      <strong>Dados anonimizados:</strong> InformaÃ§Ãµes estatÃ­sticas e anonimizadas para fins de pesquisa e desenvolvimento.
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* SeguranÃ§a */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                8. SeguranÃ§a dos Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Implementamos medidas tÃ©cnicas e organizacionais apropriadas para proteger seus dados:</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-3xl mb-2">ðŸ”</div>
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Criptografia</h4>
                    <p className="text-sm">Dados em trÃ¢nsito e em repouso protegidos com criptografia AES-256</p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-3xl mb-2">ðŸ›¡ï¸</div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Controle de Acesso</h4>
                    <p className="text-sm">AutenticaÃ§Ã£o multifator e princÃ­pio do menor privilÃ©gio</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-3xl mb-2">ðŸ“Š</div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Monitoramento</h4>
                    <p className="text-sm">Logs de auditoria e monitoramento contÃ­nuo de seguranÃ§a</p>
                  </div>
                </div>
              </div>
            </section>

            {/* RetenÃ§Ã£o */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                9. RetenÃ§Ã£o de Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Mantemos seus dados pessoais apenas pelo tempo necessÃ¡rio para as finalidades descritas:</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo de Dado</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo de RetenÃ§Ã£o</th>
                        <th className="px-4 py-2 text-left font-medium">Base Legal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2">Dados de cadastro</td>
                        <td className="px-4 py-2">AtÃ© solicitaÃ§Ã£o de exclusÃ£o</td>
                        <td className="px-4 py-2">Consentimento</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Dados operacionais</td>
                        <td className="px-4 py-2">5 anos apÃ³s tÃ©rmino</td>
                        <td className="px-4 py-2">ObrigaÃ§Ã£o legal</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Logs de seguranÃ§a</td>
                        <td className="px-4 py-2">2 anos</td>
                        <td className="px-4 py-2">LegÃ­timo interesse</td>
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
                10. Encarregado de ProteÃ§Ã£o de Dados (DPO)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Para exercer seus direitos, esclarecer dÃºvidas ou reportar incidentes relacionados 
                  Ã  proteÃ§Ã£o de dados, entre em contato com nosso DPO:
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
                      <strong>EndereÃ§o:</strong><br />
                      Rua Exemplo, 123<br />
                      SÃ£o Paulo - SP
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AlteraÃ§Ãµes */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                11. AlteraÃ§Ãµes na PolÃ­tica
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta PolÃ­tica de Privacidade pode ser atualizada periodicamente. AlteraÃ§Ãµes significativas 
                  serÃ£o comunicadas atravÃ©s de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>NotificaÃ§Ã£o no sistema</li>
                  <li>Email para o endereÃ§o cadastrado</li>
                  <li>Aviso na pÃ¡gina inicial</li>
                  <li>Novo banner de consentimento (se aplicÃ¡vel)</li>
                </ul>
                <p>
                  Recomendamos que revise esta polÃ­tica regularmente para se manter informado sobre 
                  como protegemos seus dados.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <p>ðŸ“‹ <strong>Documento:</strong> PolÃ­tica de Privacidade</p>
                <p>âš–ï¸ <strong>Lei aplicÃ¡vel:</strong> LGPD nÂº 13.709/2018 e Marco Civil da Internet</p>
                <p>ðŸ“… <strong>VigÃªncia:</strong> A partir de {new Date().toLocaleDateString('pt-BR')}</p>
                <p>
                  ðŸ”— <strong>Links Ãºteis:</strong> 
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
