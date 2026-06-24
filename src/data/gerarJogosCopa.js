const grupos = [
  "A","B","C","D","E","F",
  "G","H","I","J","K","L"
];

const jogos = [];

grupos.forEach((grupo) => {
  for (let i = 1; i <= 6; i++) {
    jogos.push({
      id: `G${grupo}${String(i).padStart(3, "0")}`,
      casa: "A Definir",
      fora: "A Definir",
      fase: `Grupo ${grupo}`,
      data: "",
      estadio: "",
    });
  }
});

export default jogos;