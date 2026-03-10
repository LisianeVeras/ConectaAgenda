
/* =============================================================
   avisos.js — Sistema de avisos e tarefas

   * Desenvolvido com auxílio de IA (Claude/Anthropic)
   
   Coordenador e Professor: visualizam e postam
   Aluno: só visualiza (da sua turma + gerais)
   ============================================================= */

let sessaoAtual = null;

document.addEventListener('DOMContentLoaded', () => {
  sessaoAtual = verificarSessao();
  if (!sessaoAtual) return;

  // Mostra botão de postar só pra coordenador e professor
  if (sessaoAtual.perfil === 'coordenador' || sessaoAtual.perfil === 'professor') {
    document.getElementById('acoesPostar').style.display = 'block';
  }

  // Aluno não vê filtros (só vê os avisos dele)
  if (sessaoAtual.perfil === 'aluno') {
    document.getElementById('filtrosCard').style.display = 'none';
    document.getElementById('subtituloAvisos').textContent =
      'Avisos da sua turma: ' + (sessaoAtual.turma || '');
  }

  carregarTurmasSelect();
  carregarAvisos();
});

// Preenche os selects de turma
function carregarTurmasSelect() {
  const turmas = buscarDados('conectaagenda_turmas');

  // Select do formulário
  const selectForm = document.getElementById('avisoTurma');
  selectForm.innerHTML = '<option value="Todas">Todas as turmas</option>';

  // Select do filtro
  const selectFiltro = document.getElementById('filtroTurma');
  selectFiltro.innerHTML = '<option value="">Todas</option>';

  turmas.forEach(turma => {
    const opt1 = document.createElement('option');
    opt1.value = turma.nome;
    opt1.textContent = turma.nome;
    selectForm.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = turma.nome;
    opt2.textContent = turma.nome;
    selectFiltro.appendChild(opt2);
  });
}

// Mostra o formulário
function abrirFormulario() {
  document.getElementById('formCard').style.display = 'block';
  document.getElementById('formTitulo').textContent = 'Novo Aviso';
  limparFormulario();
}

// Esconde o formulário
function fecharFormulario() {
  document.getElementById('formCard').style.display = 'none';
  limparFormulario();
}

// Salva aviso novo ou atualiza existente
function salvarAviso(event) {
  event.preventDefault();

  const editandoId = document.getElementById('editandoId').value;
  const titulo = document.getElementById('avisoTitulo').value.trim();
  const tipo = document.getElementById('avisoTipo').value;
  const turma = document.getElementById('avisoTurma').value;
  const dataEntrega = document.getElementById('avisoData').value;
  const mensagem = document.getElementById('avisoMensagem').value.trim();

  let avisos = buscarDados('conectaagenda_avisos');

  const aviso = {
    id: editandoId || 'aviso_' + Date.now(),
    titulo: titulo,
    tipo: tipo,
    turma: turma,
    dataEntrega: dataEntrega,
    mensagem: mensagem,
    autor: sessaoAtual.nome,
    autorPerfil: sessaoAtual.perfil,
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };

  if (editandoId) {
    // Editando
    const indice = avisos.findIndex(a => a.id === editandoId);
    if (indice !== -1) {
      // Mantém data original
      aviso.data = avisos[indice].data;
      aviso.hora = avisos[indice].hora;
      avisos[indice] = aviso;
    }
  } else {
    // Novo
    avisos.push(aviso);
  }

  salvarDados('conectaagenda_avisos', avisos);
  fecharFormulario();
  carregarAvisos();
}

