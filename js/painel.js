/* =============================================================
   painel.js — Dashboard / Painel Inicial

   * Desenvolvido com auxílio de IA (Claude/Anthropic)
   
   Mostra informações diferentes conforme o perfil:
   - Coordenador: vê contadores gerais (total de tudo)
   - Professor: vê suas turmas e seus alunos
   - Aluno: vê seus avisos e dados pessoais
   ============================================================= */

let sessaoAtual = null;

document.addEventListener('DOMContentLoaded', () => {
  sessaoAtual = verificarSessao();
  if (!sessaoAtual) return;

  // Saudação personalizada
  document.getElementById('saudacao').textContent =
    '👋 Olá, ' + sessaoAtual.nome.split(' ')[0] + '!';

  // Subtítulo conforme o perfil
  const subtitulos = {
    coordenador: 'Visão geral da escola',
    professor: 'Visão geral das suas turmas',
    aluno: 'Sua agenda escolar'
  };
  document.getElementById('subtitulo').textContent =
    subtitulos[sessaoAtual.perfil] || '';

  carregarCards();
  carregarAvisosRecentes();
});

// Carrega os cards de contadores conforme o perfil
function carregarCards() {
  const grid = document.getElementById('statsGrid');

  if (sessaoAtual.perfil === 'coordenador') {
    carregarCardsCoordenador(grid);
  } else if (sessaoAtual.perfil === 'professor') {
    carregarCardsProfessor(grid);
  } else {
    carregarCardsAluno(grid);
  }
}

// Cards do coordenador: vê tudo
function carregarCardsCoordenador(grid) {
  const usuarios = buscarDados('conectaagenda_usuarios');
  const turmas = buscarDados('conectaagenda_turmas');
  const avisos = buscarDados('conectaagenda_avisos');

  const totalAlunos = usuarios.filter(u => u.perfil === 'aluno').length;
  const totalProfessores = usuarios.filter(u => u.perfil === 'professor').length;

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icone azul">👩‍🎓</div>
      <div class="stat-info">
        <h4>${totalAlunos}</h4>
        <p>Alunos</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icone verde">👨‍🏫</div>
      <div class="stat-info">
        <h4>${totalProfessores}</h4>
        <p>Professores</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icone laranja">📚</div>
      <div class="stat-info">
        <h4>${turmas.length}</h4>
        <p>Turmas</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icone roxo">💬</div>
      <div class="stat-info">
        <h4>${avisos.length}</h4>
        <p>Avisos</p>
      </div>
    </div>
  `;
}

// Cards do professor: suas turmas
function carregarCardsProfessor(grid) {
  const turmas = buscarDados('conectaagenda_turmas');
  const avisos = buscarDados('conectaagenda_avisos');

  // Filtra turmas onde este professor é responsável
  const minhasTurmas = turmas.filter(t => t.professor === sessaoAtual.nome);

  // Conta alunos das minhas turmas
  const usuarios = buscarDados('conectaagenda_usuarios');
  const meusAlunos = usuarios.filter(u =>
    u.perfil === 'aluno' && minhasTurmas.some(t => t.nome === u.turma)
  );

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icone azul">📚</div>
      <div class="stat-info">
        <h4>${minhasTurmas.length}</h4>
        <p>Minhas turmas</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icone verde">👩‍🎓</div>
      <div class="stat-info">
        <h4>${meusAlunos.length}</h4>
        <p>Meus alunos</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icone laranja">💬</div>
      <div class="stat-info">
        <h4>${avisos.length}</h4>
        <p>Avisos</p>
      </div>
    </div>
  `;
}

// Cards do aluno: dados pessoais
function carregarCardsAluno(grid) {
  const avisos = buscarDados('conectaagenda_avisos');

  // Filtra avisos da turma do aluno ou gerais
  const meusAvisos = avisos.filter(a =>
    a.turma === sessaoAtual.turma || a.turma === '' || a.turma === 'Todas'
  );

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icone azul">📚</div>
      <div class="stat-info">
        <h4>${sessaoAtual.turma || '—'}</h4>
        <p>Minha turma</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icone laranja">💬</div>
      <div class="stat-info">
        <h4>${meusAvisos.length}</h4>
        <p>Meus avisos</p>
      </div>
    </div>
  `;
}

// Carrega os avisos recentes
function carregarAvisosRecentes() {
  const avisos = buscarDados('conectaagenda_avisos');
  const container = document.getElementById('avisosRecentes');

  if (avisos.length === 0) {
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icone">📭</div>
        <p>Nenhum aviso ainda.</p>
      </div>
    `;
    return;
  }

  // Filtra conforme o perfil
  let avisosVisiveis = avisos;

  if (sessaoAtual.perfil === 'aluno') {
    avisosVisiveis = avisos.filter(a =>
      a.turma === sessaoAtual.turma || a.turma === '' || a.turma === 'Todas'
    );
  }

  // Mostra os 5 mais recentes
  const recentes = avisosVisiveis.slice(-5).reverse();

  container.innerHTML = recentes.map(aviso => `
    <div style="padding: 12px 0; border-bottom: 1px solid var(--cor-borda);">
      <strong>${aviso.titulo}</strong>
      <p style="font-size: 0.85rem; color: var(--cor-texto-leve); margin-top: 4px;">
        ${aviso.data} — ${aviso.turma || 'Todas as turmas'}
      </p>
    </div>
  `).join('');
}