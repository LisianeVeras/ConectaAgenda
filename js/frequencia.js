/* =============================================================
   frequencia.js — Controle de frequência

   * Desenvolvido com auxílio de IA (Claude/Anthropic)
   
   Professor: registra presenças e faltas
   Coordenador: visualiza
   Aluno: visualiza só o próprio

   Estrutura dos dados no localStorage:
   {
     alunoId: "aluno01",
     presencas: 15,
     faltas: [
       { data: "10/03/2026" },
       { data: "15/03/2026" }
     ]
   }
   ============================================================= */

let sessaoAtual = null;

document.addEventListener('DOMContentLoaded', () => {
  sessaoAtual = verificarSessao();
  if (!sessaoAtual) return;

  if (sessaoAtual.perfil === 'aluno') {
    // Aluno vê só o próprio
    document.getElementById('visaoAluno').style.display = 'block';
    document.getElementById('subtituloFrequencia').textContent = 'Sua frequência escolar';
    carregarMinhaFrequencia();
  } else {
    // Professor e coordenador veem a turma
    document.getElementById('visaoProfessor').style.display = 'block';
    carregarTurmasSelect();
    definirDataHoje();
  }
});

// Define a data de hoje no campo
function definirDataHoje() {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('frequenciaData').value = hoje;
}

// Preenche o select de turmas
function carregarTurmasSelect() {
  const turmas = buscarDados('conectaagenda_turmas');
  const select = document.getElementById('frequenciaTurma');

  select.innerHTML = '<option value="">Selecione a turma</option>';
  turmas.forEach(turma => {
    const option = document.createElement('option');
    option.value = turma.nome;
    option.textContent = turma.nome;
    select.appendChild(option);
  });
}