// Carrega e exibe os avisos
function carregarAvisos() {
  let avisos = buscarDados('conectaagenda_avisos');
  const container = document.getElementById('listaAvisos');

  // Se é aluno, filtra só os da turma dele + gerais
  if (sessaoAtual.perfil === 'aluno') {
    avisos = avisos.filter(a =>
      a.turma === sessaoAtual.turma || a.turma === 'Todas'
    );
  } else {
    // Aplica filtros dos selects
    const filtroTurma = document.getElementById('filtroTurma').value;
    const filtroTipo = document.getElementById('filtroTipo').value;

    if (filtroTurma) {
      avisos = avisos.filter(a => a.turma === filtroTurma || a.turma === 'Todas');
    }
    if (filtroTipo) {
      avisos = avisos.filter(a => a.tipo === filtroTipo);
    }
  }

  if (avisos.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="vazio">
          <div class="vazio-icone">💬</div>
          <p>Nenhum aviso encontrado.</p>
        </div>
      </div>
    `;
    return;
  }

  // Mais recente primeiro
  const ordenados = avisos.slice().reverse();

  container.innerHTML = ordenados.map(aviso => {
    // Configuração do badge por tipo
    const tipoConfig = {
      geral:   { label: 'Geral',   classe: 'badge-azul' },
      tarefa:  { label: 'Tarefa',  classe: 'badge-verde' },
      prova:   { label: 'Prova',   classe: 'badge-amarelo' },
      evento:  { label: 'Evento',  classe: 'badge-azul' },
      urgente: { label: 'Urgente', classe: 'badge-vermelho' }
    };
    const config = tipoConfig[aviso.tipo] || tipoConfig.geral;

    // Data de entrega formatada
    let dataEntregaTexto = '';
    if (aviso.dataEntrega) {
      const partes = aviso.dataEntrega.split('-');
      dataEntregaTexto = ` | 📅 Entrega: ${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // Botões de ação só pra quem pode editar
    let botoesAcao = '';
    if (sessaoAtual.perfil === 'coordenador' ||
        (sessaoAtual.perfil === 'professor' && aviso.autor === sessaoAtual.nome)) {
      botoesAcao = `
        <div class="aviso-acoes">
          <button class="btn btn-secundario btn-pequeno" onclick="editarAviso('${aviso.id}')">
            ✏️ Editar
          </button>
          <button class="btn btn-perigo btn-pequeno" onclick="excluirAviso('${aviso.id}')">
            🗑️ Excluir
          </button>
        </div>
      `;
    }

    return `
      <div class="card" style="margin-bottom: 12px;">
        <div class="aviso-card tipo-${aviso.tipo}">
          <div class="aviso-header">
            <h4>${aviso.titulo}</h4>
            <span class="badge ${config.classe}">${config.label}</span>
          </div>
          <div class="aviso-corpo">${aviso.mensagem}</div>
          <div class="aviso-meta">
            <span>📚 ${aviso.turma}</span>
            <span>✍️ ${aviso.autor}</span>
            <span>🕐 ${aviso.data} ${aviso.hora}</span>
            ${dataEntregaTexto}
          </div>
          ${botoesAcao}
        </div>
      </div>
    `;
  }).join('');
}

// Editar aviso
function editarAviso(id) {
  const avisos = buscarDados('conectaagenda_avisos');
  const aviso = avisos.find(a => a.id === id);
  if (!aviso) return;

  document.getElementById('formCard').style.display = 'block';
  document.getElementById('formTitulo').textContent = 'Editar Aviso';
  document.getElementById('editandoId').value = aviso.id;
  document.getElementById('avisoTitulo').value = aviso.titulo;
  document.getElementById('avisoTipo').value = aviso.tipo;
  document.getElementById('avisoTurma').value = aviso.turma;
  document.getElementById('avisoData').value = aviso.dataEntrega || '';
  document.getElementById('avisoMensagem').value = aviso.mensagem;
}

// Excluir aviso
function excluirAviso(id) {
  if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

  let avisos = buscarDados('conectaagenda_avisos');
  avisos = avisos.filter(a => a.id !== id);
  salvarDados('conectaagenda_avisos', avisos);
  carregarAvisos();
}

// Limpa o formulário
function limparFormulario() {
  document.getElementById('editandoId').value = '';
  document.getElementById('avisoTitulo').value = '';
  document.getElementById('avisoTipo').value = 'geral';
  document.getElementById('avisoTurma').value = 'Todas';
  document.getElementById('avisoData').value = '';
  document.getElementById('avisoMensagem').value = '';
}