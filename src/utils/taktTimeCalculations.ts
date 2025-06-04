
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
  // Calcular tempo médio por pizza da rodada
  const tempoMedioPorPizza = rodadaData.tempoTotalSegundos / rodadaData.pizzasPlanejadas;

  return equipes.map(equipe => {
    const pizzasEntregues = rodadaData.pizzasEntreguesPorEquipe[equipe.id] || 0;
    
    // Takt Time da equipe = (soma dos takts de cada pizza entregue) / tempo_médio_por_pizza
    // Para simplificar, assumimos que cada pizza tem o mesmo takt time da equipe
    // Takt Time = tempo_total_usado / pizzas_entregues
    // Como não temos tempo real usado, usamos uma aproximação baseada na eficiência
    const taktTime = pizzasEntregues > 0 ? tempoMedioPorPizza / (pizzasEntregues / rodadaData.pizzasPlanejadas) : 0;

    return {
      equipeNome: equipe.nome,
      taktTime: Number(taktTime.toFixed(2)),
      pizzasEntregues,
      tempoMedioPorPizza: Number(tempoMedioPorPizza.toFixed(2))
    };
  });
};

export const obterDadosRodadaParaTakt = (
  rodadaId: string,
  pizzas: Array<{ equipe_id: string; rodada_id: string; status: string; resultado: string }>,
  rodada: { tempo_limite: number } | null,
  pizzasPlanejadas: number = 10 // Valor padrão, pode ser configurável
): RodadaData | null => {
  if (!rodada) return null;

  // Contar pizzas entregues (aprovadas) por equipe nesta rodada
  const pizzasEntreguesPorEquipe: { [equipeId: string]: number } = {};
  
  pizzas
    .filter(pizza => 
      pizza.rodada_id === rodadaId && 
      pizza.status === 'avaliada' && 
      pizza.resultado === 'aprovada'
    )
    .forEach(pizza => {
      pizzasEntreguesPorEquipe[pizza.equipe_id] = (pizzasEntreguesPorEquipe[pizza.equipe_id] || 0) + 1;
    });

  return {
    pizzasPlanejadas,
    tempoTotalSegundos: rodada.tempo_limite,
    pizzasEntreguesPorEquipe
  };
};
