
interface TaktTimeData {
  equipeNome: string;
  taktTime: number;
  pizzasEntregues: number;
  tempoMedioPorPizza: number;
}

interface RodadaData {
  pizzasPlanejadas: number;
  tempoTotalSegundos: number;
  pizzasEntreguesPorEquipe: { [equipeId: string]: number };
}

export const calcularTaktTime = (
  rodadaData: RodadaData,
  equipes: Array<{ id: string; nome: string }>
): TaktTimeData[] => {
  console.log('calcularTaktTime - Entrada:', { rodadaData, totalEquipes: equipes.length });
  
  // Calcular tempo médio por pizza da rodada
  const tempoMedioPorPizza = rodadaData.tempoTotalSegundos / rodadaData.pizzasPlanejadas;
  
  console.log('Tempo médio por pizza calculado:', tempoMedioPorPizza);

  const resultados = equipes.map(equipe => {
    const pizzasEntregues = rodadaData.pizzasEntreguesPorEquipe[equipe.id] || 0;
    
    console.log(`Equipe ${equipe.nome}: ${pizzasEntregues} pizzas entregues`);
    
    // Cálculo do Takt Time:
    // Se a equipe entregou pizzas, calculamos com base na eficiência relativa
    // Takt Time = tempo_médio_por_pizza * (pizzas_planejadas / pizzas_entregues)
    // Valores menores que 1.0 = mais eficiente que o planejado
    // Valores maiores que 1.0 = menos eficiente que o planejado
    let taktTime = 0;
    
    if (pizzasEntregues > 0) {
      // Proporção de eficiência: quantas pizzas entregou vs. quantas deveria entregar
      const proporcaoEficiencia = rodadaData.pizzasPlanejadas / pizzasEntregues;
      taktTime = tempoMedioPorPizza * proporcaoEficiencia;
    } else {
      // Se não entregou nenhuma pizza, considera o pior caso possível
      taktTime = tempoMedioPorPizza * 2; // Dobro do tempo ideal
    }

    const resultado = {
      equipeNome: equipe.nome,
      taktTime: Number(taktTime.toFixed(2)),
      pizzasEntregues,
      tempoMedioPorPizza: Number(tempoMedioPorPizza.toFixed(2))
    };
    
    console.log(`Resultado para ${equipe.nome}:`, resultado);
    
    return resultado;
  });

  console.log('calcularTaktTime - Resultados finais:', resultados);
  return resultados;
};

export const obterDadosRodadaParaTakt = (
  rodadaId: string,
  pizzas: Array<{ equipe_id: string; rodada_id: string; status: string; resultado: string }>,
  rodada: { tempo_limite: number } | null,
  pizzasPlanejadas: number = 10 // Valor padrão, pode ser configurável
): RodadaData | null => {
  console.log('obterDadosRodadaParaTakt - Entrada:', {
    rodadaId,
    totalPizzas: pizzas.length,
    rodadaTempoLimite: rodada?.tempo_limite,
    pizzasPlanejadas
  });

  if (!rodada) {
    console.log('Rodada não encontrada');
    return null;
  }

  // Filtrar pizzas da rodada específica
  const pizzasDaRodada = pizzas.filter(pizza => pizza.rodada_id === rodadaId);
  console.log(`Pizzas da rodada ${rodadaId}:`, pizzasDaRodada.length);

  // Contar pizzas entregues (aprovadas) por equipe nesta rodada
  const pizzasEntreguesPorEquipe: { [equipeId: string]: number } = {};
  
  const pizzasAprovadas = pizzasDaRodada.filter(pizza => 
    pizza.status === 'avaliada' && 
    pizza.resultado === 'aprovada'
  );

  console.log('Pizzas aprovadas na rodada:', pizzasAprovadas.length);

  pizzasAprovadas.forEach(pizza => {
    pizzasEntreguesPorEquipe[pizza.equipe_id] = (pizzasEntreguesPorEquipe[pizza.equipe_id] || 0) + 1;
  });

  console.log('Pizzas entregues por equipe:', pizzasEntreguesPorEquipe);

  const resultado = {
    pizzasPlanejadas,
    tempoTotalSegundos: rodada.tempo_limite,
    pizzasEntreguesPorEquipe
  };

  console.log('obterDadosRodadaParaTakt - Resultado:', resultado);
  return resultado;
};
