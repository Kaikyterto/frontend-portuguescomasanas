import { useNavigate } from "react-router-dom";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B63D6] via-[#2E8AF5] to-[#57C2FF] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl rounded-3xl border-[3px] border-black bg-[#FDF9F1] p-6 sm:p-10 lg:p-12 shadow-[8px_8px_0px_#000]">
        {/* Cabeçalho */}
        <div className="border-b-[3px] border-black pb-6 mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight">
            Termo de Consentimento e Aceite de Uso
          </h1>
          <p className="text-lg font-bold text-[#1B63D6] mt-2">
            Plataforma Português com as Anas
          </p>
        </div>

        {/* Corpo do Termo */}
        <div className="space-y-6 text-gray-800 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 border-b-[3px] border-black pb-6 mb-6 custom-scrollbar">
          <p className="font-semibold text-base sm:text-lg">
            Ao realizar seu cadastro e utilizar a plataforma Português com as
            Anas, o usuário declara que leu, compreendeu e concorda com os
            termos abaixo:
          </p>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar ou utilizar a plataforma, o usuário concorda em cumprir
              este Termo de Consentimento e Aceite, bem como a legislação
              brasileira aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              2. Finalidade da Plataforma
            </h2>
            <p>
              A plataforma Português com as Anas destina-se à oferta de cursos,
              materiais didáticos, simulados, videoaulas, exercícios e demais
              conteúdos voltados ao ensino da Língua Portuguesa e preparação
              para concursos públicos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              3. Cadastro do Usuário
            </h2>
            <p>
              O usuário declara que as informações fornecidas no cadastro são
              verdadeiras, completas e atualizadas, comprometendo-se a mantê-las
              corretas sempre que necessário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              4. Tratamento de Dados Pessoais
            </h2>
            <p className="mb-2">
              Ao utilizar a plataforma, o usuário autoriza o tratamento de seus
              dados pessoais para as seguintes finalidades:
            </p>
            <ul className="list-disc pl-6 space-y-1 font-medium">
              <li>Criação e gerenciamento da conta;</li>
              <li>Acesso aos cursos e conteúdos;</li>
              <li>Processamento de pagamentos;</li>
              <li>Emissão de comprovantes, quando aplicável;</li>
              <li>
                Comunicação sobre atualizações, suporte e informações
                relacionadas à plataforma;
              </li>
              <li>Cumprimento de obrigações legais.</li>
            </ul>
            <p className="mt-3">
              O tratamento dos dados será realizado em conformidade com a Lei
              Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              5. Comunicações
            </h2>
            <p>
              O usuário autoriza o envio de quaisquer comunicações relacionadas
              à plataforma por e-mail, WhatsApp ou outros meios de contato
              informados no cadastro, podendo solicitar o cancelamento de
              comunicações promocionais a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              6. Uso da Plataforma
            </h2>
            <p className="mb-2">
              O usuário compromete-se a utilizar a plataforma de forma ética e
              legal, sendo estritamente proibido:
            </p>
            <ul className="list-disc pl-6 space-y-1 font-medium">
              <li>Compartilhar sua conta com terceiros;</li>
              <li>
                Copiar, reproduzir ou distribuir conteúdos sem autorização
                prévia;
              </li>
              <li>
                Praticar qualquer atividade que prejudique o funcionamento ou a
                segurança da plataforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              7. Propriedade Intelectual
            </h2>
            <p>
              Todo o conteúdo disponibilizado na plataforma, incluindo
              videoaulas, apostilas, questões, textos, imagens, marcas e demais
              materiais, é totalmente protegido pelas leis de direitos autorais
              e pertence aos respectivos titulares, sendo proibida sua
              reprodução sem autorização expressa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              8. Responsabilidades
            </h2>
            <p>
              A plataforma envidará esforços para manter seus serviços sempre
              disponíveis, porém não garante funcionamento ininterrupto, podendo
              ocorrer eventuais manutenções ou indisponibilidades temporárias no
              sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">
              9. Alterações dos Termos
            </h2>
            <p>
              Este Termo poderá ser updated sempre que necessário. As alterações
              passarão a valer imediatamente após sua devida publicação na
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-black mb-2">10. Foro</h2>
            <p>
              Fica eleito o foro da comarca competente, conforme a legislação
              brasileira, para dirimir quaisquer dúvidas oriundas deste Termo.
            </p>
          </section>

          <section className="bg-white border-2 border-black rounded-2xl p-4 mt-4">
            <h2 className="text-lg font-black text-black mb-1">
              Declaração de Consentimento
            </h2>
            <p className="text-sm">
              Ao marcar a opção "Li e aceito o Termo de Consentimento e Aceite"
              na página de cadastro, declaro que li integralmente este
              documento, compreendi seu conteúdo e concordo com todas as suas
              condições, autorizando o tratamento de meus dados pessoais
              conforme descrito acima.
            </p>
          </section>
        </div>

        {/* Ação / Voltar */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border-[3px] border-black bg-[#76D8F7] px-8 py-3 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-y-0 active:shadow-[2px_2px_0px_#000]"
          >
            VOLTAR
          </button>
        </div>
      </div>
    </div>
  );
}