// Carrega alunos da turma selecionada
function carregarAlunosTurma() {
  const turmaSelecionada = document.getElementById('frequenciaTurma').value;
  const container = document.getElementById('listaAlunosTurma');

  if (!turmaSelecionada) {
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icone">📋</div>
        <p>Selecione uma turma para ver os alunos.</p>
      </div>
    `;
    return;
  }

  // Busca alunos dessa turma
  const usuarios = buscarDados('conectaagenda_usuarios');
  const alunos = usuarios.filter(u => u.perfil === 'aluno' && u.turma === turmaSelecionada);

  if (alunos.length === 0) {
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icone">👩‍🎓</div>
        <p>Nenhum aluno nesta turma.</p>
      </div>
    `;
    return;
  }

  // Busca dados de frequência
  const frequencias = buscarDados('conectaagenda_frequencia');

  // Verifica se o professor pode editar
  const podeEditar = sessaoAtual.perfil === 'professor';

  container.innerHTML = alunos.map(aluno => {
    // Busca frequência deste aluno
    let freq = frequencias.find(f => f.alunoId === aluno.id);
    if (!freq) {
      freq = { alunoId: aluno.id, presencas: 0, faltas: [] };
    }

    // Botões de ação (só professor)
    let botoesAcao = '';
    if (podeEditar) {
      botoesAcao = `
        <button class="btn btn-sucesso btn-pequeno" onclick="adicionarPresenca('${aluno.id}')">
          ✅ +Presença
        </button>
        <button class="btn btn-perigo btn-pequeno" onclick="registrarFalta('${aluno.id}')">
          ❌ +Falta
        </button>
      `;
    }

    // Lista de faltas
    let listaFaltas = '';
    if (freq.faltas.length > 0) {
      listaFaltas = `
        <div class="faltas-lista">
          ${freq.faltas.map((falta, index) => `
            <div class="falta-item">
              <span>📅 Falta em ${falta.data}</span>
              ${podeEditar ? `
                <button class="btn btn-perigo btn-pequeno" onclick="removerFalta('${aluno.id}', ${index})" style="padding: 2px 8px; font-size: 0.7rem;">
                  ✕
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="frequencia-item" style="flex-wrap: wrap;">
        <span class="frequencia-nome">${aluno.nome}</span>
        <div class="frequencia-contador">
          <span class="numero-presencas">✅ ${freq.presencas} presenças</span>
          <span>|</span>
          <span class="numero-faltas">❌ ${freq.faltas.length} faltas</span>
        </div>
        ${botoesAcao}
        ${listaFaltas}
      </div>
    `;
  }).join('');
}

// Adiciona uma presença ao aluno
function adicionarPresenca(alunoId) {
  let frequencias = buscarDados('conectaagenda_frequencia');
  let freq = frequencias.find(f => f.alunoId === alunoId);

  if (!freq) {
    freq = { alunoId: alunoId, presencas: 0, faltas: [] };
    frequencias.push(freq);
  }

  freq.presencas++;

  // Atualiza no array
  const indice = frequencias.findIndex(f => f.alunoId === alunoId);
  frequencias[indice] = freq;

  salvarDados('conectaagenda_frequencia', frequencias);
  carregarAlunosTurma();
}

// Registra uma falta com a data selecionada
function registrarFalta(alunoId) {
  const dataInput = document.getElementById('frequenciaData').value;

  if (!dataInput) {
    alert('Selecione a data da falta!');
    return;
  }

  // Formata a data pra DD/MM/AAAA
  const partes = dataInput.split('-');
  const dataFormatada = partes[2] + '/' + partes[1] + '/' + partes[0];

  let frequencias = buscarDados('conectaagenda_frequencia');
  let freq = frequencias.find(f => f.alunoId === alunoId);

  if (!freq) {
    freq = { alunoId: alunoId, presencas: 0, faltas: [] };
    frequencias.push(freq);
  }

  // Verifica se já tem falta nessa data
  const jaExiste = freq.faltas.some(f => f.data === dataFormatada);
  if (jaExiste) {
    alert('Já existe falta registrada nesta data para este aluno!');
    return;
  }

  freq.faltas.push({ data: dataFormatada });

  // Ordena faltas por data
  freq.faltas.sort((a, b) => {
    const dataA = a.data.split('/').reverse().join('');
    const dataB = b.data.split('/').reverse().join('');
    return dataA.localeCompare(dataB);
  });

  // Atualiza no array
  const indice = frequencias.findIndex(f => f.alunoId === alunoId);
  frequencias[indice] = freq;

  salvarDados('conectaagenda_frequencia', frequencias);
  carregarAlunosTurma();
}

// Remove uma falta
function removerFalta(alunoId, indiceFalta) {
  if (!confirm('Remover esta falta?')) return;

  let frequencias = buscarDados('conectaagenda_frequencia');
  let freq = frequencias.find(f => f.alunoId === alunoId);
  if (!freq) return;

  freq.faltas.splice(indiceFalta, 1);

  const indice = frequencias.findIndex(f => f.alunoId === alunoId);
  frequencias[indice] = freq;

  salvarDados('conectaagenda_frequencia', frequencias);
  carregarAlunosTurma();
}

// ============ VISÃO DO ALUNO ============

function carregarMinhaFrequencia() {
  const frequencias = buscarDados('conectaagenda_frequencia');
  const container = document.getElementById('minhaFrequencia');

  const freq = frequencias.find(f => f.alunoId === sessaoAtual.id);

  if (!freq || (freq.presencas === 0 && freq.faltas.length === 0)) {
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icone">📋</div>
        <p>Nenhum registro de frequência ainda.</p>
      </div>
    `;
    return;
  }

  const totalAulas = freq.presencas + freq.faltas.length;
  const porcentagem = totalAulas > 0 ? Math.round((freq.presencas / totalAulas) * 100) : 0;

  // Cor conforme porcentagem
  let corPorcentagem = 'var(--cor-sucesso)';
  if (porcentagem < 70) corPorcentagem = 'var(--cor-perigo)';
  else if (porcentagem < 85) corPorcentagem = 'var(--cor-aviso)';

  let listaFaltas = '<p style="color: var(--cor-texto-leve); font-size: 0.85rem;">Nenhuma falta registrada!</p>';
  if (freq.faltas.length > 0) {
    listaFaltas = freq.faltas.map(falta => `
      <div class="falta-item">
        <span>📅 ${falta.data}</span>
      </div>
    `).join('');
  }

  container.innerHTML = `
    <div class="frequencia-resumo">
      <div class="frequencia-resumo-card" style="background: #F0FFF4;">
        <h4 style="color: var(--cor-sucesso);">${freq.presencas}</h4>
        <p>Presenças</p>
      </div>
      <div class="frequencia-resumo-card" style="background: #FFF5F5;">
        <h4 style="color: var(--cor-perigo);">${freq.faltas.length}</h4>
        <p>Faltas</p>
      </div>
      <div class="frequencia-resumo-card">
        <h4 style="color: ${corPorcentagem};">${porcentagem}%</h4>
        <p>Frequência</p>
      </div>
    </div>

    <h4 style="margin-bottom: 12px;">📅 Datas das faltas</h4>
    ${listaFaltas}
  `;
}