// 🚩 NOVA MATEMÁTICA: SCORE TURBO DINÂMICO
    const sdrNames = Object.keys(sdr_ranking);
    const totalSDRs = sdrNames.length || 1;

    // Âncoras Dinâmicas (Médias do Time)
    const v_bar = total_calls / totalSDRs; // Média de volume do time (V-barra)
    const m_bar = valid_calls > 0 ? (sum_notes / valid_calls) : 0; // Média de nota do time (M-barra)

    sdrNames.forEach(name => {
      const s = sdr_ranking[name];
      const V = s.calls;
      const M = s.valid_calls > 0 ? (s.sum_notes / s.valid_calls) : 0;

      if (V > 0) {
        // 1. Qualidade Bayesiana (Puxa para a média se tiver pouco volume)
        const qualidade = (V * M + v_bar * m_bar) / (V + v_bar);

        // 2. Fator de Tração (Premia quem tem mais volume que a média do time)
        const tracao = Math.sqrt(V / v_bar);

        // Resultado Final: Qualidade x Tração
        s.nota_media = Number((qualidade * tracao).toFixed(1));
      } else {
        s.nota_media = 0;
      }
    });