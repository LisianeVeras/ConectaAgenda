/* =============================================================
   turmas.js — Cadastro de turmas

   * Desenvolvido com auxílio de IA (Claude/Anthropic)
   
   Coordenador: visualiza e altera
   Professor e Aluno: só visualizam
   ============================================================= */

let sessaoAtual = null;

document.addEventListener('DOMContentLoaded', () => {
  // Todos os perfis podem acessar esta página
  sessaoAtual = verificarSessao();
  if (!sessaoAtual) return;

  // Mostra botões de ação só pro coordenador
  if (sessaoAtual.perfil === 'coordenador') {
    document.getElementById('acoesCoord').style.display = 'block';
  }

  carregarProfessoresSelect();
  carregarTabela();
});

// Preenche o select de professores com os cadastrados
function carregarProfessoresSelect() {
  const usuarios = buscarDados('conectaagenda_usuarios');
  const select = document.getElementById('turmaProfessor');

  // Filtra só os professores
  const professores = usuarios.filter(u => u.perfil === 'professor');

  select.innerHTML = '<option value="">Selecione</option>';
  professores.forEach(prof => {
    const option = document.createElement('option');
    option.value = prof.nome;
    option.textContent = prof.nome;
    select.appendChild(option);
  });
}

// Mostra o formulário
function abrirFormulario() {
  document.getElementById('formCard').style.display = 'block';
  document.getElementById('formTitulo').textContent = 'Nova Turma';
  limparFormulario();
}

// Esconde o formulário
function fecharFormulario() {
  document.getElementById('formCard').style.display = 'none';
  limparFormulario();
}

// Salva turma nova ou atualiza existente
function salvarTurma(event) {
  event.preventDefault();

  const editandoId = document.getElementById('editandoId').value;
  const nome = document.getElementById('turmaNome').value.trim();
  const turno = document.getElementById('turmaTurno').value;
  const professor = document.getElementById('turmaProfessor').value;
  const sala = document.getElementById('turmaSala').value.trim();

  let turmas = buscarDados('conectaagenda_turmas');

  // Verifica se já existe turma com mesmo nome (só pra novas)
  if (!editandoId) {
    const existe = turmas.find(t => t.nome.toLowerCase() === nome.toLowerCase());
    if (existe) {
      alert('Já existe uma turma com esse nome!');
      return;
    }
  }

  const turma = {
    id: editandoId || 'turma_' + Date.now(),
    nome: nome,
    turno: turno,
    professor: professor,
    sala: sala
  };

  if (editandoId) {
    // Editando
    const indice = turmas.findIndex(t => t.id === editandoId);
    if (indice !== -1) {
      turmas[indice] = turma;
    }
  } else {
    // Nova turma
    turmas.push(turma);
  }

  salvarDados('conectaagenda_turmas', turmas);
  fecharFormulario();
  carregarTabela();
}

// Conta quantos alunos estão em uma turma
function contarAlunosTurma(nomeTurma) {
  const usuarios = buscarDados('conectaagenda_usuarios');
  return usuarios.filter(u => u.perfil === 'aluno' && u.turma === nomeTurma).length;
}

// Carrega a tabela de turmas
function carregarTabela() {
  const turmas = buscarDados('conectaagenda_turmas');
  const container = document.getElementById('tabelaContainer');

  if (turmas.length === 0) {
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icone">📚</div>
        <p>Nenhuma turma cadastrada ainda.</p>
      </div>
    `;
    return;
  }

  // Monta as colunas de ação só pro coordenador
  const thAcoes = sessaoAtual.perfil === 'coordenador' ? '<th>Ações</th>' : '';

  container.innerHTML = `
    <div class="tabela-container">
      <table class="tabela">
        <thead>
          <tr>
            <th>Turma</th>
            <th>Turno</th>
            <th>Professor(a)</th>
            <th>Sala</th>
            <th>Alunos</th>
            ${thAcoes}
          </tr>
        </thead>
        <tbody>
          ${turmas.map(t => {
            const qtdAlunos = contarAlunosTurma(t.nome);

            // Botões de ação só pro coordenador
            const tdAcoes = sessaoAtual.perfil === 'coordenador' ? `
              <td>
                <div class="tabela-acoes">
                  <button class="btn btn-secundario btn-pequeno" onclick="editarTurma('${t.id}')">
                    ✏️ Editar
                  </button>
                  <button class="btn btn-perigo btn-pequeno" onclick="excluirTurma('${t.id}')">
                    🗑️ Excluir
                  </button>
                </div>
              </td>
            ` : '';

            return `
              <tr>
                <td><strong>${t.nome}</strong></td>
                <td><span class="badge badge-azul">${t.turno}</span></td>
                <td>${t.professor}</td>
                <td>${t.sala || '—'}</td>
                <td><span class="badge badge-verde">${qtdAlunos} aluno(s)</span></td>
                ${tdAcoes}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Preenche o formulário pra editar
function editarTurma(id) {
  const turmas = buscarDados('conectaagenda_turmas');
  const turma = turmas.find(t => t.id === id);
  if (!turma) return;

  document.getElementById('formCard').style.display = 'block';
  document.getElementById('formTitulo').textContent = 'Editar Turma';
  document.getElementById('editandoId').value = turma.id;
  document.getElementById('turmaNome').value = turma.nome;
  document.getElementById('turmaTurno').value = turma.turno;
  document.getElementById('turmaProfessor').value = turma.professor;
  document.getElementById('turmaSala').value = turma.sala || '';
}

// Exclui uma turma
function excluirTurma(id) {
  const turmas = buscarDados('conectaagenda_turmas');
  const turma = turmas.find(t => t.id === id);
  if (!turma) return;

  // Verifica se tem alunos na turma
  const qtdAlunos = contarAlunosTurma(turma.nome);
  if (qtdAlunos > 0) {
    alert('Não é possível excluir: a turma "' + turma.nome + '" ainda tem ' + qtdAlunos + ' aluno(s).');
    return;
  }

  if (!confirm('Tem certeza que deseja excluir a turma "' + turma.nome + '"?')) return;

  const atualizadas = turmas.filter(t => t.id !== id);
  salvarDados('conectaagenda_turmas', atualizadas);
  carregarTabela();
}

// Limpa o formulário
function limparFormulario() {
  document.getElementById('editandoId').value = '';
  document.getElementById('turmaNome').value = '';
  document.getElementById('turmaTurno').value = '';
  document.getElementById('turmaProfessor').value = '';
  document.getElementById('turmaSala').value = '';
}