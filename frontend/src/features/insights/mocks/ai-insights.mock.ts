export const aiInsightsMock = {
  trends:[
    { label: "Perguntas de Implicação", value: "+15%", status: "up" },
    { label: "Tempo em 'Situação'", value: "-10%", status: "down" },
    { label: "Conversão de Agendamento", value: "+5%", status: "up" },
  ],
  recommendations:[
    { title: "Treinamento Recomendado", description: "O time B está estagnado em 'Necessidade de Solução'. Sugiro um workshop prático de 30min focado em SPIN-N.", type: "info" },
    { title: "Alerta de Performance", description: "O SDR João Silva teve uma queda súbita de 20% no score nas últimas 3 calls. Recomendo uma conversa de 1:1.", type: "warning" },
  ],
  patterns: "A equipe está gastando 40% mais tempo na fase de 'Situação' do que o necessário, o que está encurtando o tempo disponível para explorar dores reais."
}
