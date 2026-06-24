const jogosCopa = [];

// ====================
// FASE DE GRUPOS
// 12 grupos (A até L)
// 6 jogos por grupo
// Total: 72 jogos
// ====================

const grupos = [
"A", "B", "C", "D", "E", "F",
"G", "H", "I", "J", "K", "L"
];

grupos.forEach((grupo) => {
for (let i = 1; i <= 6; i++) {
jogosCopa.push({
id: `G${grupo}${String(i).padStart(3, "0")}`,
casa: "A Definir",
fora: "A Definir",
fase: `Grupo ${grupo}`,
data: "",
estadio: "",
});
}
});

// ====================
// 32 AVOS
// 16 jogos
// ====================

for (let i = 1; i <= 16; i++) {
jogosCopa.push({
id: `32A${String(i).padStart(3, "0")}`,
casa: "A Definir",
fora: "A Definir",
fase: "32 Avos",
data: "",
estadio: "",
});
}

// ====================
// 16 AVOS
// 8 jogos
// ====================

for (let i = 1; i <= 8; i++) {
jogosCopa.push({
id: `16A${String(i).padStart(3, "0")}`,
casa: "A Definir",
fora: "A Definir",
fase: "16 Avos",
data: "",
estadio: "",
});
}

// ====================
// OITAVAS
// 8 jogos
// ====================

for (let i = 1; i <= 8; i++) {
jogosCopa.push({
id: `OIT${String(i).padStart(3, "0")}`,
casa: "A Definir",
fora: "A Definir",
fase: "Oitavas",
data: "",
estadio: "",
});
}

// ====================
// QUARTAS
// 4 jogos
// ====================

for (let i = 1; i <= 4; i++) {
jogosCopa.push({
id: `QUA${String(i).padStart(3, "0")}`,
casa: "A Definir",
fora: "A Definir",
fase: "Quartas",
data: "",
estadio: "",
});
}

// ====================
// SEMIFINAL
// 2 jogos
// ====================

for (let i = 1; i <= 2; i++) {
jogosCopa.push({
id: `SEM${String(i).padStart(3, "0")}`,
casa: "A Definir",
fora: "A Definir",
fase: "Semifinal",
data: "",
estadio: "",
});
}

// ====================
// TERCEIRO LUGAR
// ====================

jogosCopa.push({
id: "TER001",
casa: "A Definir",
fora: "A Definir",
fase: "Terceiro Lugar",
data: "",
estadio: "",
});

// ====================
// FINAL
// ====================

jogosCopa.push({
id: "FIN001",
casa: "A Definir",
fora: "A Definir",
fase: "Final",
data: "",
estadio: "",
});

export default jogosCopa;
