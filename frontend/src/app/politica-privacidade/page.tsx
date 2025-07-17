export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-8 space-y-8">
            
            {/* Header */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ã°Å¸â€â€™ PolÃ¡Â­tica de Privacidade
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Ã¡Å¡ltima atualizaÃ¡Â§Ã¡Â£o:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                <p><strong>VersÃ¡Â£o:</strong> 1.0</p>
                <p><strong>Lei aplicÃ¡Â¡vel:</strong> LGPD nÂº 13.709/2018</p>
              </div>
            </div>

            {/* IntroduÃ¡Â§Ã¡Â£o */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                1. IntroduÃ¡Â§Ã¡Â£o
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta PolÃ¡Â­tica de Privacidade descreve como o <strong>Sistema de GestÃ¡Â£o de Bares (SGB)</strong> 
                  coleta, usa, armazena e protege suas informaÃ¡Â§Ã¡Âµes pessoais, em conformidade com a 
                  <strong> Lei Geral de ProteÃ¡Â§Ã¡Â£o de Dados (LGPD - Lei nÂº 13.709/2018)</strong>.
                </p>
                <p>
                  Nosso compromisso Ã¡Â© garantir a transparÃ¡Âªncia no tratamento dos seus dados pessoais 
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
                <h3 className="text-lg font-medium">2.1 Dados fornecidos diretamente por vocÃ¡Âª:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de identificaÃ¡Â§Ã¡Â£o:</strong> Nome completo, email, telefone</li>
                  <li><strong>Dados de acesso:</strong> Senha (criptografada), preferÃ¡Âªncias de usuÃ¡Â¡rio</li>
                  <li><strong>Dados profissionais:</strong> Cargo, funÃ¡Â§Ã¡Â£o, estabelecimento associado</li>
                  <li><strong>Dados de comunicaÃ¡Â§Ã¡Â£o:</strong> Mensagens, suporte, feedback</li>
                </ul>

                <h3 className="text-lg font-medium">2.2 Dados coletados automaticamente:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de navegaÃ¡Â§Ã¡Â£o:</strong> EndereÃ¡Â§o IP, tipo de navegador, sistema operacional</li>
                  <li><strong>Dados de uso:</strong> PÃ¡Â¡ginas acessadas, tempo de permanÃ¡Âªncia, funcionalidades utilizadas</li>
                  <li><strong>Dados tÃ¡Â©cnicos:</strong> Logs de sistema, dados de performance, mÃ¡Â©tricas de uso</li>
                  <li><strong>Cookies:</strong> Conforme sua preferÃ¡Âªncia (veja seÃ¡Â§Ã¡Â£o especÃ¡Â­fica)</li>
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
                      Ã°Å¸â€œâ€¹ Operacionais
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â‚¬Â¢ AutenticaÃ¡Â§Ã¡Â£o e controle de acesso</li>
                      <li>â‚¬Â¢ GestÃ¡Â£o de checklists e operaÃ¡Â§Ã¡Âµes</li>
                      <li>â‚¬Â¢ RelatÃ¡Â³rios e anÃ¡Â¡lises de negÃ¡Â³cio</li>
                      <li>â‚¬Â¢ Suporte tÃ¡Â©cnico e atendimento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                      Ã°Å¸â€œÅ  Analytics
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â‚¬Â¢ Melhoria da experiÃ¡Âªncia do usuÃ¡Â¡rio</li>
                      <li>â‚¬Â¢ Desenvolvimento de novas funcionalidades</li>
                      <li>â‚¬Â¢ AnÃ¡Â¡lise de performance do sistema</li>
                      <li>â‚¬Â¢ EstatÃ¡Â­sticas de uso (anonimizadas)</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                      Ã°Å¸â€â€™ SeguranÃ¡Â§a
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â‚¬Â¢ PrevenÃ¡Â§Ã¡Â£o de fraudes e abusos</li>
                      <li>â‚¬Â¢ Monitoramento de seguranÃ¡Â§a</li>
                      <li>â‚¬Â¢ Backup e recuperaÃ¡Â§Ã¡Â£o de dados</li>
                      <li>â‚¬Â¢ Auditoria e compliance</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                      Å¡â€“Ã¯Â¸Â Legal
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â‚¬Â¢ Cumprimento de obrigaÃ¡Â§Ã¡Âµes legais</li>
                      <li>â‚¬Â¢ Defesa em processos judiciais</li>
                      <li>â‚¬Â¢ ExercÃ¡Â­cio regular de direitos</li>
                      <li>â‚¬Â¢ RetenÃ¡Â§Ã¡Â£o para fins de auditoria</li>
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
                <p>O tratamento dos seus dados pessoais estÃ¡Â¡ fundamentado nas seguintes bases legais:</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 text-xl">Å“â€œ</span>
                      <div>
                        <strong>Consentimento (Art. 7Âº, I):</strong> Para cookies nÃ¡Â£o essenciais, marketing personalizado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl">Ã°Å¸â€œâ€¹</span>
                      <div>
                        <strong>ExecuÃ¡Â§Ã¡Â£o de contrato (Art. 7Âº, V):</strong> Para prestaÃ¡Â§Ã¡Â£o do serviÃ¡Â§o contratado
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">Å¡â€“Ã¯Â¸Â</span>
                      <div>
                        <strong>Cumprimento de obrigaÃ¡Â§Ã¡Â£o legal (Art. 7Âº, II):</strong> Para retenÃ¡Â§Ã¡Â£o fiscal e trabalhista
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 text-xl">Ã°Å¸Å½Â¯</span>
                      <div>
                        <strong>LegÃ¡Â­timo interesse (Art. 7Âº, IX):</strong> Para seguranÃ¡Â§a, prevenÃ¡Â§Ã¡Â£o de fraudes e melhoria do serviÃ¡Â§o
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
                  Utilizamos cookies e tecnologias similares para melhorar sua experiÃ¡Âªncia. 
                  VocÃ¡Âª pode gerenciar suas preferÃ¡Âªncias a qualquer momento em 
                  <a href="/configuracoes/privacidade" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    ConfiguraÃ¡Â§Ã¡Âµes de Privacidade
                  </a>.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo</th>
                        <th className="px-4 py-2 text-left font-medium">Finalidade</th>
                        <th className="px-4 py-2 text-left font-medium">ObrigatÃ¡Â³rio</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2 font-medium">Essenciais</td>
                        <td className="px-4 py-2">AutenticaÃ¡Â§Ã¡Â£o, seguranÃ¡Â§a</td>
                        <td className="px-4 py-2 text-green-600">Sim</td>
                        <td className="px-4 py-2">SessÃ¡Â£o</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Analytics</td>
                        <td className="px-4 py-2">AnÃ¡Â¡lise de uso, mÃ¡Â©tricas</td>
                        <td className="px-4 py-2 text-red-600">NÃ¡Â£o</td>
                        <td className="px-4 py-2">2 anos</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Marketing</td>
                        <td className="px-4 py-2">Publicidade personalizada</td>
                        <td className="px-4 py-2 text-red-600">NÃ¡Â£o</td>
                        <td className="px-4 py-2">1 ano</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Funcionais</td>
                        <td className="px-4 py-2">Recursos adicionais</td>
                        <td className="px-4 py-2 text-red-600">NÃ¡Â£o</td>
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
                <p>Como titular de dados pessoais, vocÃ¡Âª possui os seguintes direitos:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      Ã°Å¸â€˜ÂÃ¯Â¸Â Acesso e InformaÃ¡Â§Ã¡Â£o
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â‚¬Â¢ ConfirmaÃ¡Â§Ã¡Â£o da existÃ¡Âªncia de tratamento</li>
                      <li>â‚¬Â¢ Acesso aos dados pessoais</li>
                      <li>â‚¬Â¢ InformaÃ¡Â§Ã¡Âµes sobre uso e compartilhamento</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                      Å“ÂÃ¯Â¸Â CorreÃ¡Â§Ã¡Â£o e AtualizaÃ¡Â§Ã¡Â£o
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â‚¬Â¢ CorreÃ¡Â§Ã¡Â£o de dados incompletos</li>
                      <li>â‚¬Â¢ AtualizaÃ¡Â§Ã¡Â£o de dados desatualizados</li>
                      <li>â‚¬Â¢ RetificaÃ¡Â§Ã¡Â£o de dados incorretos</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                      Ã°Å¸â€”â€˜Ã¯Â¸Â ExclusÃ¡Â£o e Esquecimento
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â‚¬Â¢ EliminaÃ¡Â§Ã¡Â£o de dados desnecessÃ¡Â¡rios</li>
                      <li>â‚¬Â¢ AnonimizaÃ¡Â§Ã¡Â£o quando possÃ¡Â­vel</li>
                      <li>â‚¬Â¢ Bloqueio de dados irregulares</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                      Ã°Å¸â€œÂ¤ Portabilidade e Controle
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>â‚¬Â¢ Portabilidade dos dados</li>
                      <li>â‚¬Â¢ RevogaÃ¡Â§Ã¡Â£o do consentimento</li>
                      <li>â‚¬Â¢ OposiÃ¡Â§Ã¡Â£o ao tratamento</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    Å¡Â¡ Como exercer seus direitos:
                  </h4>
                  <p className="text-sm">
                    Acesse o <a href="/configuracoes/privacidade" className="font-medium underline">Centro de Privacidade</a> ou 
                    entre em contato com nosso DPO atravÃ¡Â©s do email 
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
                  <strong>NÃ¡Â£o vendemos</strong> seus dados pessoais. Podemos compartilhar informaÃ¡Â§Ã¡Âµes apenas nas seguintes situaÃ¡Â§Ã¡Âµes:
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">Ã°Å¸Â¤Â</span>
                    <div>
                      <strong>Prestadores de serviÃ¡Â§os:</strong> Empresas que nos auxiliam na prestaÃ¡Â§Ã¡Â£o do serviÃ¡Â§o 
                      (hospedagem, analytics, suporte), sempre com contratos adequados de proteÃ¡Â§Ã¡Â£o.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 text-xl">Å¡â€“Ã¯Â¸Â</span>
                    <div>
                      <strong>ObrigaÃ¡Â§Ã¡Âµes legais:</strong> Quando exigido por lei, ordem judicial ou Ã¡Â³rgÃ¡Â£os reguladores.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 text-xl">Ã°Å¸â€â€™</span>
                    <div>
                      <strong>ProteÃ¡Â§Ã¡Â£o de direitos:</strong> Para proteger nossos direitos, privacidade, seguranÃ¡Â§a 
                      ou propriedade, ou de terceiros.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 text-xl">Ã°Å¸â€œÅ </span>
                    <div>
                      <strong>Dados anonimizados:</strong> InformaÃ¡Â§Ã¡Âµes estatÃ¡Â­sticas e anonimizadas para fins de pesquisa e desenvolvimento.
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* SeguranÃ¡Â§a */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                8. SeguranÃ¡Â§a dos Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Implementamos medidas tÃ¡Â©cnicas e organizacionais apropriadas para proteger seus dados:</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-3xl mb-2">Ã°Å¸â€Â</div>
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Criptografia</h4>
                    <p className="text-sm">Dados em trÃ¡Â¢nsito e em repouso protegidos com criptografia AES-256</p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-3xl mb-2">Ã°Å¸â€ºÂ¡Ã¯Â¸Â</div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Controle de Acesso</h4>
                    <p className="text-sm">AutenticaÃ¡Â§Ã¡Â£o multifator e princÃ¡Â­pio do menor privilÃ¡Â©gio</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-3xl mb-2">Ã°Å¸â€œÅ </div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Monitoramento</h4>
                    <p className="text-sm">Logs de auditoria e monitoramento contÃ¡Â­nuo de seguranÃ¡Â§a</p>
                  </div>
                </div>
              </div>
            </section>

            {/* RetenÃ¡Â§Ã¡Â£o */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                9. RetenÃ¡Â§Ã¡Â£o de Dados
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Mantemos seus dados pessoais apenas pelo tempo necessÃ¡Â¡rio para as finalidades descritas:</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tipo de Dado</th>
                        <th className="px-4 py-2 text-left font-medium">Prazo de RetenÃ¡Â§Ã¡Â£o</th>
                        <th className="px-4 py-2 text-left font-medium">Base Legal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2">Dados de cadastro</td>
                        <td className="px-4 py-2">AtÃ¡Â© solicitaÃ¡Â§Ã¡Â£o de exclusÃ¡Â£o</td>
                        <td className="px-4 py-2">Consentimento</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Dados operacionais</td>
                        <td className="px-4 py-2">5 anos apÃ¡Â³s tÃ¡Â©rmino</td>
                        <td className="px-4 py-2">ObrigaÃ¡Â§Ã¡Â£o legal</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Logs de seguranÃ¡Â§a</td>
                        <td className="px-4 py-2">2 anos</td>
                        <td className="px-4 py-2">LegÃ¡Â­timo interesse</td>
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
                10. Encarregado de ProteÃ¡Â§Ã¡Â£o de Dados (DPO)
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Para exercer seus direitos, esclarecer dÃ¡Âºvidas ou reportar incidentes relacionados 
                  Ã¡Â  proteÃ¡Â§Ã¡Â£o de dados, entre em contato com nosso DPO:
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">Ã°Å¸â€œÂ§</div>
                      <strong>Email:</strong><br />
                      <a href="mailto:privacy@seusite.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                        privacy@seusite.com
                      </a>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">Ã°Å¸â€œÅ¾</div>
                      <strong>Telefone:</strong><br />
                      <a href="tel:+5511999999999" className="text-blue-600 dark:text-blue-400 hover:underline">
                        (11) 99999-9999
                      </a>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">Ã°Å¸â€œÂ</div>
                      <strong>EndereÃ¡Â§o:</strong><br />
                      Rua Exemplo, 123<br />
                      SÃ¡Â£o Paulo - SP
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AlteraÃ¡Â§Ã¡Âµes */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                11. AlteraÃ¡Â§Ã¡Âµes na PolÃ¡Â­tica
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Esta PolÃ¡Â­tica de Privacidade pode ser atualizada periodicamente. AlteraÃ¡Â§Ã¡Âµes significativas 
                  serÃ¡Â£o comunicadas atravÃ¡Â©s de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>NotificaÃ¡Â§Ã¡Â£o no sistema</li>
                  <li>Email para o endereÃ¡Â§o cadastrado</li>
                  <li>Aviso na pÃ¡Â¡gina inicial</li>
                  <li>Novo banner de consentimento (se aplicÃ¡Â¡vel)</li>
                </ul>
                <p>
                  Recomendamos que revise esta polÃ¡Â­tica regularmente para se manter informado sobre 
                  como protegemos seus dados.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <p>Ã°Å¸â€œâ€¹ <strong>Documento:</strong> PolÃ¡Â­tica de Privacidade</p>
                <p>Å¡â€“Ã¯Â¸Â <strong>Lei aplicÃ¡Â¡vel:</strong> LGPD nÂº 13.709/2018 e Marco Civil da Internet</p>
                <p>Ã°Å¸â€œâ€¦ <strong>VigÃ¡Âªncia:</strong> A partir de {new Date().toLocaleDateString('pt-BR')}</p>
                <p>
                  Ã°Å¸â€â€” <strong>Links Ã¡Âºteis:</strong> 
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

